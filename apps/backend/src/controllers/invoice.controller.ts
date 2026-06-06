import type { RequestHandler } from "express";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../lib/async-handler";
import { orderRepository } from "../repositories/order.repository";
import type { Order } from "@asur/types";
import { SiteConfigModel, makeDefaultConfig } from "../models/site-config.model";
import { hasMongoConnection } from "../config/env";

// Indian states in Maharashtra → CGST+SGST, others → IGST
const MAHARASHTRA_STATE = "maharashtra";
const HSN_CODE = "6211"; // woven garments (generic HSN for apparel)

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── GET /api/v1/orders/:id/invoice ─────────────────────────────────────────────
export const downloadInvoiceController: RequestHandler = asyncHandler(async (req, res) => {
  const rawId = req.params.id;
  const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
  const order = await orderRepository.findByIdAdmin(orderId) as Order | null;
  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  // Only issued for delivered (and paid) orders
  if (!["delivered", "shipped", "packed", "processing"].includes(order.status)) {
    res.status(400).json({ success: false, message: "Invoice not yet available for this order status" });
    return;
  }

  let siteConfig = makeDefaultConfig() as { gstin?: string; businessName?: string; businessAddress?: string; gstRate: number };
  if (hasMongoConnection) {
    const doc = await SiteConfigModel.findById("singleton").lean().exec();
    if (doc) siteConfig = doc as unknown as typeof siteConfig;
  }

  const gstRate = siteConfig.gstRate ?? 0.18;
  const businessName = siteConfig.businessName ?? "ASUR";
  const businessAddress = siteConfig.businessAddress ?? "Mumbai, Maharashtra, India";
  const gstin = siteConfig.gstin ?? "";

  const customerState = (order.shippingAddress?.state ?? "").toLowerCase();
  const isIntraState = customerState.includes(MAHARASHTRA_STATE) || customerState === "mh";
  const halfGst = gstRate / 2;

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="ASUR-Invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.fontSize(22).font("Helvetica-Bold").text(businessName, 50, 50);
  doc.fontSize(9).font("Helvetica").fillColor("#666").text(businessAddress, 50, 78);
  if (gstin) doc.text(`GSTIN: ${gstin}`, 50, 90);

  doc.fontSize(18).font("Helvetica-Bold").fillColor("#000").text("TAX INVOICE", 400, 50, { align: "right" });
  doc.fontSize(9).font("Helvetica").fillColor("#666")
    .text(`Invoice #: ${order.orderNumber}`, 400, 78, { align: "right" })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 400, 90, { align: "right" });

  doc.moveTo(50, 110).lineTo(545, 110).stroke("#ddd");

  // ── Bill To ─────────────────────────────────────────────────────────────────
  const addr = order.shippingAddress;
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#000").text("BILL TO:", 50, 125);
  doc.fontSize(9).font("Helvetica").fillColor("#333")
    .text(addr?.fullName ?? "", 50, 138)
    .text(addr?.line1 ?? "", 50, 150)
    .text(addr?.line2 ? addr.line2 + "\n" : "", 50, 162)
    .text(`${addr?.city ?? ""}, ${addr?.state ?? ""} – ${addr?.postalCode ?? ""}`, 50, addr?.line2 ? 175 : 162)
    .text(addr?.country ?? "India", 50, addr?.line2 ? 187 : 175)
    .text(`Ph: ${addr?.phone ?? ""}`, 50, addr?.line2 ? 199 : 187);

  const supplyType = isIntraState ? "Intra-State" : "Inter-State";
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#000").text("Supply Type:", 350, 125);
  doc.fontSize(9).font("Helvetica").fillColor("#333").text(supplyType, 350, 138);

  // ── Line Items Table ─────────────────────────────────────────────────────────
  const tableTop = 230;
  const cols = { item: 50, hsn: 230, qty: 290, price: 340, taxable: 400, tax: 460, total: 505 };

  doc.moveTo(50, tableTop - 5).lineTo(545, tableTop - 5).stroke("#ddd");
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#555")
    .text("ITEM / SKU", cols.item, tableTop)
    .text("HSN", cols.hsn, tableTop)
    .text("QTY", cols.qty, tableTop)
    .text("UNIT ₹", cols.price, tableTop)
    .text("TAXABLE", cols.taxable, tableTop)
    .text(isIntraState ? "GST\nCGST+SGST" : "IGST", cols.tax, tableTop)
    .text("TOTAL", cols.total, tableTop);
  doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).stroke("#ddd");

  // Prices in the order are GST-exclusive (tax = taxableAmount * gstRate is added on top).
  // Allocate the order-level discount proportionally across items so each item's
  // taxable line is correct and sum(taxable) + sum(gst) = order.total.
  const orderSubtotal = order.subtotal ?? 0;
  const couponDiscount = order.discountAmount ?? 0;
  const orderTax = order.tax ?? 0;
  const discountRatio = orderSubtotal > 0 ? couponDiscount / orderSubtotal : 0;

  let y = tableTop + 26;
  let totalTaxable = 0;
  let totalGstAmount = 0;

  for (const item of order.items ?? []) {
    // item.unitPrice is GST-exclusive variant price
    const lineTotal = item.totalPrice; // unitPrice * quantity
    const lineDiscount = Math.round(lineTotal * discountRatio);
    const lineTaxable = lineTotal - lineDiscount;
    const lineGst = Math.round(lineTaxable * gstRate);
    totalTaxable += lineTaxable;
    totalGstAmount += lineGst;

    doc.fontSize(8).font("Helvetica").fillColor("#222")
      .text(item.title, cols.item, y, { width: 175, ellipsis: true })
      .text(item.variantSku ?? HSN_CODE, cols.hsn, y)
      .text(String(item.quantity), cols.qty, y)
      .text(fmt(item.unitPrice), cols.price, y)
      .text(fmt(lineTaxable), cols.taxable, y)
      .text(fmt(lineGst), cols.tax, y)
      .text(fmt(lineTotal), cols.total, y);

    y += 20;
    if (y > 680) {
      doc.addPage();
      y = 50;
    }
  }

  doc.moveTo(50, y + 4).lineTo(545, y + 4).stroke("#ddd");
  y += 14;

  // Use authoritative order-level tax (matches what customer was charged)
  const gstAmount = orderTax;

  // ── Tax Summary ──────────────────────────────────────────────────────────────
  const summaryX = 330;
  doc.fontSize(8).font("Helvetica").fillColor("#555");

  const summaryLine = (label: string, value: string, bold = false) => {
    if (bold) doc.font("Helvetica-Bold").fillColor("#000");
    else doc.font("Helvetica").fillColor("#555");
    doc.text(label, summaryX, y).text(value, cols.total, y);
    y += 16;
  };

  summaryLine("Subtotal", fmt(orderSubtotal));
  if (couponDiscount > 0) summaryLine("Discount", `- ${fmt(couponDiscount)}`);
  if (isIntraState) {
    summaryLine(`CGST @ ${(halfGst * 100).toFixed(1)}%`, fmt(Math.round(gstAmount / 2)));
    summaryLine(`SGST @ ${(halfGst * 100).toFixed(1)}%`, fmt(Math.round(gstAmount / 2)));
  } else {
    summaryLine(`IGST @ ${(gstRate * 100).toFixed(1)}%`, fmt(gstAmount));
  }
  if ((order.shipping ?? 0) > 0) summaryLine("Shipping", fmt(order.shipping));
  if ((order.loyaltyDiscount ?? 0) > 0) summaryLine("Loyalty Points", `- ${fmt(order.loyaltyDiscount ?? 0)}`);
  if ((order.giftCardAmount ?? 0) > 0) summaryLine("Gift Card", `- ${fmt(order.giftCardAmount ?? 0)}`);
  summaryLine("TOTAL", fmt(order.total), true);

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.fontSize(8).font("Helvetica").fillColor("#999")
    .text("This is a computer-generated invoice and does not require a signature.", 50, 760, { align: "center", width: 495 })
    .text("Thank you for shopping with ASUR.", 50, 773, { align: "center", width: 495 });

  doc.end();
});
