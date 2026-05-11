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
    useTokenSearch: true,
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

function hasTokenInKeys(item, token, keys) {
  return keys.some(k => {
    const val = k.getFn ? k.getFn(item) : item[k.name];
    if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(token));
    return val != null && String(val).toLowerCase().includes(token);
  });
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
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Exact substring matches — always included, ranked first
  const exact = allItems ? exactSubstringMatch(allItems, q, EXACT_KEYS) : [];
  exact.forEach(item => { item._score = 0; item._matchType = 'exact'; });

  // Fuse.js fuzzy matches — preserve score
  const fuzzyResults = fuseIndex.search(q);
  let fuzzy = fuzzyResults.map(r => {
    r.item._score = r.score;
    r.item._matchType = 'fuzzy';
    return r.item;
  });

  // Multi-token precision guard: token search OR-matches per term across long
  // description/intro fields, which lets unrelated items leak in for queries
  // like "threat model service". Require every token to appear as a substring
  // somewhere; single-token queries keep full fuzzy/typo tolerance.
  if (tokens.length > 1) {
    fuzzy = fuzzy.filter(item => tokens.every(t => hasTokenInKeys(item, t, EXACT_KEYS)));
  }

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
