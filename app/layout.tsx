import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { Poppins } from "next/font/google";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Tasks App",
};
interface LayoutProps {
  children: ReactNode;
}

const poppinsInit = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: "400",
});

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${poppinsInit.variable} ${poppinsInit.style.fontWeight} antialiased bg-white text-black w-screen h-screen max-w-[100vw] max-h-[100vh]`}
      >
        {children}
      </body>
    </html>
  );
}
