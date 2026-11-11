export interface Job {
  id: string;
  title: string;
  company: string;
  companyImage?: string;
  jobIcon?: string;
  sector?: "Government" | "Private";
  privateJobType?: "Walk-in" | "Non-walk-in";
  jobType?: string;
  experience?: string;
  fullInformationTableFormat?: string;
  fullJobInformation?: string;
  walkInDrive?: boolean;
  walkInDate?: string;
  lastDateToApply?: string;
  description: string;
  otherLink?: string;
  applyPdfLink?: string;
  createdBy?: string;
  createdDate: string;
  updatedDate?: string;
}

export interface JobComment {
  id: string;
  name: string;
  comment: string;
  createdDate: string;
}

export const DEFAULT_JOB_CATEGORIES = [
  "Government Jobs",
  "IT Walk-ins",
  "BPO/Non-IT Walk-ins",
  "Banking Walk-ins",
  "Pharma Walk-ins",
];

export const JOB_TYPES = [
  "Walk-ins",
  "Government Jobs",
  "Results",
  "Syllabus",
  "Career Tips",
  "IT Jobs",
  "Non-IT Jobs",
  "Pharmaceutical Jobs",
  "Bank Jobs",
  "Other",
];