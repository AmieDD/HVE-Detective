#!/usr/bin/env node
// Regenerates src/data/catalog.json from a local checkout of microsoft/hve-core.

import { readFileSync, writeFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { resolve, join, dirname, relative, isAbsolute, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse as parseYaml } from 'yaml';
import { COLLECTION_META, COLLECTION_ORDER } from '../src/data/collectionMeta.js';
import { KEYWORD_HINTS } from '../src/data/keywordHints.js';

const REPO = 'microsoft/hve-core';
const SHRINK_RATIO = 0.7;
const LIST_LIMIT = 200;
const KINDS = [
  { kind: 'agent', key: 'agents', manifestKey: 'agents', folder: 'agents' },
  { kind: 'prompt', key: 'prompts', manifestKey: 'commands', folder: 'prompts' },
  { kind: 'skill', key: 'skills', manifestKey: 'skills', folder: 'skills' },
];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(repoRoot, 'src', 'data', 'catalog.json');

function usage(message) {
  console.error(`error: ${message}`);
  console.error('usage: npm run catalog:sync -- --source <hve-core checkout> [--ref <name>] [--summary <file>] [--allow-shrink]');
  process.exit(2);
}

function asBool(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 'true';
}

function asText(value) {
  return value === undefined || value === null ? '' : String(value).replace(/\s+/g, ' ').trim();
}

// Returns the absolute path for a manifest entry, or an error when it could escape the checkout.
function resolveInside(root, realRoot, entry) {
  if (typeof entry !== 'string' || entry.trim() === '') return { error: 'is not a non-empty string' };
  if (isAbsolute(entry) || /^[a-zA-Z]:/.test(entry) || /^[\\/]/.test(entry)) return { error: 'is an absolute path' };
  if (entry.split(/[\\/]/).includes('..')) return { error: 'contains parent traversal' };
  const full = resolve(root, entry);
  const rel = relative(root, full);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return { error: 'resolves outside the checkout' };
  if (existsSync(full)) {
    const realRel = relative(realRoot, realpathSync(full));
    if (realRel === '' || realRel.startsWith('..') || isAbsolute(realRel)) return { error: 'links outside the checkout' };
  }
  return { full };
}

function splitFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return { frontmatter: {}, body: text, text };
  const parsed = parseYaml(match[1]);
  const frontmatter = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  return { frontmatter, body: text.slice(match[0].length), text };
}

function countLines(text) {
  if (text === '') return 0;
  return (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n').length;
}

// intro = first prose paragraph; headings = H2/H3 outside fenced code.
function parseBody(body) {
  const headings = [];
  const paragraph = [];
  let intro = null;
  let fence = null;
  let inComment = false;
  const closeParagraph = () => {
    if (intro === null && paragraph.length) intro = paragraph.join(' ');
  };
  for (const line of body.split('\n')) {
    if (inComment) {
      if (line.includes('-->')) inComment = false;
      continue;
    }
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      closeParagraph();
      continue;
    }
    if (fence) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith('<!--')) {
      if (!trimmed.includes('-->', 4)) inComment = true;
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      if (level === 2 || level === 3) headings.push({ level, text: heading[2] });
      closeParagraph();
      continue;
    }
    if (intro !== null) continue;
    if (trimmed === '') closeParagraph();
    else paragraph.push(trimmed);
  }
  closeParagraph();
  return { intro: intro ?? '', headings };
}

