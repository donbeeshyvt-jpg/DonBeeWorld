import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_TC } from "next/font/google";

import "./globals.css";
import { I18nProvider } from "./i18n/I18nContext";
import { AuthProvider } from "./auth/AuthContext";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap"
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "冬蜜酒館 | DonBeeWorld",
  description:
    "史萊姆酒館即時營運介面，整合採集、冒險、經濟、聊天與贊助系統。",
  icons: {
    icon: [
      {
        url: "/server-icon.png",
        type: "image/png",
        sizes: "64x64"
      }
    ],
    shortcut: "/server-icon.png",
    apple: "/server-icon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${notoSansTC.variable} ${cormorant.variable} antialiased`}
      >
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
