import { Briefcase } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="finding-jobs-loader" role="status" aria-live="polite">
      <div className="loader-icon-wrap" aria-hidden="true">
        <Briefcase className="loader-briefcase" size={42} strokeWidth={1.8} />
        <div className="loader-dots"><span /><span /><span /></div>
      </div>
      <p className="loader-title">Finding Jobs<span className="loader-ellipsis">...</span></p>
      <p className="loader-sub">Please wait while we load the latest opportunities</p>
    </div>
  );
}