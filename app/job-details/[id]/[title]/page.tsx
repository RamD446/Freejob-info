import JobDetails from "../../../components/job-details";

export const instant = false;

export default async function LegacyJobPage({ params }: { params: Promise<{ id: string; title: string }> }) {
  const { id } = await params;
  return <JobDetails jobId={id} />;
}