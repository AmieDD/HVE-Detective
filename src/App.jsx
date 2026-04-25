import React, { useState, useEffect, useMemo, useRef } from 'react';
import { COLLECTION_META, COLLECTION_ORDER } from './data/collectionMeta';
import { KEYWORD_HINTS } from './data/keywordHints';
import catalogData from './data/catalog.json';
import { enrichItems, createSearchIndex, search, highlight, splitSentence } from './lib/search.jsx';

// ---------- components ----------

function Header({ query, setQuery, stats }) {
  const placeholder = "search agents and prompts, e.g. threat model, jupyter, pull request\u2026";
  return (
    <header className="hd">
      <div className="hd-top">
        <div className="hd-brand">
          <div className="hd-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M4 6h4v5h8V6h4v12h-4v-5H8v5H4z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div className="hd-title">HVE Core</div>
            <div className="hd-sub">Agent &amp; Prompt Directory</div>
          </div>
        </div>
        <a className="hd-src" href="https://microsoft.github.io/hve-core/" target="_blank" rel="noreferrer">docs ↗</a>
      </div>
      <div className="hero">
        <h1 className="hero-q">
          <span className="hero-q-faint">Is there a hve-core agent that </span>
          <span className="hero-q-strong">does <em>X</em>?</span>
        </h1>

        <form className="hero-search" onSubmit={e => e.preventDefault()}>
          <svg viewBox="0 0 24 24" width="20" height="20" className="hero-ico">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
          {query && (
            <button type="button" className="hero-clear" onClick={() => setQuery("")} aria-label="Clear">✕</button>
          )}
        </form>

        <div className="hero-stats">
          <span><b>{stats.agents}</b> agents</span>
          <span className="dot" />
          <span><b>{stats.prompts}</b> prompts</span>
          <span className="dot" />
          <span><b>{stats.collections}</b> collections</span>
        </div>
      </div>
    </header>
  );
}

