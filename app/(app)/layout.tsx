"use client";

// import type { Metadata } from "next";
import { ReactNode } from "react";
// import "./globals.css";
import { Poppins } from "next/font/google";
import { FaCalendarMinus } from "react-icons/fa";
// import { useRouter } from "next/router";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { auth } from "@/utils/firebase";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";

// export const metadata: Metadata = {
//   title: "Tasks",
//   description: "Tasks App",
// };
interface LayoutProps {
  children: ReactNode;
}

// export async function generateMetadata({
//   params,
// }: {
//   params: { slug?: string };
// }) {
//   const pathname = params.slug ? `/${params.slug}` : "/";

//   if (pathname === "/login") {
//     return {
//       title: "Login",
//       description: "Login to Tasks App",
//     };
//   } else if (pathname === "/signup") {
//     return {
//       title: "Signup",
//       description: "Signup to Tasks App",
//     };
//   }

//   return {
//     title: "Tasks",
//     description: "Welcome to Tasks App",
//   };
// }

export const poppinsInit = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: "400",
});

export default function RootLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, loading] = useAuthState(auth);
  const [signOut] = useSignOut(auth);

  // console.log(pathname);

  const switchRoute = (route: string) => {
    if (pathname === route) {
      return;
    }
    router.replace(route);
  };

  const handleLogout = async () => {
    const isLoggedOut = await signOut();

    if (!isLoggedOut) {
      console.error("Failed to logout");
    }
  };

  return (
    <html lang="en">
      <body
        className={`${poppinsInit.variable} ${poppinsInit.style.fontWeight} antialiased bg-white text-black w-screen h-screen max-w-[100vw] max-h-[100vh] !overflow-hidden`}
      >
        <header className="bg-blue-600 text-white flex justify-between py-3 px-4 items-center">
          <FaCalendarMinus />
          <div className="flex gap-x-6">
            {user ? (
              <button
                className={`bg-orange-600 rounded-md px-2 py-1 font-medium`}
                onClick={() => handleLogout()}
              >
                Logout
              </button>
            ) : null}

            {!loading && !user ? (
              <>
                <button
                  className={`disabled:bg-white disabled:text-blue-500 rounded-md  px-2 py-1 font-medium`}
                  disabled={pathname === "/login"}
                  onClick={() => switchRoute("/login")}
                >
                  Login
                </button>
                <button
                  className={`disabled:bg-white disabled:text-blue-500 rounded-md px-2 py-1 font-medium`}
                  disabled={pathname === "/signup"}
                  onClick={() => switchRoute("/signup")}
                >
                  Signup
                </button>
              </>
            ) : null}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
