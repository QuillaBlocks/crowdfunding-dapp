import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaca · Crowdfunding on Stellar",
  description:
    "Demo dApp de crowdfunding sobre Stellar (Soroban). Pon las reglas de la vaca en código.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="bg-navy-900">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased text-white selection:bg-amarillo selection:text-navy-900">
        {children}
      </body>
    </html>
  );
}
