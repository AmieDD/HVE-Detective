export const COLLECTION_META = {
  "hve-core": { label: "HVE Core", color: "#2f6feb", note: "RPI workflow, prompt engineering, memory, PRs", stability: "stable" },
  "project-planning": { label: "Project Planning", color: "#7c4dff", note: "PRDs, BRDs, ADRs, architecture, UX", stability: "stable" },
  "security": { label: "Security", color: "#d8572a", note: "Threat modeling, SSSC, reviews, incident response", stability: "experimental" },
  "design-thinking": { label: "Design Thinking", color: "#e0a800", note: "IDEO-style discovery, ideation, testing", stability: "preview" },
  "data-science": { label: "Data Science", color: "#1f8a6e", note: "Notebooks, Streamlit, eval datasets", stability: "stable" },
  "coding-standards": { label: "Coding Standards", color: "#555555", note: "Code review — full, functional, standards", stability: "stable" },
  "ado": { label: "Azure DevOps", color: "#0078d4", note: "Work items, sprint planning, PRs via ADO", stability: "stable" },
  "github": { label: "GitHub", color: "#24292f", note: "Issues, backlog, triage via GitHub", stability: "stable" },
  "jira": { label: "Jira", color: "#0052cc", note: "Jira work item workflows", stability: "experimental" },
  "gitlab": { label: "GitLab", color: "#fc6d26", note: "GitLab merge requests and pipeline workflows", stability: "experimental" },
  "rai-planning": { label: "RAI Planning", color: "#ad1457", note: "Responsible AI impact assessments", stability: null },
  "experimental": { label: "Experimental", color: "#8e4ec6", note: "Not yet stabilized — expect change", stability: "experimental" },
  "root": { label: "General", color: "#6b7280", note: "Cross-cutting repo agents", stability: null },
};

export const COLLECTION_ORDER = [
  "hve-core","project-planning","security","coding-standards",
  "data-science","design-thinking","github","ado","jira","gitlab",
  "rai-planning","experimental","root"
];
