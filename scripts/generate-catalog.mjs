import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import matter from 'gray-matter';

const KINDS = [
  { dir: 'agents', suffix: '.agent.md', key: 'agents', singular: 'agent' },
  { dir: 'prompts', suffix: '.prompt.md', key: 'prompts', singular: 'prompt' },
  { dir: 'instructions', suffix: '.instructions.md', key: 'instructions', singular: 'instruction' },
  { dir: 'skills', filename: 'SKILL.md', key: 'skills', singular: 'skill' },
];

async function walk(root) {
  const out = [];
  async function rec(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await rec(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  await rec(root);
  return out;
}

function extractHeadings(body) {
  const headings = [];
  for (const line of body.split(/\r?\n/)) {
    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (m) {
      headings.push({ level: m[1].length, text: m[2].trim() });
    }
  }
  return headings;
}

function extractIntro(body) {
  // First non-empty paragraph that is not a heading or HTML comment.
  const lines = body.split(/\r?\n/);
  const paragraphs = [];
  let buf = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (buf.length) {
        paragraphs.push(buf.join('\n'));
        buf = [];
      }
    } else {
      buf.push(line);
    }
  }
  if (buf.length) paragraphs.push(buf.join('\n'));
  for (const p of paragraphs) {
    const t = p.trim();
    if (!t) continue;
    if (t.startsWith('#')) continue;
    if (t.startsWith('<!--')) continue;
    return t.replace(/\s+/g, ' ').trim();
  }
  return '';
}

function deriveCollection(relPath) {
  // relPath is relative to the kind directory, e.g. "security/foo.agent.md" or "foo.agent.md"
  const segs = relPath.split(path.sep);
  if (segs.length === 1) return 'root';
  return segs[0];
}

function deriveSlug(filePath, kind) {
  const base = path.basename(filePath);
  if (kind.filename) {
    // SKILL.md → parent directory name
    return path.basename(path.dirname(filePath));
  }
  return base.slice(0, -kind.suffix.length);
}

async function processFile(absPath, kindRootAbs, kind, pkgRoot) {
  const raw = await readFile(absPath, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch {
    parsed = { data: {}, content: raw };
  }
  const fm = parsed.data || {};
  const body = parsed.content || '';
  const relFromGithub = path.relative(path.join(pkgRoot, '.github'), absPath);
  const relFromKind = path.relative(kindRootAbs, absPath);
  const slug = deriveSlug(absPath, kind);
  const collection = deriveCollection(relFromKind);
  const headings = extractHeadings(body);
  const intro = extractIntro(body);
  const lineCount = raw.split(/\r?\n/).length;

  const entry = {
    kind: kind.singular,
    path: relFromGithub.split(path.sep).join('/'),
    slug,
    name: fm.name ?? slug,
    description: fm.description ?? '',
    collection,
  };

  // Frontmatter passthroughs (only include when defined)
  const passthroughs = [
    'subagent',
    'userInvocable',
    'disableModelInvocation',
    'subagents',
    'handoffs',
    'argumentHint',
    'command',
    'agent',
    'applyTo',
  ];

  // Map kebab/alt frontmatter keys to camelCase
  const aliasMap = {
    'user-invocable': 'userInvocable',
    'disable-model-invocation': 'disableModelInvocation',
    'argument-hint': 'argumentHint',
    'apply-to': 'applyTo',
  };
  const normalized = { ...fm };
  for (const [k, v] of Object.entries(aliasMap)) {
    if (k in fm && !(v in normalized)) normalized[v] = fm[k];
  }

  // Defaults that mirror existing agents/prompts catalog entries
  if (kind.singular === 'agent') {
    entry.subagent = normalized.subagent ?? false;
    entry.userInvocable = normalized.userInvocable ?? true;
    entry.disableModelInvocation = normalized.disableModelInvocation ?? false;
    entry.subagents = normalized.subagents ?? [];
    entry.handoffs = normalized.handoffs ?? [];
    entry.argumentHint = normalized.argumentHint ?? '';
    entry.intro = intro;
  } else if (kind.singular === 'prompt') {
    entry.command = normalized.command ?? `/${slug}`;
    entry.agent = normalized.agent ?? '';
    entry.argumentHint = normalized.argumentHint ?? '';
    entry.intro = intro;
  } else {
    // instructions, skills — include passthroughs only when set
    for (const key of passthroughs) {
      if (key in normalized) entry[key] = normalized[key];
    }
    if (intro) entry.intro = intro;
  }

  entry.headings = headings;
  entry.lineCount = lineCount;

  return entry;
}

async function generate(pkgRoot) {
  const githubRoot = path.join(pkgRoot, '.github');
  try {
    await stat(githubRoot);
  } catch {
    throw new Error(`No .github directory found at ${githubRoot}`);
  }

  const catalog = { agents: [], prompts: [], instructions: [], skills: [] };

  for (const kind of KINDS) {
    const kindRoot = path.join(githubRoot, kind.dir);
    try {
      await stat(kindRoot);
    } catch {
      continue;
    }
    const files = await walk(kindRoot);
    const matched = files.filter((f) => {
      if (kind.filename) return path.basename(f) === kind.filename;
      return f.endsWith(kind.suffix);
    });
    matched.sort();
    for (const f of matched) {
      const entry = await processFile(f, kindRoot, kind, pkgRoot);
      catalog[kind.key].push(entry);
    }
  }

  catalog.generatedAt = new Date().toISOString();
  return catalog;
}

async function main() {
  const pkgRoot = process.argv[2];
  if (!pkgRoot) {
    console.error('Usage: node scripts/generate-catalog.mjs <package-root>');
    process.exit(2);
  }
  const resolved = path.resolve(pkgRoot);
  const catalog = await generate(resolved);
  const here = path.dirname(fileURLToPath(import.meta.url));
  const out = path.resolve(here, '..', 'src', 'data', 'catalog.json');
  await writeFile(out, JSON.stringify(catalog) + '\n', 'utf8');
  console.error(
    `[generate-catalog] wrote ${out} ` +
      `(agents=${catalog.agents.length}, prompts=${catalog.prompts.length}, ` +
      `instructions=${catalog.instructions.length}, skills=${catalog.skills.length})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