function buildItem(kind, entry, segments, frontmatter, text, body) {
  const collection = segments[2];
  const path = segments.slice(1).join('/');
  const description = asText(frontmatter.description);
  const argumentHint = asText(frontmatter['argument-hint']);
  const { intro, headings } = parseBody(body);
  const lineCount = countLines(text);

  if (kind === 'agent') {
    const slug = basename(entry).replace(/\.agent\.md$/, '');
    return {
      kind, path, slug,
      name: asText(frontmatter.name) || slug,
      description, collection,
      subagent: segments.includes('subagents'),
      userInvocable: asBool(frontmatter['user-invocable'], true),
      disableModelInvocation: asBool(frontmatter['disable-model-invocation'], false),
      subagents: Array.isArray(frontmatter.agents) ? frontmatter.agents.filter(a => typeof a === 'string') : [],
      handoffs: Array.isArray(frontmatter.handoffs)
        ? frontmatter.handoffs
          .filter(h => h && typeof h === 'object')
          .map(h => ({ label: asText(h.label), agent: asText(h.agent), prompt: asText(h.prompt) }))
        : [],
      argumentHint, intro, headings, lineCount,
    };
  }
  if (kind === 'prompt') {
    const slug = basename(entry).replace(/\.prompt\.md$/, '');
    return {
      kind, path, slug,
      command: '/' + (asText(frontmatter.name) || slug),
      description, collection,
      agent: asText(frontmatter.agent),
      argumentHint, intro, headings, lineCount,
    };
  }
  const slug = segments[segments.length - 2];
  const name = asText(frontmatter.name) || slug;
  return {
    kind, path, slug,
    command: '/' + name,
    name, description, collection,
    userInvocable: asBool(frontmatter['user-invocable'], true),
    disableModelInvocation: asBool(frontmatter['disable-model-invocation'], false),
    argumentHint,
    license: frontmatter.license === undefined || frontmatter.license === null ? null : asText(frontmatter.license),
    intro, headings, lineCount,
  };
}

function readManifest(source, errors) {
  const manifestPath = join(source, 'plugin.json');
  if (!existsSync(manifestPath)) usage(`no plugin.json found in ${source}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    usage('plugin.json is not valid JSON');
  }
  for (const { manifestKey } of KINDS) {
    if (!Array.isArray(manifest[manifestKey])) errors.push(`plugin.json: "${manifestKey}" is not an array`);
  }
  return manifest;
}

function collectItems(source, manifest, errors) {
  const realRoot = realpathSync(source);
  const catalog = { agents: [], prompts: [], skills: [] };
  for (const { kind, key, manifestKey, folder } of KINDS) {
    for (const entry of manifest[manifestKey] ?? []) {
      const label = `plugin.json ${manifestKey} entry ${JSON.stringify(entry)}`;
      const resolved = resolveInside(source, realRoot, entry);
      if (resolved.error) { errors.push(`${label} ${resolved.error}`); continue; }
      const segments = entry.replace(/\\/g, '/').replace(/\/+$/, '').split('/');
      if (segments[0] !== '.github' || segments[1] !== folder || segments.length < 4) {
        errors.push(`${label} does not match .github/${folder}/<area>/...`);
        continue;
      }
      let file = resolved.full;
      if (kind === 'skill') {
        if (segments.length !== 4) { errors.push(`${label} does not match .github/skills/<area>/<name>`); continue; }
        file = join(resolved.full, 'SKILL.md');
        segments.push('SKILL.md');
      }
      if (!existsSync(file) || !statSync(file).isFile()) { errors.push(`${label} is missing on disk`); continue; }
      let parsed;
      try {
        parsed = splitFrontmatter(readFileSync(file, 'utf8'));
      } catch (err) {
        errors.push(`${label} has invalid frontmatter YAML (${err.code ?? 'parse error'})`);
        continue;
      }
      const item = buildItem(kind, entry, segments, parsed.frontmatter, parsed.text, parsed.body);
      if (!item.description) errors.push(`${label} has no description`);
      catalog[key].push(item);
    }
    catalog[key].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }
  return catalog;
}

function validateCollections(items, errors) {
  const missing = new Map();
  for (const item of items) {
    if (!COLLECTION_ORDER.includes(item.collection) || !COLLECTION_META[item.collection]) {
      missing.set(item.collection, (missing.get(item.collection) ?? 0) + 1);
    }
  }
  for (const [collection, count] of missing) {
    errors.push(`collection "${collection}" (${count} item${count === 1 ? '' : 's'}) is missing from COLLECTION_ORDER or COLLECTION_META in src/data/collectionMeta.js`);
  }
}

function readPrevious() {
  if (!existsSync(catalogPath)) return [];
  try {
    const previous = JSON.parse(readFileSync(catalogPath, 'utf8'));
    return [...(previous.agents ?? []), ...(previous.prompts ?? []), ...(previous.skills ?? [])];
  } catch {
    return [];
  }
}

function capped(lines) {
  if (lines.length <= LIST_LIMIT) return lines;
  return [...lines.slice(0, LIST_LIMIT), `- ...and ${lines.length - LIST_LIMIT} more`];
}

function buildSummary(catalog, previousItems) {
  const itemKey = item => `${item.kind}/${item.slug}`;
  const nextItems = [...catalog.agents, ...catalog.prompts, ...catalog.skills];
  const prev = new Map(previousItems.map(item => [itemKey(item), item]));
  const next = new Map(nextItems.map(item => [itemKey(item), item]));
  const added = [...next.keys()].filter(k => !prev.has(k)).sort();
  const removed = [...prev.keys()].filter(k => !next.has(k)).sort();
  const changed = [];
  for (const [k, item] of next) {
    const before = prev.get(k);
    if (!before) continue;
    const fields = [...new Set([...Object.keys(before), ...Object.keys(item)])]
      .filter(f => JSON.stringify(before[f]) !== JSON.stringify(item[f]))
      .sort();
    if (fields.length) changed.push(`${k}: ${fields.join(', ')}`);
  }
  changed.sort();
  const slugs = new Set(nextItems.map(item => item.slug));
  const orphanHints = Object.keys(KEYWORD_HINTS).filter(slug => !slugs.has(slug)).sort();
  const prevCount = kind => previousItems.filter(item => item.kind === kind).length;
  const background = catalog.skills.filter(skill => !skill.userInvocable).length;
  const { source } = catalog;

  return [
    '# Catalog sync summary',
    '',
    `Source: ${source.repo} @ ${source.sha.slice(0, 7)} (ref ${source.ref}, committed ${source.committedAt})`,
    '',
    '| Kind | Previous | New |',
    '|------|---------:|----:|',
    `| Agents | ${prevCount('agent')} | ${catalog.agents.length} |`,
    `| Prompts | ${prevCount('prompt')} | ${catalog.prompts.length} |`,
    `| Skills | ${prevCount('skill')} | ${catalog.skills.length} |`,
    `| Total | ${previousItems.length} | ${nextItems.length} |`,
    '',
    `Background skills (not user-invocable): ${background}`,
    '',
    `## Added (${added.length})`,
    '',
    ...capped(added.map(k => `- ${k}`)),
    '',
    `## Removed (${removed.length})`,
    '',
    ...capped(removed.map(k => `- ${k}`)),
    '',
    `## Changed (${changed.length})`,
    '',
    ...capped(changed.map(line => `- ${line}`)),
    '',
    `## Keyword hints without a catalog slug (${orphanHints.length})`,
    '',
    ...capped(orphanHints.map(slug => `- ${slug}`)),
    '',
  ].join('\n');
}

