export const COLLECTION_META = {
  "rpi": { label: "RPI", color: "#0891b2", note: "Research, plan, implement, and review skills" },
  "hve-core": { label: "HVE Core", color: "#2f6feb", note: "Docs, prompt engineering, git and PRs, RPI agent" },
  "project-planning": { label: "Project Planning", color: "#7c4dff", note: "PRDs, BRDs, ADRs, backlog, architecture, UX" },
  "security": { label: "Security", color: "#d8572a", note: "Threat modeling, SSSC, reviews, incident response" },
  "coding-standards": { label: "Coding Standards", color: "#555555", note: "Code review — functional, standards, security, accessibility" },
  "accessibility": { label: "Accessibility", color: "#15803d", note: "WCAG, ARIA, Section 508 planning and review" },
  "privacy": { label: "Privacy", color: "#4338ca", note: "Privacy planning and review" },
  "rai-planning": { label: "RAI Planning", color: "#ad1457", note: "Responsible AI impact assessments" },
  "rai": { label: "RAI Standards", color: "#db2777", note: "Responsible AI standards reference" },
  "data-science-engineering": { label: "Data Science & Engineering", color: "#1f8a6e", note: "Data catalogs, evaluation design, DataOps, ML experiments" },
  "design-thinking": { label: "Design Thinking", color: "#e0a800", note: "IDEO-style discovery, ideation, testing" },
  "engagement-reporting": { label: "Engagement Reporting", color: "#b45309", note: "Engagement reports, council critique, Outlook drafts" },
  "shared": { label: "Shared", color: "#64748b", note: "Backlog templates, PR references, telemetry" },
  "installer": { label: "Installer", color: "#78716c", note: "HVE Core installation" },
  "experimental": { label: "Experimental", color: "#8e4ec6", note: "Not yet stabilized — expect change" },
  "root": { label: "General", color: "#6b7280", note: "Cross-cutting repo agents" },
};

export const COLLECTION_ORDER = [
  "rpi","hve-core","project-planning","security","coding-standards",
  "accessibility","privacy","rai-planning","rai",
  "data-science-engineering","design-thinking","engagement-reporting",
  "shared","installer","experimental","root"
];
