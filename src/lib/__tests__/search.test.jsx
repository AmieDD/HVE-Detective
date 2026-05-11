import { describe, it, expect } from 'vitest';
import { enrichItems, createSearchIndex, search, splitSentence } from '../search.jsx';

const FIXTURES = [
  { slug: 'dt-coach', name: 'DT Coach', command: '/dt-coach', description: 'Design Thinking coach', collection: 'design-thinking', intro: '', headings: [] },
  { slug: 'pr-review', name: 'PR Review', command: '/pr-review', description: 'Pull request reviewer', collection: 'hve-core', intro: '', headings: [] },
  { slug: 'rai-planner', name: 'RAI Planner', command: '/rai-capture', description: 'Responsible AI planner', collection: 'rai-planning', intro: '', headings: [] },
  { slug: 'sssc-planner', name: 'SSSC Planner', command: '/sssc-capture', description: 'Supply chain (SBOM, SLSA) planner', collection: 'security', intro: '', headings: [] },
  { slug: 'ado-backlog-manager', name: 'ADO Backlog Manager', command: '/ado-triage-work-items', description: 'Azure DevOps backlog orchestrator', collection: 'ado', intro: '', headings: [] },
  { slug: 'security-planner', name: 'Security Planner', command: '/security-capture', description: 'Threat model for your service using STRIDE', collection: 'security', intro: '', headings: [] },
  { slug: 'gen-jupyter-notebook', name: 'DS Gen Jupyter Notebook', command: '/jupyter', description: 'Generate Jupyter notebooks for EDA', collection: 'data-science', intro: '', headings: [] },
];

function build() {
  const items = enrichItems(FIXTURES.map(f => ({ ...f })));
  return { items, fuse: createSearchIndex(items) };
}

describe('search()', () => {
  it('returns empty array for empty/whitespace queries', () => {
    const { items, fuse } = build();
    expect(search(fuse, '', items)).toEqual([]);
    expect(search(fuse, '   ', items)).toEqual([]);
  });

  it.each([
    ['dt', 'dt-coach'],
    ['pr', 'pr-review'],
    ['ado', 'ado-backlog-manager'],
    ['rai', 'rai-planner'],
    ['sbom', 'sssc-planner'],
  ])('short abbreviation %p surfaces %p as the first result', (query, expectedSlug) => {
    const { items, fuse } = build();
    const results = search(fuse, query, items);
    expect(results[0].slug).toBe(expectedSlug);
  });

  it('ranks exact-substring matches ahead of fuzzy-only matches', () => {
    const { items, fuse } = build();
    const results = search(fuse, 'jupyter', items);
    expect(results[0].slug).toBe('gen-jupyter-notebook');
    expect(results[0]._matchType).toBe('exact');
  });

  it('multi-token queries require every token to appear (AND filter)', () => {
    const { items, fuse } = build();
    const results = search(fuse, 'threat model service', items);
    expect(results.map(r => r.slug)).toContain('security-planner');
    // dt-coach has neither "threat" nor "service" — must not leak in
    expect(results.map(r => r.slug)).not.toContain('dt-coach');
  });
});

describe('splitSentence()', () => {
  it('returns first sentence in the 40–160 char window', () => {
    const s = 'This is a reasonably long opening sentence used for tests. Second sentence stays out.';
    expect(splitSentence(s)).toBe('This is a reasonably long opening sentence used for tests.');
  });

  it('returns the original string when no terminator falls in range', () => {
    const s = 'short';
    expect(splitSentence(s)).toBe(s);
  });
});
