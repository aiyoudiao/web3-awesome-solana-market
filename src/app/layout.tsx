import "@/lib/polyfill"; // Polyfill Buffer for Solana
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppEffects } from "@/components/AppEffects";
import { ViewController } from "@/components/ViewController";
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Polyscore - Solana Prediction Market",
  description: "Next-gen prediction market with 3D immersive experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-background font-sans text-foreground flex flex-col`}>
        <Providers>
          {/* 应用级特效 (背景、光标、3D场景) */}
          <AppEffects />
          
          {/* 视图控制器 (负责 2D 内容的显隐) */}
          <ViewController>
            {children}
          </ViewController>
        </Providers>
      </body>
    </html>
  );
}
