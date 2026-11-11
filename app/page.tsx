import { Suspense } from "react";
import JobsHome from "./components/jobs-home";

export default function HomePage() {
  return <Suspense fallback={<main className="portal-shell"><div className="state-panel">Loading jobs...</div></main>}><JobsHome /></Suspense>;
}
