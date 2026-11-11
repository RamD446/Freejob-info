"use client";

import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import CompanyBadge from "./company-badge";
import SiteHeader from "./site-header";
import { getFirebaseServices } from "../lib/firebase";
import { Job } from "../lib/types";

const quickFilters = ["All jobs", "Government Jobs", "Walk-ins", "Freshers", "Experienced"];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function postedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently posted" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function JobsHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All jobs");
  const [jobType, setJobType] = useState("All job types");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const { db } = getFirebaseServices();
    return onValue(ref(db, "jobs"), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Job, "id">> | null;
      const next = data ? Object.entries(data).map(([id, job]) => ({ id, ...job })) : [];
      next.sort((a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime());
      setJobs(next);
      setLoading(false);
      setError("");
    }, () => {
      setError("Jobs are unavailable right now. Please try again shortly.");
      setLoading(false);
    });
  }, []);

  const jobTypes = ["All job types", ...new Set(jobs.map((job) => job.jobType?.trim()).filter((value): value is string => Boolean(value)))];
  const filtered = jobs.filter((job) => {
    const search = `${job.title} ${job.company} ${job.description || ""}`.toLowerCase();
    const categoryMatch = filter === "All jobs"
      || (filter === "Walk-ins" ? job.walkInDrive === true : filter === "Freshers" || filter === "Experienced"
        ? (job.experience || "").toLowerCase().includes(filter.toLowerCase())
        : (job.jobType || "").toLowerCase() === filter.toLowerCase());
    return categoryMatch && (jobType === "All job types" || job.jobType === jobType) && search.includes(query.toLowerCase());
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleJobs = filtered.slice((page - 1) * pageSize, page * pageSize);
  const governmentCount = jobs.filter((job) => job.jobType === "Government Jobs").length;
  const walkInCount = jobs.filter((job) => job.walkInDrive).length;

  function chooseFilter(value: string) {
    setFilter(value);
    setPage(1);
  }

  function shareJob(job: Job) {
    const url = `${window.location.origin}/job/${job.id}/${slug(job.title)}`;
    if (navigator.share) void navigator.share({ title: job.title, url });
    else void navigator.clipboard.writeText(url);
  }

  return (
    <main className="portal-shell">
      <SiteHeader />
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">YOUR NEXT MOVE STARTS HERE</p>
          <h1>Find work that<br /><em>moves you forward.</em></h1>
          <p className="hero-subtitle">Fresh openings from across India, gathered in one place.</p>
          <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
            <span className="search-symbol" aria-hidden="true">⌕</span>
            <label className="sr-only" htmlFor="job-search">Search jobs and companies</label>
            <input id="job-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Role, company, or keyword" />
            <button type="submit">Search jobs <span aria-hidden="true">→</span></button>
          </form>
        </div>
        <div className="hero-aside" aria-label="Job highlights">
          <p className="hero-aside-label">LIVE OPPORTUNITIES</p>
          <div className="hero-stat"><strong>{jobs.length.toLocaleString("en-IN")}</strong><span>open listings</span></div>
          <div className="hero-stat"><strong>{walkInCount.toLocaleString("en-IN")}</strong><span>walk-in drives</span></div>
          <div className="hero-stat"><strong>{governmentCount.toLocaleString("en-IN")}</strong><span>government roles</span></div>
          <span className="hero-stamp">UPDATED<br />DAILY</span>
        </div>
      </section>

      <section className="portal-content" aria-label="Browse jobs">
        <div className="content-heading">
          <div><p className="eyebrow">THE LATEST OPENINGS</p><h2>Opportunities for you</h2></div>
          <span className="results-total">{filtered.length} {filtered.length === 1 ? "role" : "roles"}</span>
        </div>
        <div className="browse-layout">
          <div className="jobs-column">
            <div className="filter-tabs" role="group" aria-label="Filter jobs by category">
              {quickFilters.map((item) => <button key={item} className={filter === item ? "filter-tab active" : "filter-tab"} onClick={() => chooseFilter(item)} type="button">{item}</button>)}
            </div>
            <div className="jobs-toolbar">
              <span>Sorted by newest</span>
              <label className="sr-only" htmlFor="type-filter">Filter by job type</label>
              <select id="type-filter" value={jobType} onChange={(event) => { setJobType(event.target.value); setPage(1); }}>
                {jobTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            {loading ? <div className="state-panel"><span className="loader-dot" />Loading the latest jobs…</div> : null}
            {error ? <div className="state-panel error-panel">{error}</div> : null}
            {!loading && !error && visibleJobs.length === 0 ? <div className="state-panel"><strong>No matching jobs yet.</strong><span>Try another category or search term.</span></div> : null}
            <div className="job-list">
              {visibleJobs.map((job, index) => (
                <article className="job-row" key={job.id}>
                  <CompanyBadge job={job} />
                  <div className="job-main">
                    <div className="job-meta-top"><span className="job-company">{job.company || "Employer"}</span>{job.walkInDrive ? <span className="tag tag-walkin">Walk-in</span> : null}{index === 0 && page === 1 ? <span className="tag tag-new">New</span> : null}</div>
                    <Link className="job-title-link" href={`/job/${job.id}/${slug(job.title)}`}>{job.title || "Untitled opportunity"}</Link>
                    <div className="job-meta-bottom"><span>{job.jobType || "Opportunity"}</span>{job.experience ? <><i /> <span>{job.experience}</span></> : null}{job.walkInDate ? <><i /> <span>Walk-in {postedDate(job.walkInDate)}</span></> : null}</div>
                  </div>
                  <div className="job-row-end"><span className="posted-date">{postedDate(job.createdDate)}</span><div className="job-row-actions"><button className="icon-button" type="button" title="Share job" aria-label={`Share ${job.title}`} onClick={() => shareJob(job)}>↗</button><Link className="view-job" href={`/job/${job.id}/${slug(job.title)}`}>Details <span aria-hidden="true">→</span></Link></div></div>
                </article>
              ))}
            </div>
            {pages > 1 ? <nav className="pagination" aria-label="Job listing pages"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage(page + 1)}>Next →</button></nav> : null}
          </div>
          <aside className="browse-sidebar">
            <section id="government" className="side-section"><p className="eyebrow">IN FOCUS</p><h3>Government jobs</h3><p>Explore public-sector openings and new notifications.</p><button type="button" className="side-link" onClick={() => chooseFilter("Government Jobs")}>Browse government roles <span>→</span></button></section>
            <section id="walk-ins" className="side-section walkin-section"><p className="eyebrow">MEET THEM IN PERSON</p><h3>Walk-in drives</h3><p>Find employers hiring directly through walk-in interviews.</p><button type="button" className="side-link" onClick={() => chooseFilter("Walk-ins")}>See walk-in opportunities <span>→</span></button></section>
            <a className="whatsapp-link" href="https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p" target="_blank" rel="noreferrer"><span className="whatsapp-symbol" aria-hidden="true">WA</span><span><strong>Job alerts on WhatsApp</strong><small>Follow All India Jobs</small></span><b aria-hidden="true">↗</b></a>
          </aside>
        </div>
      </section>
      <footer className="site-footer"><span>All India Jobs</span><span>Opportunities, updated daily.</span><Link href="/login">Admin</Link></footer>
    </main>
  );
}