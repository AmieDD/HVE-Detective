# HVE Detective

[![Deploy to GitHub Pages](https://github.com/AmieDD/HVE-Detective/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/AmieDD/HVE-Detective/actions/workflows/deploy.yml)

Searchable directory of HVE Core Copilot agents and prompts.

**Live site:** <https://amiedd.github.io/HVE-Detective/>

## Features

- Fuzzy search powered by Fuse.js
- Collection filters for browsing by source package
- Kind filters to narrow results by agent, prompt, or instruction type
- Detail drawer with full metadata and descriptions
- Responsive design for desktop and mobile

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

Auto-deploys to GitHub Pages via GitHub Actions on every push to `main`.

## Technology Stack

| Tool                 | Version | Purpose                                              |
|----------------------|---------|------------------------------------------------------|
| Vite                 | 6       | Dev server and build tool                            |
| React                | 18      | UI framework                                         |
| React DOM            | 18      | React renderer for the browser                       |
| Fuse.js              | 7       | Fuzzy search over the catalog                        |
| @vitejs/plugin-react | 4       | React Fast Refresh and JSX support for Vite          |
| gray-matter          | 4       | YAML frontmatter parsing in the catalog generator    |
| Node.js              | 20      | Runtime for `scripts/generate-catalog.mjs` and CI    |
| GitHub Actions       | n/a     | CI/CD: deploy to GitHub Pages, catalog sync, CodeQL  |
| CodeQL               | v3      | Code scanning on push/PR to `main`                   |

## License

[MIT](LICENSE)
