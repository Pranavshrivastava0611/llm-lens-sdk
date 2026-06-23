import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Autopilot — Observability Dashboard",
  description: "Real-time LLM observability with AI-powered insights. Monitor traces, tokens, latency, and patterns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#e5e5e5",
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
