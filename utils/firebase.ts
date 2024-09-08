// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6XE7KXD_d12OvB6dD8QTn6S8TJc3-CBw",
  authDomain: "voosh-assignment-ff1ec.firebaseapp.com",
  projectId: "voosh-assignment-ff1ec",
  storageBucket: "voosh-assignment-ff1ec.appspot.com",
  messagingSenderId: "287007720844",
  appId: "1:287007720844:web:aedf2653b3dc6b8fa302a9",
  measurementId: "G-Y39J079G45"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
