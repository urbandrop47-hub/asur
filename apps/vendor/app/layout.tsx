import type { Metadata } from "next";
import type { ReactNode } from "react";
import { VendorShell } from "../components/vendor-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASUR Vendor",
  description: "Vendor fulfillment workspace for ASUR commerce"
};

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <VendorShell>{children}</VendorShell>
      </body>
    </html>
  );
}
