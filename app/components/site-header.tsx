"use client";

import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ArrowUpRight, Briefcase, ChevronRight, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirebaseServices } from "../lib/firebase";

const jobCategories = [
  { label: "All jobs", slug: "all" },
  { label: "Government jobs", slug: "government" },
  { label: "Walk-ins", slug: "walk-ins" },
  { label: "Freshers", slug: "freshers" },
  { label: "Experienced", slug: "experienced" },
];

export default function SiteHeader() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (user) => {
      setIsSignedIn(Boolean(user));
      setUserEmail(user?.email || "");
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    function closeMenus(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCategoryMenuOpen(false);
        setIsProfileOpen(false);
        setIsSearchOpen(false);
      }
    }
    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, []);

  async function logout() {
    const { auth } = getFirebaseServices();
    setIsProfileOpen(false);
    await signOut(auth);
  }

  return (
    <header className="site-header">
      <div className="site-header-main">
        <div className="header-brand-group">
          <button className="header-icon-button category-menu-trigger" type="button" onClick={() => { setIsCategoryMenuOpen(true); setIsSearchOpen(false); setIsProfileOpen(false); }} aria-label="Open job categories" aria-expanded={isCategoryMenuOpen} aria-controls="category-drawer" title="Job categories">
            <Menu size={21} aria-hidden="true" />
          </button>
          <Link className="brand" href="/" aria-label="freejob-info home">
            <span className="brand-mark" aria-hidden="true"><Briefcase size={18} strokeWidth={2} /></span>
            <span>freejob-info</span>
          </Link>
        </div>
        <div className="header-actions">
          <button className="header-icon-button" type="button" onClick={() => { setIsSearchOpen(!isSearchOpen); setIsProfileOpen(false); }} aria-label={isSearchOpen ? "Close job search" : "Search jobs"} aria-expanded={isSearchOpen} title="Search jobs">
            {isSearchOpen ? <X size={19} aria-hidden="true" /> : <Search size={19} aria-hidden="true" />}
          </button>
          <div className="profile-control">
            <button className="header-icon-button" type="button" onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSearchOpen(false); }} aria-label="Account menu" aria-expanded={isProfileOpen} title="Manage jobs">
              <UserRound size={19} aria-hidden="true" />
            </button>
            {isProfileOpen ? (
              <div className="profile-menu" role="menu">
                {isSignedIn && userEmail ? <p className="profile-email">{userEmail}</p> : null}
                <Link href="/login" role="menuitem" onClick={() => setIsProfileOpen(false)}>Manage jobs <ArrowUpRight size={14} aria-hidden="true" /></Link>
                {isSignedIn ? <button type="button" role="menuitem" onClick={logout}><LogOut size={14} aria-hidden="true" /> Logout</button> : null}
                {authLoading ? <span className="profile-status">Checking account...</span> : null}
              </div>
            ) : null}
          </div>
          {isSearchOpen ? (
            <div className="header-search-panel">
              <form className="header-search-form" action="/" method="get">
                <label className="sr-only" htmlFor="header-job-search">Search jobs and companies</label>
                <input id="header-job-search" name="q" type="search" placeholder="Search jobs or companies" autoFocus />
                <button type="submit" aria-label="Submit job search"><Search size={17} aria-hidden="true" /></button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
      {isCategoryMenuOpen ? <button className="category-drawer-overlay" type="button" aria-label="Close job categories" onClick={() => setIsCategoryMenuOpen(false)} /> : null}
      <aside className={isCategoryMenuOpen ? "category-drawer open" : "category-drawer"} id="category-drawer" aria-hidden={!isCategoryMenuOpen}>
        <div className="category-drawer-header">
          <div className="category-drawer-brand"><span className="brand-mark" aria-hidden="true"><Briefcase size={17} /></span><strong>Browse jobs</strong></div>
          <button className="category-drawer-close" type="button" onClick={() => setIsCategoryMenuOpen(false)} aria-label="Close job categories"><X size={19} aria-hidden="true" /></button>
        </div>
        <nav className="category-drawer-links" aria-label="Job categories">
          {jobCategories.map(({ label, slug }) => <Link href={`/?category=${slug}`} key={slug} onClick={() => setIsCategoryMenuOpen(false)}><span>{label}</span><ChevronRight size={16} aria-hidden="true" /></Link>)}
        </nav>
      </aside>
    </header>
  );
}