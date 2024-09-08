import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { Poppins } from "next/font/google";
// import { FaCalendarMinus } from "react-icons/fa";
// import { useRouter } from "next/router";
// import { usePathname } from "next/navigation";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Tasks App",
};
interface LayoutProps {
  children: ReactNode;
}

export const poppinsInit = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: "400",
});

export default function RootLayout({ children }: LayoutProps) {
  // const pathname = usePathname();

  // console.log(pathname);
  return (
    <html lang="en">
      <body
        className={`${poppinsInit.variable} ${poppinsInit.style.fontWeight} antialiased bg-white text-black w-screen h-screen max-w-[100vw] max-h-[100vh]`}
      >
        {/* <header className="bg-blue-600 text-white flex justify-between py-3 px-4 items-center">
          <FaCalendarMinus />
          <div className="flex gap-x-6">
            <button
              className="bg-white rounded-md text-blue-500 px-2 py-1 font-medium"
              disabled={true}
            >
              Login
            </button>
            <button className="">Signup</button>
          </div>
        </header> */}
        {children}
      </body>
    </html>
  );
}
