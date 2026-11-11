import {
  BookOpen,
  Briefcase,
  Building2,
  Code,
  GraduationCap,
  Globe,
  HeartPulse,
  Hospital,
  IndianRupee,
  Landmark,
  Laptop,
  Monitor,
  Phone,
  Plane,
  Settings,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { createElement, type ReactNode } from "react";

export const JOB_ICON_OPTIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "bi-briefcase-fill", label: "Briefcase", Icon: Briefcase },
  { id: "bi-building", label: "Building", Icon: Building2 },
  { id: "bi-bank", label: "Bank", Icon: Landmark },
  { id: "bi-laptop", label: "Laptop", Icon: Laptop },
  { id: "bi-code-slash", label: "Code", Icon: Code },
  { id: "bi-mortarboard-fill", label: "Education", Icon: GraduationCap },
  { id: "bi-hospital", label: "Hospital", Icon: Hospital },
  { id: "bi-heart-pulse-fill", label: "Healthcare", Icon: HeartPulse },
  { id: "bi-truck", label: "Transport", Icon: Truck },
  { id: "bi-airplane-fill", label: "Aviation", Icon: Plane },
  { id: "bi-gear-fill", label: "Engineering", Icon: Settings },
  { id: "bi-tools", label: "Tools", Icon: Wrench },
  { id: "bi-people-fill", label: "People", Icon: Users },
  { id: "bi-shop", label: "Retail", Icon: Store },
  { id: "bi-currency-rupee", label: "Finance", Icon: IndianRupee },
  { id: "bi-graph-up-arrow", label: "Growth", Icon: TrendingUp },
  { id: "bi-book-fill", label: "Books", Icon: BookOpen },
  { id: "bi-pc-display", label: "Computer", Icon: Monitor },
  { id: "bi-telephone-fill", label: "Telephone", Icon: Phone },
  { id: "bi-globe", label: "Global", Icon: Globe },
];

const jobIconsById = new Map<string, ReactNode>(JOB_ICON_OPTIONS.map(({ id, Icon }) => [
  id,
  createElement(Icon, { size: 20, strokeWidth: 1.8, className: "job-icon-glyph" }),
]));

export function getJobIcon(iconId?: string): ReactNode {
  return iconId ? jobIconsById.get(iconId) : undefined;
}