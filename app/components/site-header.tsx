"use client";

import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Briefcase, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirebaseServices } from "../lib/firebase";

export default function SiteHeader() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (user) => {
      setIsSignedIn(Boolean(user));
      setAuthLoading(false);
    });
  }, []);

  async function logout() {
    const { auth } = getFirebaseServices();
    await signOut(auth);
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="freejob-info home">
        <span className="brand-mark" aria-hidden="true"><Briefcase size={18} strokeWidth={2} /></span>
        <span>freejob-info</span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/">Find jobs</Link>
        <Link href="/#walk-ins">Walk-ins</Link>
        <Link href="/#government">Government</Link>
      </nav>
      <div className="header-auth">
        {authLoading ? <span className="nav-auth-loading">Checking sign-in...</span> : isSignedIn ? (
          <button className="nav-login" type="button" onClick={logout}><LogOut size={15} aria-hidden="true" /> Logout</button>
        ) : (
          <Link className="nav-login" href="/login"><LogIn size={15} aria-hidden="true" /> Admin sign in</Link>
        )}
      </div>
    </header>
  );
}