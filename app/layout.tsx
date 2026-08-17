import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Analyzer | Reliance & Nifty 50 Real-Time Dashboard",
  description: "Live stock rates, TradingView candlestick charts, SMA/EMA/RSI technical indicators, and Nifty 50 heatmap grid for Reliance Industries and Indian stock markets.",
  keywords: ["Reliance Industries", "Nifty 50", "Stock Charts", "TradingView", "NSE", "Technical Indicators", "RSI", "MACD"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">{children}</body>
    </html>
  );
}
