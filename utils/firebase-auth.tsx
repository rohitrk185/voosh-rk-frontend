// import { EmailLoginData } from "@/types/firebase-auth";
// import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
// import { auth } from "@/utils/firebase";

// export const HandleFirebaseEmailLogin = async (data: EmailLoginData) => {
//   console.log("in handleFirebaseEmailLogin: ", data);

//   const [createUserWithEmailAndPassword, user] =
//     useCreateUserWithEmailAndPassword(auth);
// };
export const saveUserToDB = async (
  name: string,
  email: string,
  jwtToken: string,
  providerId: string
) => {
  try {
    console.log("in saveUserToDB");
    if (!name || !email) {
      console.error("Requires name and email to save user data.");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URI}/user`;
    const req = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        description: null,
        providerId,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    const res = await req.json();
    console.log("Response from backend: ", res);
  } catch (error) {
    console.error("Failed to save user data to DB: ", error);
  }
};
