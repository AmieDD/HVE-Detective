export const COLLECTION_META = {
  "hve-core": { label: "HVE Core", color: "#2f6feb", note: "RPI workflow, prompt engineering, memory, PRs" },
  "project-planning": { label: "Project Planning", color: "#7c4dff", note: "PRDs, BRDs, ADRs, architecture, UX" },
  "security": { label: "Security", color: "#d8572a", note: "Threat modeling, SSSC, reviews, incident response" },
  "design-thinking": { label: "Design Thinking", color: "#e0a800", note: "IDEO-style discovery, ideation, testing" },
  "data-science": { label: "Data Science", color: "#1f8a6e", note: "Notebooks, Streamlit, eval datasets" },
  "coding-standards": { label: "Coding Standards", color: "#555555", note: "Code review — full, functional, standards" },
  "ado": { label: "Azure DevOps", color: "#0078d4", note: "Work items, sprint planning, PRs via ADO" },
  "github": { label: "GitHub", color: "#24292f", note: "Issues, backlog, triage via GitHub" },
  "jira": { label: "Jira", color: "#0052cc", note: "Jira work item workflows" },
  "gitlab": { label: "GitLab", color: "#fc6d26", note: "GitLab merge requests and pipeline workflows" },
  "rai-planning": { label: "RAI Planning", color: "#ad1457", note: "Responsible AI impact assessments" },
  "experimental": { label: "Experimental", color: "#8e4ec6", note: "Not yet stabilized — expect change" },
  "root": { label: "General", color: "#6b7280", note: "Cross-cutting repo agents" },
};

export const COLLECTION_ORDER = [
  "hve-core","project-planning","security","coding-standards",
  "data-science","design-thinking","github","ado","jira","gitlab",
  "rai-planning","experimental","root"
];
