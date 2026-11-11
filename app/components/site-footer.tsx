import Link from "next/link";
import { Briefcase, LogIn, MessageCircle } from "lucide-react";

const whatsappUrl = "https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <section className="footer-section footer-about">
            <Link className="footer-brand" href="/">
              <span className="footer-brand-mark"><Briefcase size={18} aria-hidden="true" /></span>
              <span>freejob-info</span>
            </Link>
            <p>Find recent government jobs, private openings, and walk-in drives.</p>
          </section>
          <section className="footer-section">
            <h2 className="footer-title">Quick links</h2>
            <ul className="footer-links">
              <li><Link href="/#latest-jobs">All latest jobs</Link></li>
              <li><Link href="/#government">Government jobs</Link></li>
              <li><Link href="/#walk-ins">Walk-in drives</Link></li>
              <li><Link href="/#job-categories">Job categories</Link></li>
            </ul>
          </section>
          <section className="footer-section">
            <h2 className="footer-title">Contact & actions</h2>
            <div className="footer-links">
              <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} aria-hidden="true" /> Job alerts on WhatsApp</a>
              <Link href="/login"><LogIn size={15} aria-hidden="true" /> Publisher sign in</Link>
            </div>
          </section>
        </div>
        <div className="footer-bottom">
          <span>© 2026 freejob-info. All rights reserved.</span>
          <span>Opportunities, updated daily.</span>
        </div>
      </div>
    </footer>
  );
}