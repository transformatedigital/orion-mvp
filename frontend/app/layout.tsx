import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import ConditionalMain from "@/components/ConditionalMain";

export const metadata: Metadata = {
  title: "Orión AI Monitor",
  description: "Plataforma de monitoreo de flota Orión AI Monitor",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50">
        <ConditionalNavbar />
        <ConditionalMain>{children}</ConditionalMain>
      </body>
    </html>
  );
}
