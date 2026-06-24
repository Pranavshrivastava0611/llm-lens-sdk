import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Lens | Observability for the Agentic Era",
  description: "LLM Lens provides high-fidelity tracing and real-time observability for agentic workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-base antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
