import type { GoalInput, GoalKind } from "../../api/types";

export interface GoalTemplate {
  id: string;
  title: string;
  desc: string;
  goal: GoalInput;
}

/** Ready-made goals for the things most sites want to count. */
export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "form",
    title: "Any form sent",
    desc: "Every contact, booking or newsletter form that is sent successfully.",
    goal: { name: "Form sent", kind: "request", method: "POST", path_pattern: "/forms/submit/*", link_slug: "" },
  },
  {
    id: "thanks",
    title: "Thank-you page reached",
    desc: "A page people only see after booking, paying or signing up.",
    goal: { name: "Reached the thank-you page", kind: "pageview", method: "GET", path_pattern: "/thank-you", link_slug: "" },
  },
  {
    id: "link",
    title: "Tracked link clicked",
    desc: "A click on one of your /go/ links, such as WhatsApp or a booking site.",
    goal: { name: "Opened WhatsApp", kind: "link", method: "", path_pattern: "", link_slug: "" },
  },
];

/** How each kind of goal reads in lists. */
export const KIND_LABEL: Record<GoalKind, string> = {
  pageview: "Page visited",
  request: "Form or request sent",
  link: "Link clicked",
};
