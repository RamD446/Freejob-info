import { Briefcase } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="finding-jobs-loader" role="status" aria-live="polite">
      <div className="loader-orbit" aria-hidden="true">
        <Briefcase className="loader-briefcase" size={27} strokeWidth={1.8} />
      </div>
      <p className="loader-title">Finding jobs</p>
      <p className="loader-sub">Please wait while we load the latest opportunities</p>
    </div>
  );
}