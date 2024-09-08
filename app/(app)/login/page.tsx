"use client";

import { FormEvent, useState } from "react";
import {
  useAuthState,
  useSignInWithEmailAndPassword,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";

import { auth } from "@/utils/firebase";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveUserToDB } from "@/utils/firebase-auth";

const Login = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [signInWithEmailAndPassword, _user, emailLoginLoading] =
    useSignInWithEmailAndPassword(auth);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [signInWithGoogle, __user, googleLoginLoading] =
    useSignInWithGoogle(auth);

  const formRef = useRef<HTMLFormElement | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      router.replace("/tasks");
    }
  }, [user, router]);

  const handleLoginForm = async (e: FormEvent) => {
    try {
      e.preventDefault();
      setPageLoading(true);

      const form = formRef.current;

      // Using FormData to access form values
      const formData = new FormData(form || undefined);

      const email = formData.get("email")
        ? String(formData.get("email"))
        : null;
      const password = formData.get("password")
        ? String(formData.get("password"))
        : null;

      if (!email || !password) {
        return;
      }

      const userCredential = await signInWithEmailAndPassword(email, password);
      console.log(
        "userCredential: ",
        userCredential?.operationType,
        userCredential?.providerId
      );

      router.push("/tasks");
    } catch (error) {
      console.error("Error(handleLoginForm): ", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setPageLoading(true);
      const userCredential = await signInWithGoogle();
      if (!userCredential?.user) {
        console.error("Failed to signin via google.");
        return;
      }

      const email = userCredential.user.email;
      const name = userCredential.user.displayName;
      if (!name || !email) {
        console.error("Failed to save user data. Invalid Email/Name");
        return;
      }

      // Save user data to DB
      const jwtToken = await userCredential.user.getIdToken();
      saveUserToDB(name, email, jwtToken, "GOOGLE");

      router.push("/tasks");
    } catch (error) {
      console.error("Error(handleGoogleLogin): ", error);
    } finally {
      setPageLoading(false);
    }
  };

  if (pageLoading || loading || googleLoginLoading || emailLoginLoading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="mt-12 w-[36%] mx-auto">
      <h1 className="text-blue-500 text-2xl font-black my-5 tracking-tight">
        {"Login"}
      </h1>

      <div className="border-2 border-blue-500 rounded-md px-5 py-8 flex flex-col gap-4">
        <form
          className="flex flex-col gap-4"
          ref={formRef}
          onSubmit={(e) => handleLoginForm(e)}
        >
          <input
            type="email"
            name="email"
            id="email"
            required
            placeholder="Email"
            className="border p-2 border-gray-400 placeholder:text-gray-400 placeholder:font-semibold leading-none tracking-tighter placeholder:text-sm"
          />

          <input
            type="password"
            name="password"
            id="password"
            required
            placeholder="Password"
            className="border p-2 border-gray-400 placeholder:text-gray-400 placeholder:font-semibold leading-none tracking-tighter placeholder:text-sm"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 font-bold"
          >
            {"Login"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-6">
          <h3 className="flex gap-x-4">
            <span className="font-medium">{"Don't have an account?"}</span>
            <span className="text-blue-500 font-semibold">{"Signup"}</span>
          </h3>

          <button
            type="button"
            className="bg-blue-600 text-white px-2 py-2 rounded-md flex gap-x-1"
            onClick={() => handleGoogleLogin()}
          >
            <span>{"Login with"}</span>
            <span className="font-bold">{"Google"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
