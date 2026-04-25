import Fuse from 'fuse.js';
import { KEYWORD_HINTS } from '../data/keywordHints';

export function enrichItems(items) {
  return items.map(item => ({
    ...item,
    searchHints: (KEYWORD_HINTS[item.slug] || []).join(' '),
  }));
}

export function createSearchIndex(items) {
  return new Fuse(items, {
    keys: [
      { name: 'searchHints', weight: 5 },
      { name: 'slug', weight: 4, getFn: (item) => (item.slug || '').replace(/-/g, ' ') },
      { name: 'name', weight: 4 },
      { name: 'command', weight: 4 },
      { name: 'description', weight: 3 },
      { name: 'intro', weight: 2 },
      { name: 'headings.text', weight: 1.5 },
      { name: 'collection', weight: 1 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
  });
}

function exactSubstringMatch(items, query, keys) {
  const q = query.toLowerCase();
  return items.filter(item =>
    keys.some(k => {
      const val = k.getFn ? k.getFn(item) : item[k.name];
      if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(q));
      return val != null && String(val).toLowerCase().includes(q);
    })
  );
}

const EXACT_KEYS = [
  { name: 'searchHints' },
  { name: 'slug', getFn: (item) => (item.slug || '').replace(/-/g, ' ') },
  { name: 'name' },
  { name: 'command' },
  { name: 'description' },
  { name: 'collection' },
];

export function search(fuseIndex, query, allItems) {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  // Exact substring matches — always included, ranked first
  const exact = allItems ? exactSubstringMatch(allItems, q, EXACT_KEYS) : [];

  // Fuse.js fuzzy matches
  const fuzzy = fuseIndex.search(q).map(r => r.item);

  // Merge: exact first, then fuzzy-only (deduplicated)
  const seen = new Set(exact.map(x => x.slug || x.command));
  return [...exact, ...fuzzy.filter(x => !seen.has(x.slug || x.command))];
}

export function splitSentence(s) {
  if (!s) return "";
  const m = s.match(/^(.{40,160}?[.!?])(\s|$)/);
  return m ? m[1] : s;
}

export function highlight(text, terms) {
  if (!terms || !terms.length || !text) return text;
  const re = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ")", "gi");
  const parts = String(text).split(re);
  return parts.map((p, i) => re.test(p) ? <mark key={i}>{p}</mark> : p);
}
