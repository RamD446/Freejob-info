"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Eye, MessageCircle, Phone, Search, Share2 } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import CompanyBadge from "./company-badge";
import LoadingSpinner from "./loading-spinner";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import { getFirebaseServices } from "../lib/firebase";
import { Job } from "../lib/types";

const categoryFilters: Record<string, string> = {
  all: "All jobs",
  government: "Government Jobs",
  "walk-ins": "Walk-ins",
  freshers: "Freshers",
  experienced: "Experienced",
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function postedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently posted" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function JobsHome() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") || "all";
  const urlQuery = searchParams.get("q") || "";
  return <JobsHomeContent key={`${urlCategory}:${urlQuery}`} initialCategory={urlCategory} initialQuery={urlQuery} />;
}

function JobsHomeContent({ initialCategory, initialQuery }: { initialCategory: string; initialQuery: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(categoryFilters[initialCategory] || "All jobs");
  const [jobType, setJobType] = useState("All job types");
  const [companyFilter, setCompanyFilter] = useState("All companies");
  const [query, setQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const pageSize = 30;

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
  const companyNames = [...new Set(jobs.map((job) => job.company?.trim()).filter((value): value is string => Boolean(value)))].sort((first, second) => first.localeCompare(second));
  const companies = ["All companies", ...companyNames];
  const filtered = jobs.filter((job) => {
    const search = `${job.title} ${job.company} ${job.description || ""}`.toLowerCase();
    const categoryMatch = filter === "All jobs"
      || (filter === "Walk-ins" ? job.walkInDrive === true : filter === "Freshers" || filter === "Experienced"
        ? (job.experience || "").toLowerCase().includes(filter.toLowerCase())
        : (job.jobType || "").toLowerCase() === filter.toLowerCase());
    return categoryMatch
      && (jobType === "All job types" || job.jobType === jobType)
      && (companyFilter === "All companies" || job.company?.trim() === companyFilter)
      && search.includes(appliedQuery.toLowerCase());
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleJobs = filtered.slice((page - 1) * pageSize, page * pageSize);
  const recentGovernmentJobs = jobs.filter((job) => job.jobType === "Government Jobs").slice(0, 10);
  const recentWalkInJobs = jobs.filter((job) => job.walkInDrive).slice(0, 10);

  function chooseFilter(value: string) {
    setFilter(value);
    setPage(1);
  }

  function shareJob(job: Job) {
    const url = `${window.location.origin}/job/${job.id}/${slug(job.title)}`;
    if (navigator.share) void navigator.share({ title: job.title, url });
    else void navigator.clipboard.writeText(url);
  }

  if (loading) {
    return <main className="portal-shell"><SiteHeader /><LoadingSpinner /><SiteFooter /></main>;
  }

  return (
    <main className="portal-shell">
      <SiteHeader />
      <section className="portal-content" aria-label="Browse jobs">
        <div className="content-heading" id="latest-jobs">
          <h1>Latest job openings</h1>
        </div>
        <div className="browse-layout">
          <div className="jobs-column">
            <a className="whatsapp-follow-card" href="https://whatsapp.com/channel/0029VbCLJWjCRs1nIKjUlh3p" target="_blank" rel="noreferrer">
              <span className="whatsapp-follow-icon" aria-hidden="true"><span className="whatsapp-brand-mark"><MessageCircle className="whatsapp-brand-bubble" /><Phone className="whatsapp-brand-phone" /></span></span>
              <span className="whatsapp-follow-copy"><strong>New job openings</strong><small>Never miss job alerts</small></span>
              <span className="whatsapp-follow-action"><span className="whatsapp-brand-mark" aria-hidden="true"><MessageCircle className="whatsapp-brand-bubble" /><Phone className="whatsapp-brand-phone" /></span>Follow latest jobs</span>
            </a>
            <form className="search-bar home-search-bar" id="job-search" onSubmit={(event) => { event.preventDefault(); setAppliedQuery(query); setPage(1); }}>
              <span className="search-symbol" aria-hidden="true"><Search size={17} /></span>
              <label className="sr-only" htmlFor="job-search-input">Search jobs and companies</label>
              <input id="job-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs, companies, or keywords" />
              <button type="submit" aria-label="Search jobs" title="Search jobs"><Search size={18} aria-hidden="true" /></button>
            </form>
            <div className="jobs-toolbar">
              <span>Sorted by newest</span>
            </div>
            {error ? <div className="state-panel error-panel">{error}</div> : null}
            {!loading && !error && visibleJobs.length === 0 ? <div className="state-panel"><strong>No matching jobs yet.</strong><span>Try another category or search term.</span></div> : null}
            <div className="job-list">
              {visibleJobs.map((job, index) => (
                <article className="job-row" key={job.id}>
                  <div className="job-card-heading">
                    <CompanyBadge job={job} />
                    <div className="job-meta-top"><span className="job-company">{job.company || "Employer"}</span>{job.walkInDrive ? <span className="tag tag-walkin">Walk-in</span> : null}{index === 0 && page === 1 ? <span className="tag tag-new">New</span> : null}</div>
                  </div>
                  <Link className="job-title-link" href={`/job/${job.id}/${slug(job.title)}`}>{job.title || "Untitled opportunity"}</Link>
                  <div className="job-meta-bottom"><span>{job.jobType || "Opportunity"}</span>{job.experience ? <><i /> <span>{job.experience}</span></> : null}{job.walkInDate ? <><i /> <span>Walk-in {postedDate(job.walkInDate)}</span></> : null}</div>
                  <div className="job-card-footer"><span className="posted-date">Posted {postedDate(job.createdDate)}</span><div className="job-row-actions"><button className="icon-button" type="button" title="Share job" aria-label={`Share ${job.title}`} onClick={() => shareJob(job)}><Share2 size={15} aria-hidden="true" /></button><Link className="icon-button view-job" href={`/job/${job.id}/${slug(job.title)}`} title="View job details" aria-label={`View details for ${job.title}`}><Eye size={16} aria-hidden="true" /><span>Details</span></Link></div></div>
                </article>
              ))}
            </div>
            {pages > 1 ? <nav className="pagination" aria-label="Job listing pages"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage(page + 1)}>Next →</button></nav> : null}
          </div>
          <aside className="browse-sidebar">
            <section id="government" className="side-section">
              <p className="eyebrow">LATEST UPDATES</p><h2>Recent government jobs</h2>
              {recentGovernmentJobs.map((job) => <Link className="sidebar-job" href={`/job/${job.id}/${slug(job.title)}`} key={job.id}><ChevronRight className="sidebar-job-arrow" size={15} aria-hidden="true" /><span className="sidebar-job-copy"><strong>{job.title}</strong><small>{job.company} · {postedDate(job.createdDate)}</small></span></Link>)}
              {recentGovernmentJobs.length === 0 ? <p className="sidebar-empty">No recent listings.</p> : null}
              <button type="button" className="side-link" onClick={() => chooseFilter("Government Jobs")}>More government jobs</button>
            </section>
            <section id="walk-ins" className="side-section walkin-section">
              <p className="eyebrow">MEET THEM IN PERSON</p><h2>Recent walk-ins</h2>
              {recentWalkInJobs.map((job) => <Link className="sidebar-job" href={`/job/${job.id}/${slug(job.title)}`} key={job.id}><ChevronRight className="sidebar-job-arrow" size={15} aria-hidden="true" /><span className="sidebar-job-copy"><strong>{job.title}</strong><small>{job.company} · {postedDate(job.createdDate)}</small></span></Link>)}
              {recentWalkInJobs.length === 0 ? <p className="sidebar-empty">No recent walk-ins.</p> : null}
              <button type="button" className="side-link" onClick={() => chooseFilter("Walk-ins")}>More walk-ins</button>
            </section>
            <section className="side-section side-filter-section">
              <p className="eyebrow">REFINE LISTINGS</p><h2>Filter listings</h2>
              <label className="sidebar-filter-control"><span>Job type</span><select value={jobType} onChange={(event) => { setJobType(event.target.value); setPage(1); }}>{jobTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="sidebar-filter-control"><span>Company</span><select value={companyFilter} onChange={(event) => { setCompanyFilter(event.target.value); setPage(1); }}>{companies.map((company) => <option key={company}>{company}</option>)}</select></label>
            </section>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}