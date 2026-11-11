"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAHCVTzpNO2J93nrE713Rw10Rb5bQpq4oY",
  authDomain: "allindiajobs-36405.firebaseapp.com",
  databaseURL: "https://allindiajobs-36405-default-rtdb.firebaseio.com",
  projectId: "allindiajobs-36405",
  storageBucket: "allindiajobs-36405.firebasestorage.app",
  messagingSenderId: "615657521468",
  appId: "1:615657521468:web:4f47813eefe22b810c5e39",
  measurementId: "G-T0V4G0SDVE",
};

export function getFirebaseServices() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return { auth: getAuth(app), db: getDatabase(app) };
}