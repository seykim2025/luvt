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
  title: "LUV.T - 테니스 대회 멤버십",
  description: "매주 열리는 LUV.T 테니스 대회 멤버십 플랫폼입니다. 참가 신청, 기록 관리, 스탬프 혜택, 파트너 찾기까지 한 곳에서 즐겨보세요!",
  openGraph: {
    title: "LUV.T (럽티) - 테니스 대회 멤버십",
    description: "참가 신청부터 기록 관리, 스탬프 혜택, 파트너 찾기까지! LUV.T 오픈과 함께 테니스를 더 즐겁게.",
    siteName: "LUV.T",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
