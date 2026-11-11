import { getJobIcon } from "../lib/job-icons";
import { Job } from "../lib/types";

export default function CompanyBadge({ job, size }: { job: Job; size?: "large" }) {
  const icon = getJobIcon(job.jobIcon);
  const fallback = (job.company || job.title || "J").trim().charAt(0).toUpperCase();

  return (
    <div className={`company-badge${size === "large" ? " large" : ""}`} aria-hidden="true">
      {icon ? <span className={size === "large" ? "job-icon-glyph large" : "job-icon-glyph"}>{icon}</span> : fallback}
    </div>
  );
}