"use client";

import {
  useAuthState,
  useCreateUserWithEmailAndPassword,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";

import { auth } from "@/utils/firebase";
import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveUserToDB } from "@/utils/firebase-auth";

const Signup = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [createUserWithEmailAndPassword, _user, emailSignupLoading] =
    useCreateUserWithEmailAndPassword(auth);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [signInWithGoogle, __user, googleSignupLoading] =
    useSignInWithGoogle(auth);

  const formRef = useRef<HTMLFormElement | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      router.replace("/tasks");
    }
  }, [user, router]);

  const handleSignupForm = async (e: FormEvent) => {
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
      const firstName = formData.get("first_name")
        ? String(formData.get("first_name"))
        : null;
      const lastName = formData.get("last_name")
        ? String(formData.get("last_name"))
        : null;

      // const {name, description, email, providerId} = req.body;

      if (!email || !password || !firstName) {
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        email,
        password
      );
      if (!userCredential) {
        console.error("Failed to Signup! Try Again...");
        return;
      }
      console.log(
        "userCredential: ",
        userCredential?.operationType,
        userCredential?.providerId
      );

      const name = `${firstName}${lastName ? ` ${lastName}` : ""}`;
      const jwtToken = await userCredential.user.getIdToken();
      // Save user data to DB
      await saveUserToDB(name, email, jwtToken, "EMAIL");

      router.push("/tasks");
    } catch (error) {
      console.error("Error in login: ", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      console.error("Error(handleGoogleSignup): ", error);
    } finally {
      setPageLoading(false);
    }
  };

  if (pageLoading || loading || emailSignupLoading || googleSignupLoading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="mt-12 w-[36%] mx-auto">
      <h1 className="text-blue-500 text-2xl font-black my-5 tracking-tight">
        {"Signup"}
      </h1>

      <div className="border-2 border-blue-500 rounded-md px-5 py-8 flex flex-col gap-4">
        <form
          className="flex flex-col gap-4"
          ref={formRef}
          onSubmit={(e) => handleSignupForm(e)}
        >
          <input
            type="text"
            required
            placeholder="First Name"
            name="first_name"
            id="first_name"
            className="border p-2 border-gray-400 placeholder:text-gray-400 placeholder:font-semibold leading-none tracking-tighter placeholder:text-sm"
          />

          <input
            type="text"
            name="last_name"
            id="last_name"
            placeholder="Last Name"
            className="border p-2 border-gray-400 placeholder:text-gray-400 placeholder:font-semibold leading-none tracking-tighter placeholder:text-sm"
          />

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

          <input
            type="password"
            name="confirm_password"
            id="confirm_password"
            required
            placeholder="Confirm Password"
            className="border p-2 border-gray-400 placeholder:text-gray-400 placeholder:font-semibold leading-none tracking-tighter placeholder:text-sm"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 font-bold"
          >
            {"Signup"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-6">
          <h3 className="flex gap-x-4">
            <span className="font-medium">{"Already have an account?"}</span>
            <span className="text-blue-500 font-semibold">{"Login"}</span>
          </h3>

          <button
            type="button"
            className="bg-blue-600 text-white px-2 py-2 rounded-md flex gap-x-1"
            onClick={() => handleGoogleSignup()}
          >
            <span>{"Signup with"}</span>
            <span className="font-bold">{"Google"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