function main() {
  const { values: args } = parseArgs({
    options: {
      source: { type: 'string' },
      ref: { type: 'string' },
      summary: { type: 'string' },
      'allow-shrink': { type: 'boolean', default: false },
    },
  });
  if (!args.source) usage('--source is required');
  const source = resolve(args.source);
  if (!existsSync(source) || !statSync(source).isDirectory()) usage(`--source ${source} is not a directory`);

  const git = (...gitArgs) => execFileSync('git', ['-C', source, ...gitArgs], { encoding: 'utf8' }).trim();
  const sha = git('rev-parse', 'HEAD');
  if (!/^[0-9a-f]{40}$/.test(sha)) usage(`could not read a commit SHA from ${source}`);
  const committedAt = git('show', '-s', '--format=%cI', 'HEAD');
  const ref = args.ref ?? git('rev-parse', '--abbrev-ref', 'HEAD');

  const errors = [];
  const manifest = readManifest(source, errors);
  const items = collectItems(source, manifest, errors);
  const catalog = {
    schemaVersion: 2,
    source: { repo: REPO, ref, sha, committedAt },
    ...items,
  };
  const allItems = [...catalog.agents, ...catalog.prompts, ...catalog.skills];
  validateCollections(allItems, errors);

  const previousItems = readPrevious();
  if (!args['allow-shrink'] && previousItems.length > 0 && allItems.length < previousItems.length * SHRINK_RATIO) {
    errors.push(`item total fell from ${previousItems.length} to ${allItems.length} (below ${SHRINK_RATIO * 100}% of the previous catalog); rerun with --allow-shrink if this is expected`);
  }

  if (errors.length) {
    console.error(`catalog:sync failed with ${errors.length} error${errors.length === 1 ? '' : 's'}; src/data/catalog.json was not changed.`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }

  const summary = buildSummary(catalog, previousItems);
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  if (args.summary) writeFileSync(resolve(args.summary), summary);
  console.log(summary);
}

main();
