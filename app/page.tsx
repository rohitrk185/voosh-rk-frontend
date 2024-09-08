"use client";

import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "@/utils/firebase";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleRefresh = async () => {
    router.refresh();
  };

  if (error) {
    return (
      <main className="w-screen h-5/6 flex flex-col gap-4 items-center justify-center">
        <h1 className="text-red-500 text-lg">
          Oops! There was an error in fetching your account details...
        </h1>
        <button
          className="border-red-500 bg-red-100 p-1 border rounded-md"
          onClick={handleRefresh}
        >
          Try Again
        </button>
      </main>
    );
  }

  return <main className=""></main>;
}
