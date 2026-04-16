import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NPD 应对教练 - AI 心理自助训练工具",
  description:
    "通过 AI 模拟对话和教练指导，帮助你识别 NPD 操控模式、练习应对策略、重建心理边界。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