function ExamplePrompts({ onPick }) {
  const examples = [
    "search and document through an existing codebase",
    "turn a meeting transcript into tickets",
    "write a threat model for my service",
    "make a slide deck from my notes",
    "plan a sprint from a PRD",
    "review this pull request",
  ];
  return (
    <div className="ex-wrap">
      <div className="ex-label">Try searching:</div>
      <div className="ex-chips">
        {examples.map(e => (
          <button key={e} className="ex-chip" onClick={() => onPick(e)}>{e}</button>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, color, label, count }) {
  return (
    <button className={"chip " + (active ? "chip-on " : "")} onClick={onClick}>
      <span className="chip-dot" style={{ background: color }} />
      <span>{label}</span>
      {count !== undefined && <span className="chip-count">{count}</span>}
    </button>
  );
}

function KindHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="kind-help" ref={ref}>
      <button
        className={"kind-help-btn " + (open ? "on" : "")}
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        aria-label="What's the difference between agents and prompts?"
        aria-expanded={open}
      >
        <span className="kind-help-ico" aria-hidden="true">?</span>
        <span className="kind-help-lbl">What's the difference?</span>
      </button>
      {open && (
        <div className="kind-help-pop" role="dialog" onMouseLeave={() => setOpen(false)}>
          <div className="khp-row">
            <span className="kbadge k-agent">AGENT</span>
            <div className="khp-text">
              <b>A persona you pick</b> from Copilot Chat's agent dropdown. Owns a whole workflow —
              it has a full system prompt, a tool allow-list, and often orchestrates subagents.
              You select it once, then chat with it.
            </div>
          </div>
          <div className="khp-sep" />
          <div className="khp-row">
            <span className="kbadge k-prompt">PROMPT</span>
            <div className="khp-text">
              <b>A slash-command shortcut</b> you type mid-chat, like <code>/prd-new</code>.
              It runs on whichever agent is currently active and kicks off one specific task
              (draft a PRD, review a PR, generate a notebook).
            </div>
          </div>
          <div className="khp-foot">
            Rule of thumb: pick an <b>agent</b> to set the mode, run a <b>prompt</b> to do a specific job.
          </div>
        </div>
      )}
    </div>
  );
}

function Filters({ kind, setKind, collection, setCollection, counts, collectionCounts }) {
  return (
    <div className="filters">
      <div className="filter-row">
        <div className="seg">
          <button className={kind === "all" ? "on" : ""} onClick={() => setKind("all")}>
            All <span className="seg-count">{counts.all}</span>
          </button>
          <button className={kind === "agent" ? "on" : ""} onClick={() => setKind("agent")}>
            Agents <span className="seg-count">{counts.agent}</span>
          </button>
          <button className={kind === "prompt" ? "on" : ""} onClick={() => setKind("prompt")}>
            Prompts <span className="seg-count">{counts.prompt}</span>
          </button>
        </div>
        <KindHelp />
      </div>
      <div className="filter-row filter-chips">
        <Chip active={!collection} onClick={() => setCollection(null)} color="#111" label="All collections" />
        {COLLECTION_ORDER.filter(c => collectionCounts[c]).map(c => (
          <Chip
            key={c}
            active={collection === c}
            onClick={() => setCollection(collection === c ? null : c)}
            color={COLLECTION_META[c].color}
            label={COLLECTION_META[c].label}
            count={collectionCounts[c]}
          />
        ))}
      </div>
    </div>
  );
}

function KindBadge({ kind }) {
  return <span className={"kbadge k-" + kind}>{kind === "agent" ? "AGENT" : "PROMPT"}</span>;
}

function Card({ item, onOpen, queryTerms }) {
  const c = COLLECTION_META[item.collection] || COLLECTION_META.root;
  const headline = item.description || splitSentence(item.intro) || "\u2014";
  return (
    <button className="card" onClick={() => onOpen(item)}>
      <div className="card-hd">
        <span className="card-coll" style={{ color: c.color }}>
          <span className="card-coll-dot" style={{ background: c.color }} />
          {c.label}
        </span>
        <KindBadge kind={item.kind} />
      </div>
      <div className="card-name">
        {item.kind === "prompt" ? <code className="card-cmd">{item.command}</code> : <span>{item.name}</span>}
      </div>
      <div className="card-desc">{highlight(headline, queryTerms)}</div>
      <div className="card-tags">
        {item.subagent && <span className="tag tag-sub">subagent</span>}
        {item.disableModelInvocation && <span className="tag tag-manual">manual-select</span>}
        {item.subagents && item.subagents.length > 0 && <span className="tag tag-orch">orchestrates {item.subagents.length}</span>}
        {item.handoffs && item.handoffs.length > 0 && <span className="tag tag-hand">{item.handoffs.length} handoff{item.handoffs.length > 1 ? "s" : ""}</span>}
        {item.kind === "prompt" && item.agent && <span className="tag tag-agent">&rarr; {item.agent}</span>}
      </div>
    </button>
  );
}

function Drawer({ item, onClose, onJumpTo, allItems }) {
  useEffect(() => {
    if (!item) return;
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [item, onClose]);
  if (!item) return null;
  const c = COLLECTION_META[item.collection] || COLLECTION_META.root;
  const byName = Object.fromEntries(allItems.map(x => [String(x.name || "").toLowerCase(), x]));
  const resolveAgent = n => byName[String(n || "").toLowerCase()];

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drw" role="dialog" aria-label={item.name}>
        <div className="drw-hd">
          <div className="drw-hd-top">
            <span className="card-coll" style={{ color: c.color }}>
              <span className="card-coll-dot" style={{ background: c.color }} />
              {c.label}
            </span>
            <KindBadge kind={item.kind} />
            <button className="drw-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <h2 className="drw-title">
            {item.kind === "prompt" ? <code>{item.command}</code> : item.name}
          </h2>
          {item.kind === "prompt" && item.agent && (
            <div className="drw-meta">
              <span className="drw-meta-k">Runs on agent</span>
              <button className="drw-meta-v link" onClick={() => { const a = resolveAgent(item.agent); if (a) onJumpTo(a); }}>{item.agent}</button>
            </div>
          )}
          {item.argumentHint && (
            <div className="drw-meta">
              <span className="drw-meta-k">Usage</span>
              <code className="drw-meta-v mono">{item.kind === "prompt" ? item.command + " " : ""}{item.argumentHint}</code>
            </div>
          )}
        </div>

        <div className="drw-body">
          {item.description && (
            <section className="sec">
              <h3>What it does</h3>
              <p className="lede">{item.description}</p>
            </section>
          )}

          {item.intro && item.intro !== item.description && (
            <section className="sec">
              <h3>Overview</h3>
              <p>{item.intro}</p>
            </section>
          )}

          {item.kind === "agent" && item.subagents && item.subagents.length > 0 && (
            <section className="sec">
              <h3>Delegates to</h3>
              <div className="chip-list">
                {item.subagents.map(s => {
                  const a = resolveAgent(s);
                  return (
                    <button key={s} className={"mini-card " + (a ? "link" : "dim")} onClick={() => a && onJumpTo(a)} disabled={!a}>
                      <span className="mini-ico">⟶</span><span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {item.kind === "agent" && item.handoffs && item.handoffs.length > 0 && (
            <section className="sec">
              <h3>Handoffs offered</h3>
              <p className="sec-note">In-chat buttons this agent offers the user</p>
              <div className="handoffs">
                {item.handoffs.map((h, i) => (
                  <div className="handoff" key={i}>
                    <div className="handoff-label">{h.label}</div>
                    <div className="handoff-target">
                      <span className="arr">&rarr;</span>
                      <button className="link" onClick={() => { const a = resolveAgent(h.agent); if (a) onJumpTo(a); }}>{h.agent}</button>
                      {h.prompt && <code className="hprompt">{h.prompt}</code>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {item.kind === "agent" && (
            <section className="sec">
              <h3>How you invoke it</h3>
              <p className="sec-note">
                {item.disableModelInvocation
                  ? "Pick from the agent picker dropdown in Copilot Chat. The model won't auto-route to it."
                  : item.subagent
                    ? "Runs as a subagent — called by other agents, not picked from the dropdown."
                    : "Pick from the agent picker dropdown in Copilot Chat."}
              </p>
            </section>
          )}

          {item.kind === "prompt" && (
            <section className="sec">
              <h3>How you invoke it</h3>
              <p>Type <code>{item.command}</code> in Copilot Chat{item.argumentHint ? <> with <code>{item.argumentHint}</code></> : null}.</p>
            </section>
          )}

          {item.headings && item.headings.length > 0 && (
            <section className="sec">
              <h3>In the prompt</h3>
              <ul className="outline">
                {item.headings.map((h, i) => <li key={i} className={"ol-l" + h.level}>{h.text}</li>)}
              </ul>
            </section>
          )}

          <section className="sec sec-foot">
            <div className="pathrow"><span className="drw-meta-k">Source</span><code className="mono">.github/{item.path}</code></div>
            <div className="pathrow"><span className="drw-meta-k">Lines</span><code className="mono">{item.lineCount}</code></div>
          </section>
        </div>
      </aside>
    </>
  );
}

function GroupedView({ groups, onOpen, queryTerms }) {
  return (
    <div className="grouped">
      {COLLECTION_ORDER.filter(c => groups[c] && groups[c].length).map(c => (
        <section className="grp" key={c}>
          <div className="grp-hd">
            <span className="grp-dot" style={{ background: COLLECTION_META[c].color }} />
            <h2 className="grp-title">{COLLECTION_META[c].label}</h2>
            <span className="grp-count">{groups[c].length}</span>
            <span className="grp-note">{COLLECTION_META[c].note}</span>
          </div>
          <div className="grid">
            {groups[c].map(item => <Card key={item.kind + "/" + item.path} item={item} onOpen={onOpen} queryTerms={queryTerms} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function FlatView({ items, onOpen, queryTerms }) {
  return (
    <div className="grid">
      {items.map(item => <Card key={item.kind + "/" + item.path} item={item} onOpen={onOpen} queryTerms={queryTerms} />)}
    </div>
  );
}

// ---------- app ----------
function App() {
  const [catalog] = useState(catalogData);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [collection, setCollection] = useState(null);
  const [open, setOpen] = useState(null);

  const all = useMemo(() => {
    if (!catalog) return [];
    return [...catalog.agents, ...catalog.prompts];
  }, [catalog]);

  const enrichedItems = useMemo(() => enrichItems(all), [all]);
  const fuseIndex = useMemo(() => createSearchIndex(enrichedItems), [enrichedItems]);

  const filtered = useMemo(() => {
    let xs = enrichedItems;
    if (kind !== 'all') xs = xs.filter(x => x.kind === kind);
    if (collection) xs = xs.filter(x => x.collection === collection);
    const q = query.trim();
    if (q) {
      const results = search(fuseIndex, q);
      return results.filter(x => {
        if (kind !== 'all' && x.kind !== kind) return false;
        if (collection && x.collection !== collection) return false;
        return true;
      });
    }
    return xs.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "agent" ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });
  }, [enrichedItems, fuseIndex, kind, collection, query]);

  const groups = useMemo(() => {
    const g = {};
    for (const x of filtered) (g[x.collection] = g[x.collection] || []).push(x);
    return g;
  }, [filtered]);

  const counts = useMemo(() => {
    const baseFn = xs => xs.filter(x => !collection || x.collection === collection);
    return {
      all: baseFn(all).length,
      agent: baseFn(all.filter(x => x.kind === "agent")).length,
      prompt: baseFn(all.filter(x => x.kind === "prompt")).length,
    };
  }, [all, collection]);

  const collectionCounts = useMemo(() => {
    const cc = {};
    const src = kind === "all" ? all : all.filter(x => x.kind === kind);
    for (const x of src) cc[x.collection] = (cc[x.collection] || 0) + 1;
    return cc;
  }, [all, kind]);

  const queryTerms = query.trim() ? query.trim().toLowerCase().split(/\s+/) : [];
  const showGrouped = !collection && !query.trim();

  if (!catalog) return <div className="loading">Loading\u2026</div>;

  const stats = {
    agents: catalog.agents.length,
    prompts: catalog.prompts.length,
    collections: Object.keys(COLLECTION_META).filter(k => (catalog.agents.concat(catalog.prompts)).some(x => x.collection === k)).length,
  };

  return (
    <div className="shell">
      <Header
        query={query} setQuery={setQuery}
        stats={stats}
      />
      <div className="body">
        {!query.trim() && (
          <ExamplePrompts onPick={q => { setQuery(q); }} />
        )}

        <Filters
          kind={kind} setKind={setKind}
          collection={collection} setCollection={setCollection}
          counts={counts}
          collectionCounts={collectionCounts}
        />
        {query.trim() && (
          <div className="result-summary">
            {filtered.length > 0
              ? <span><b>{filtered.length}</b> match{filtered.length !== 1 ? "es" : ""} for &ldquo;{query}&rdquo;</span>
              : <span>No matches for &ldquo;{query}&rdquo; &mdash; try another term.</span>}
          </div>
        )}

        {showGrouped
          ? <GroupedView groups={groups} onOpen={setOpen} queryTerms={queryTerms} />
          : <FlatView items={filtered} onOpen={setOpen} queryTerms={queryTerms} />}
      </div>

      <Drawer item={open} onClose={() => setOpen(null)} onJumpTo={setOpen} allItems={all} />

      <footer className="ft">
        <div>Directory generated from <code>microsoft/hve-core</code> &middot; {catalog.agents.length + catalog.prompts.length} artifacts</div>
        <div className="ft-made">Made by <b>Amie Dansby</b></div>
      </footer>
    </div>
  );
}

export default App;
