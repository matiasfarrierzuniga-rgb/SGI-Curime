import type { LucideIcon } from "lucide-react";
import type { AccessCapability } from "@/shared/security/access";

export type Icon = LucideIcon;
export type Tone = "success" | "warning" | "danger" | "info" | "violet";

export type QuickAction = {
  label: string;
  path: string;
  capability: AccessCapability;
  icon: Icon;
  tone: Tone;
};
