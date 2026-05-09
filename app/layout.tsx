import type { Metadata } from "next";
import "./globals.css";
import ChatBubble from "@/components/ChatBubble";

export const metadata: Metadata = {
  title: "Natalie Suleyman MP — Demo Site",
  description:
    "Demonstration site showcasing an AI assistant for The Hon. Natalie Suleyman MP, State Member for St Albans.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <ChatBubble />
      </body>
    </html>
  );
}
