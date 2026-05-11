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

| Tool | Version |
|------|---------|
| Vite | 6 |
| React | 18 |
| Fuse.js | 7 |


## License

[MIT](LICENSE)
