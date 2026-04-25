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
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
  });
}

export function search(fuseIndex, query) {
  if (!query || !query.trim()) return [];
  return fuseIndex.search(query.trim()).map(result => result.item);
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
