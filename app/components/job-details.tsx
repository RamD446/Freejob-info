"use client";

import Link from "next/link";
import { onValue, push, ref, runTransaction, set } from "firebase/database";
import { useEffect, useState, type FormEvent } from "react";
import SiteHeader from "./site-header";
import CompanyBadge from "./company-badge";
import { getFirebaseServices } from "../lib/firebase";
import { Job, JobComment } from "../lib/types";

function plainText(value: string | undefined) {
  return (value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|li|div|h[1-6])>/gi, "\n").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\u00a0/g, " ").trim();
}

function displayDate(value: string | undefined) {
  if (!value) return "Recently posted";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function JobDetails({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { db } = getFirebaseServices();
    const stopJob = onValue(ref(db, `jobs/${jobId}`), (snapshot) => {
      setJob(snapshot.exists() ? { id: jobId, ...snapshot.val() } as Job : null);
      setLoading(false);
    }, () => setLoading(false));
    const stopJobs = onValue(ref(db, "jobs"), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Job, "id">> | null;
      const list = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
      setRecentJobs(list.filter((item) => item.id !== jobId).sort((a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()).slice(0, 7));
    });
    const stopComments = onValue(ref(db, `comments/${jobId}`), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<JobComment, "id">> | null;
      const list = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
      setComments(list.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()));
    });
    void runTransaction(ref(db, "stats/jobClicks"), (current) => (current || 0) + 1);
    return () => { stopJob(); stopJobs(); stopComments(); };
  }, [jobId]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanComment = comment.trim();
    if (!cleanName || !cleanComment) return setCommentError("Enter your name and a comment.");
    if (cleanName.length > 10 || cleanComment.length > 50) return setCommentError("Name limit is 10 characters; comment limit is 50.");
    setSaving(true);
    setCommentError("");
    try {
      const { db } = getFirebaseServices();
      await set(push(ref(db, `comments/${jobId}`)), { name: cleanName, comment: cleanComment, createdDate: new Date().toISOString() });
      setName("");
      setComment("");
    } catch {
      setCommentError("Could not post your comment. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function shareJob() {
    const url = window.location.href;
    if (navigator.share) void navigator.share({ title: job?.title, url });
    else void navigator.clipboard.writeText(url);
  }

  if (loading) return <main className="portal-shell"><SiteHeader /><div className="detail-state">Loading job details…</div></main>;
  if (!job) return <main className="portal-shell"><SiteHeader /><div className="detail-state"><p className="eyebrow">JOB NOT AVAILABLE</p><h1>This listing may have expired.</h1><Link className="primary-link" href="/">Back to jobs <span>→</span></Link></div></main>;

  const detailRows = plainText(job.fullInformationTableFormat).split("\n").map((line) => {
    const divider = line.indexOf(":");
    return divider > 0 ? [line.slice(0, divider).trim(), line.slice(divider + 1).trim()] : null;
  }).filter((row): row is [string, string] => Boolean(row?.[0] && row?.[1]));

  return (
    <main className="portal-shell">
      <SiteHeader />
      <div className="detail-wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">All jobs</Link><span>/</span><span>{job.jobType || "Job details"}</span></nav>
        <div className="detail-grid">
          <article className="detail-main">
            <header className="detail-heading">
              <CompanyBadge job={job} size="large" />
              <div className="detail-title-block"><p className="eyebrow">{job.company || "EMPLOYER"}</p><h1>{job.title}</h1><div className="detail-tags"><span>{job.jobType || "Opportunity"}</span>{job.experience ? <span>{job.experience}</span> : null}{job.walkInDrive ? <span>Walk-in drive</span> : null}</div></div>
              <button className="icon-button detail-share" onClick={shareJob} type="button" aria-label="Share this job" title="Share this job">↗</button>
            </header>
            <div className="detail-facts"><div><span>Posted</span><strong>{displayDate(job.createdDate)}</strong></div>{job.walkInDate ? <div><span>Walk-in date</span><strong>{displayDate(job.walkInDate)}</strong></div> : null}{job.lastDateToApply ? <div><span>Apply by</span><strong>{displayDate(job.lastDateToApply)}</strong></div> : null}</div>
            {job.otherLink ? <a className="apply-button" href={job.otherLink} target="_blank" rel="noreferrer">Apply on official site <span aria-hidden="true">↗</span></a> : null}
            {job.applyPdfLink ? <a className="pdf-link" href={job.applyPdfLink} target="_blank" rel="noreferrer">View official PDF ↗</a> : null}
            <section className="detail-section"><p className="eyebrow">THE OPPORTUNITY</p><h2>About this role</h2><p className="rich-text">{plainText(job.description) || "No description has been provided for this listing."}</p></section>
            {detailRows.length > 0 ? <section className="detail-section"><p className="eyebrow">AT A GLANCE</p><h2>Job information</h2><dl className="info-table">{detailRows.map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section> : null}
            {job.fullJobInformation ? <section className="detail-section"><p className="eyebrow">MORE INFORMATION</p><h2>Full notification</h2><p className="rich-text">{plainText(job.fullJobInformation)}</p></section> : null}
            <section className="comments-section"><div className="comments-title"><div><p className="eyebrow">JOIN THE CONVERSATION</p><h2>Comments <span>{comments.length}</span></h2></div></div>
              <form className="comment-form" onSubmit={submitComment}><label><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={10} required /></label><label><span>Comment</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={50} rows={3} required /></label>{commentError ? <p className="form-error">{commentError}</p> : null}<button className="primary-button" type="submit" disabled={saving}>{saving ? "Posting…" : "Post comment"}</button></form>
              {comments.map((item) => <article className="comment-item" key={item.id}><span className="comment-avatar">{item.name.charAt(0).toUpperCase()}</span><div><strong>{item.name}</strong><p>{item.comment}</p><time>{displayDate(item.createdDate)}</time></div></article>)}
              {comments.length === 0 ? <p className="quiet-note">No comments yet. Start the conversation.</p> : null}
            </section>
          </article>
          <aside className="related-sidebar"><p className="eyebrow">KEEP EXPLORING</p><h2>Recent openings</h2>{recentJobs.map((item) => <Link className="related-job" key={item.id} href={`/job/${item.id}/${slug(item.title)}`}><span>{item.company}</span><strong>{item.title}</strong><small>{displayDate(item.createdDate)}</small></Link>)}<Link className="all-jobs-link" href="/">Browse all jobs <span>→</span></Link></aside>
        </div>
      </div>
      <footer className="site-footer"><span>All India Jobs</span><span>Opportunities, updated daily.</span><Link href="/">All listings</Link></footer>
    </main>
  );
}