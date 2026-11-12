"use client";

import Link from "next/link";
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { onValue, push, ref, remove, update } from "firebase/database";
import { useEffect, useState, type FormEvent } from "react";
import * as XLSX from "xlsx";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import CompanyBadge from "./company-badge";
import { getFirebaseServices } from "../lib/firebase";
import { JOB_ICON_OPTIONS } from "../lib/job-icons";
import { Job, JOB_TYPES } from "../lib/types";

type JobDraft = Omit<Job, "id" | "createdDate" | "updatedDate">;

const GOVERNMENT_JOB_TYPES = ["Government Jobs", "Results", "Syllabus"];
const PRIVATE_JOB_TYPES = ["IT Jobs", "Non-IT Jobs", "Pharma Jobs", "Sales Jobs", "Pharmaceutical Jobs", "Bank Jobs", "Other"];

function emptyDraft(): JobDraft {
  return {
    title: "",
    company: "",
    companyImage: "",
    jobIcon: "bi-briefcase-fill",
    sector: "Government",
    privateJobType: "Non-walk-in",
    jobType: "Government Jobs",
    experience: "",
    fullInformationTableFormat: "",
    fullJobInformation: "",
    walkInDrive: true,
    walkInDate: "",
    lastDateToApply: "",
    description: "",
    otherLink: "",
    applyPdfLink: "",
    createdBy: "",
  };
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function importedValue(row: Record<string, unknown>, names: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), String(value ?? "")]));
  for (const name of names) {
    const value = normalized.get(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (value !== undefined) return value;
  }
  return "";
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [draft, setDraft] = useState<JobDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All job types");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (activeUser) => {
      setUser(activeUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const { db } = getFirebaseServices();
    return onValue(ref(db, "jobs"), (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<Job, "id">> | null;
      const list = data ? Object.entries(data).map(([id, job]) => ({ id, ...job })) : [];
      setJobs(list.sort((a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()));
    }, () => setNotice("Could not load jobs. Check your database access rules."));
  }, [user]);

  useEffect(() => {
    if (!formOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFormOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [formOpen]);

  const filteredJobs = jobs.filter((job) => (filter === "All job types" || job.jobType === filter)
    && `${job.title} ${job.company}`.toLowerCase().includes(search.toLowerCase()));

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setAuthLoading(true);
    try {
      const { auth } = getFirebaseServices();
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const errorCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (["auth/invalid-credential", "auth/invalid-login-credentials", "auth/user-not-found", "auth/wrong-password"].includes(errorCode)) {
        setLoginError("Invalid email or password. Please try again.");
      } else if (errorCode === "auth/invalid-email") {
        setLoginError("Enter a valid email address.");
      } else {
        setLoginError(error instanceof Error ? error.message : "Unable to sign in. Check your credentials.");
      }
      setAuthLoading(false);
    }
  }

  async function logout() {
    const { auth } = getFirebaseServices();
    await signOut(auth);
    setFormOpen(false);
    setEditingId(null);
  }

  function startCreate() {
    setDraft(emptyDraft());
    setEditingId(null);
    setFormOpen(true);
    setNotice("");
  }

  function startEdit(job: Job) {
    const { id, createdDate, updatedDate, ...fields } = job;
    void createdDate;
    void updatedDate;
    const sector = job.sector || (GOVERNMENT_JOB_TYPES.includes(job.jobType || "") ? "Government" : "Private");
    const legacyType = job.jobType || "";
    const jobType = sector === "Government"
      ? GOVERNMENT_JOB_TYPES.includes(legacyType) ? legacyType : "Government Jobs"
      : PRIVATE_JOB_TYPES.includes(legacyType) ? legacyType : "IT Jobs";
    setDraft({
      ...emptyDraft(),
      ...fields,
      sector,
      privateJobType: job.privateJobType || (job.walkInDrive ? "Walk-in" : "Non-walk-in"),
      jobType,
      experience: job.experience || "",
    });
    setEditingId(id);
    setFormOpen(true);
    setNotice("");
  }

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const { db } = getFirebaseServices();
      const record = {
        ...draft,
        companyImage: draft.companyImage || "",
        walkInDrive: draft.sector === "Private" && draft.privateJobType === "Walk-in",
        walkInDate: draft.sector === "Private" && draft.privateJobType === "Walk-in" ? draft.walkInDate || "" : "",
        lastDateToApply: draft.sector === "Government" && draft.jobType === "Government Jobs" ? draft.lastDateToApply || "" : "",
      };
      if (editingId) {
        await update(ref(db, `jobs/${editingId}`), { ...record, updatedDate: new Date().toISOString() });
        setNotice("Job updated.");
      } else {
        await push(ref(db, "jobs"), { ...record, createdDate: new Date().toISOString() });
        setNotice("Job created.");
      }
      setFormOpen(false);
      setEditingId(null);
      setDraft(emptyDraft());
    } catch {
      setNotice("Unable to save. Check the Firebase database rules for this account.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob(job: Job) {
    if (!window.confirm(`Delete “${job.title}” at ${job.company}?`)) return;
    try {
      const { db } = getFirebaseServices();
      await remove(ref(db, `jobs/${job.id}`));
      setNotice("Job deleted.");
    } catch {
      setNotice("Unable to delete this job. Check database permissions.");
    }
  }

  function exportJobs() {
    const rows = jobs.map((job) => ({
      JobTitle: job.title || "",
      CompanyName: job.company || "",
      CompanyImageHtml: job.companyImage || "",
      JobIcon: job.jobIcon || "",
      Sector: job.sector || (GOVERNMENT_JOB_TYPES.includes(job.jobType || "") ? "Government" : "Private"),
      PrivateJobType: job.privateJobType || (job.walkInDrive ? "Walk-in" : "Non-walk-in"),
      JobType: job.jobType || "Walk-ins",
      Experience: job.experience || "Freshers",
      JobDescription: job.description || "",
      ApplyOfficialLink: job.otherLink || "",
      FullInformationImagesHtml: job.fullInformationTableFormat || "",
      FullJobInformationHtml: job.fullJobInformation || "",
      CreatedDate: job.createdDate || "",
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Jobs");
    XLSX.writeFile(workbook, `alljobs-${new Date().toISOString().slice(0, 10)}.xls`, { bookType: "xls" });
  }

  async function importJobs(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    setNotice("");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const { db } = getFirebaseServices();
      let imported = 0;
      for (const row of rows) {
        const title = importedValue(row, ["JobTitle", "Job Title", "Title"]).trim();
        const company = importedValue(row, ["CompanyName", "Company Name", "Company"]).trim();
        if (!title || !company) continue;
        const jobType = importedValue(row, ["JobType", "Job Type"]) || "Walk-ins";
        const sector = importedValue(row, ["Sector", "JobSector"]) || (GOVERNMENT_JOB_TYPES.includes(jobType) ? "Government" : "Private");
        const privateJobType = importedValue(row, ["PrivateJobType", "Private Job Type"]) || (jobType === "Walk-ins" || jobType === "Non-Walkins" ? "Walk-in" : "Non-walk-in");
        await push(ref(db, "jobs"), {
          title,
          company,
          companyImage: "",
          jobIcon: importedValue(row, ["JobIcon", "Job Icon"]),
          sector,
          privateJobType,
          jobType: jobType === "Walk-ins" || jobType === "Non-Walkins" ? "IT Jobs" : jobType,
          experience: importedValue(row, ["Experience"]) || "Freshers",
          description: importedValue(row, ["JobDescription", "Job Description"]),
          otherLink: importedValue(row, ["ApplyOfficialLink", "Apply Official Link"]),
          fullInformationTableFormat: importedValue(row, ["FullInformationImagesHtml", "Full Information Images Html", "FullInformationTableFormat"]),
          fullJobInformation: importedValue(row, ["FullJobInformationHtml", "Full Job Information Html", "FullJobInformation"]),
          walkInDrive: sector === "Private" && privateJobType === "Walk-in",
          walkInDate: importedValue(row, ["WalkInDate", "Walk-in Date"]),
          lastDateToApply: importedValue(row, ["LastDateToApply", "Last Date to Apply"]),
          createdDate: importedValue(row, ["CreatedDate", "Created Date"]) || new Date().toISOString(),
        });
        imported += 1;
      }
      setNotice(`Imported ${imported} jobs${rows.length > imported ? `; skipped ${rows.length - imported} incomplete rows` : ""}.`);
    } catch {
      setNotice("Could not import this spreadsheet. Use the freejob-info XLS column format.");
    } finally {
      setImporting(false);
    }
  }

  if (authLoading) return <main className="portal-shell"><SiteHeader /><div className="detail-state">Checking sign-in…</div></main>;

  if (!user) return (
    <main className="portal-shell">
      <SiteHeader />
      <section className="login-page">
        <div className="login-intro"><p className="eyebrow">PUBLISHER ACCESS</p><h1>Welcome<br /><em>back.</em></h1><p>Sign in to manage freejob-info listings.</p><Link href="/">← Back to job listings</Link></div>
        <form className="login-form" onSubmit={login}>
          <div className="login-form-heading"><span className="login-shield" aria-hidden="true">FJ</span><div><p className="eyebrow">ADMINISTRATOR</p><h2>Sign in</h2></div></div>
          <label><span>Email address</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
          {loginError ? <p className="form-error">{loginError}</p> : null}
          <button className="primary-button login-submit" type="submit">Sign in to dashboard <span aria-hidden="true">→</span></button>
          <p className="login-note">Use your registered Firebase admin account.</p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );

  return (
    <main className="portal-shell">
      <SiteHeader />
      <section className="admin-wrap">
        <div className="admin-heading"><div><p className="eyebrow">PUBLISHER WORKSPACE</p><h1>Job management</h1><p>Signed in as <strong>{user.email}</strong></p></div><button className="secondary-button admin-signout" type="button" onClick={logout}>Sign out</button></div>
        <div className="admin-summary"><strong>{jobs.length.toLocaleString("en-IN")}</strong><span>published listings</span><span className="admin-summary-divider" /><span>Manage the live freejob-info feed</span></div>
        <div className="admin-toolbar"><div className="admin-controls"><label className="sr-only" htmlFor="admin-search">Search jobs</label><input id="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or company" /><label className="sr-only" htmlFor="admin-type">Filter by job type</label><select id="admin-type" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All job types</option>{JOB_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div><div className="admin-actions"><label className="secondary-button import-button">{importing ? "Importing…" : "Import XLS"}<input type="file" accept=".xls,.xlsx" onChange={importJobs} disabled={importing} /></label><button className="secondary-button" type="button" onClick={exportJobs}>Export XLS</button><button className="primary-button" type="button" onClick={startCreate}>＋ Create job</button></div></div>
        {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
        {formOpen ? <div className="job-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section className="job-editor" role="dialog" aria-modal="true" aria-labelledby="job-editor-title"><form onSubmit={saveJob}><div className="editor-heading"><div><p className="eyebrow">{editingId ? "UPDATE LISTING" : "NEW LISTING"}</p><h2 id="job-editor-title">{editingId ? "Edit job" : "Create a job"}</h2></div><button type="button" className="icon-button" onClick={() => setFormOpen(false)} aria-label="Close form">×</button></div>
          <div className="editor-grid">
            <label><span>Job title *</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
            <label><span>Company *</span><input value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} required /></label>
            <label><span>Sector</span><select value={draft.sector || "Government"} onChange={(event) => { const sector = event.target.value as "Government" | "Private"; setDraft({ ...draft, sector, jobType: sector === "Government" ? "Government Jobs" : "IT Jobs", walkInDate: "", lastDateToApply: "" }); }}><option value="Government">Government</option><option value="Private">Private</option></select></label>
            {draft.sector === "Government" ? <>
              <label><span>Government type</span><select value={draft.jobType || "Government Jobs"} onChange={(event) => setDraft({ ...draft, jobType: event.target.value, lastDateToApply: "" })}>{GOVERNMENT_JOB_TYPES.map((type) => <option key={type} value={type}>{type === "Government Jobs" ? "Jobs" : type}</option>)}</select></label>
              {draft.jobType === "Government Jobs" ? <label><span>Last date to apply</span><input type="date" value={draft.lastDateToApply || ""} onChange={(event) => setDraft({ ...draft, lastDateToApply: event.target.value })} /></label> : null}
            </> : <>
              <label><span>Private hiring type</span><select value={draft.privateJobType || "Non-walk-in"} onChange={(event) => setDraft({ ...draft, privateJobType: event.target.value as "Walk-in" | "Non-walk-in", walkInDate: "" })}><option value="Walk-in">Walk-in</option><option value="Non-walk-in">Non-walk-in</option></select></label>
              <label><span>Private job type</span><select value={draft.jobType || "IT Jobs"} onChange={(event) => setDraft({ ...draft, jobType: event.target.value })}>{PRIVATE_JOB_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              {draft.privateJobType === "Walk-in" ? <label><span>Walk-in date</span><input type="date" value={draft.walkInDate || ""} onChange={(event) => setDraft({ ...draft, walkInDate: event.target.value })} /></label> : null}
            </>}
            <fieldset className="experience-picker editor-wide"><legend>Experience type</legend><label><input type="checkbox" checked={(draft.experience || "").split(/[,|]/).map((value) => value.trim()).includes("Freshers")} onChange={(event) => { const values = (draft.experience || "").split(/[,|]/).map((value) => value.trim()).filter(Boolean).filter((value) => value !== "Freshers"); if (event.target.checked) values.push("Freshers"); setDraft({ ...draft, experience: values.join(", ") }); }} />Fresher</label><label><input type="checkbox" checked={(draft.experience || "").split(/[,|]/).map((value) => value.trim()).includes("Experienced")} onChange={(event) => { const values = (draft.experience || "").split(/[,|]/).map((value) => value.trim()).filter(Boolean).filter((value) => value !== "Experienced"); if (event.target.checked) values.push("Experienced"); setDraft({ ...draft, experience: values.join(", ") }); }} />Experience</label></fieldset>
            <label><span>Official application URL</span><input type="url" value={draft.otherLink || ""} onChange={(event) => setDraft({ ...draft, otherLink: event.target.value })} /></label>
            <label><span>PDF URL</span><input type="url" value={draft.applyPdfLink || ""} onChange={(event) => setDraft({ ...draft, applyPdfLink: event.target.value })} /></label>
            <label><span>Created by</span><input value={draft.createdBy || ""} onChange={(event) => setDraft({ ...draft, createdBy: event.target.value })} /></label>
            <fieldset className="job-icon-picker editor-wide">
              <legend>Job icon</legend>
              <div className="job-icon-options">
                {JOB_ICON_OPTIONS.map(({ id, label, Icon }) => (
                  <label className={draft.jobIcon === id ? "job-icon-option selected" : "job-icon-option"} key={id} title={label}>
                    <input className="sr-only" type="radio" name="job-icon" value={id} checked={draft.jobIcon === id} onChange={() => setDraft({ ...draft, jobIcon: id })} />
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="editor-wide"><span>Description</span><textarea rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label className="editor-wide"><span>Job information rows (one “Label: Value” per line)</span><textarea rows={3} value={draft.fullInformationTableFormat || ""} onChange={(event) => setDraft({ ...draft, fullInformationTableFormat: event.target.value })} /></label>
            <label className="editor-wide"><span>Full notification</span><textarea rows={5} value={draft.fullJobInformation || ""} onChange={(event) => setDraft({ ...draft, fullJobInformation: event.target.value })} /></label>
          </div>
          <div className="editor-footer"><button className="secondary-button" type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update job" : "Publish job"}</button></div>
        </form></section></div> : null}
        <div className="admin-table-heading"><h2>Published jobs</h2><span>{filteredJobs.length} shown</span></div>
        <div className="admin-job-list">{filteredJobs.map((job) => <article className="admin-job-row" key={job.id}><CompanyBadge job={job} /><div className="admin-job-info"><strong>{job.title}</strong><span>{job.company} <i /> {job.jobType || "Opportunity"}</span></div><time>{dateLabel(job.createdDate)}</time><div className="admin-job-actions"><button className="text-action" type="button" onClick={() => startEdit(job)}>Edit</button><button className="text-action danger-action" type="button" onClick={() => deleteJob(job)}>Delete</button></div></article>)}{filteredJobs.length === 0 ? <div className="state-panel">No jobs match this view.</div> : null}</div>
      </section>
      <SiteFooter />
    </main>
  );
}