import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="All India Jobs home">
        <span className="brand-mark" aria-hidden="true">AJ</span>
        <span>All India Jobs</span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/">Find jobs</Link>
        <Link href="/#walk-ins">Walk-ins</Link>
        <Link href="/#government">Government</Link>
      </nav>
      <Link className="nav-login" href="/login">Admin sign in <span aria-hidden="true">↗</span></Link>
    </header>
  );
}