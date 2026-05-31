import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "../components/admin-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASUR Admin",
  description: "Operations dashboard for ASUR commerce"
};

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AdminSidebar>{children}</AdminSidebar>
      </body>
    </html>
  );
}
