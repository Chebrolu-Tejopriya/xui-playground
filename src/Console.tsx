import { Suspense, lazy, useMemo, useState } from 'react';
import { demos, owners, countsByPlatform } from './demos/registry';
import type { Demo } from './demos/registry';

/**
 * The console: every prototype in this repo, in one place.
 *
 * Built out of XUI, because a prototyping surface that does not use the design
 * system is the first place drift starts. The only raw values here are layout
 * arithmetic — grid columns, a thumbnail scale — which have no tokens by design.
 *
 * A demo renders in an <iframe> at its own URL rather than inline. Three
 * reasons, and the third is the one that matters:
 *   - a mobile demo gets a real 390px viewport instead of a CSS-scaled lie
 *   - a demo cannot leak global styles into the console or its neighbours
 *   - a demo that throws takes down its own frame, not the whole gallery
 */

const PLATFORMS = [
  { key: 'all', label: 'ALL' },
  { key: 'mobile', label: 'MOBILE' },
  { key: 'web', label: 'WEB' },
] as const;

type Platform = (typeof PLATFORMS)[number]['key'];

/* The frame a demo is photographed and opened in. Mobile gets a phone's width
   so a 390-wide layout is not stretched across a desktop card. */
const FRAME = { mobile: { w: 390, h: 844 }, web: { w: 1440, h: 900 } } as const;

const shell = {
  display: 'flex',
  minHeight: '100vh',
  background: 'var(--surface-primary)',
  color: 'var(--content-primary)',
  font: 'var(--type-body-2)',
} as const;

/* ---- the demo route ------------------------------------------------------- */

function DemoView({ demo }: { demo: Demo }) {
  const Component = useMemo(() => lazy(demo.load), [demo]);
  return (
    <Suspense fallback={<Centered>Loading {demo.title}…</Centered>}>
      <Component />
    </Suspense>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--content-tertiary)',
        font: 'var(--type-body-2)',
      }}
    >
      {children}
    </div>
  );
}

/* ---- cards ---------------------------------------------------------------- */

function Thumbnail({ demo }: { demo: Demo }) {
  const frame = FRAME[demo.platform];
  // Scale the real render down rather than storing a screenshot: a screenshot
  // is stale the moment the demo changes, and nobody re-takes it.
  const scale = demo.platform === 'mobile' ? 0.34 : 0.2;
  return (
    <div
      style={{
        height: 200,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'var(--surface-secondary)',
        borderBottom: 'var(--border-width-regular) solid var(--border-secondary)',
      }}
    >
      <iframe
        src={`?demo=${demo.id}`}
        title={demo.title}
        loading="lazy"
        tabIndex={-1}
        style={{
          width: frame.w,
          height: frame.h,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function Card({ demo }: { demo: Demo }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={`?demo=${demo.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 'var(--radius-mid)',
        overflow: 'hidden',
        border: `var(--border-width-regular) solid ${
          hover ? 'var(--border-brand)' : 'var(--border-secondary)'
        }`,
        background: 'var(--surface-raised)',
        transition: 'border-color 120ms ease',
      }}
    >
      <Thumbnail demo={demo} />
      <div style={{ padding: 'var(--spacing-12) var(--spacing-16) var(--spacing-16)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-8)' }}>
          <span style={{ font: 'var(--type-subtitle-2)', color: 'var(--content-primary)' }}>
            {demo.title}
          </span>
          {demo.updated && (
            <span style={{ font: 'var(--type-body-3)', color: 'var(--content-tertiary)' }}>
              {demo.updated}
            </span>
          )}
        </div>
        {demo.note && (
          <p
            style={{
              margin: 'var(--spacing-4) 0 0',
              font: 'var(--type-body-3)',
              color: 'var(--content-secondary)',
            }}
          >
            {demo.note}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'var(--spacing-12)',
          }}
        >
          <Owner name={demo.owner} />
          <span
            style={{
              font: 'var(--type-body-3)',
              letterSpacing: '0.04em',
              color: 'var(--content-tertiary)',
            }}
          >
            {demo.platform.toUpperCase()}
          </span>
        </div>
      </div>
    </a>
  );
}

function Owner({ name }: { name: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--surface-brand-secondary)',
          color: 'var(--content-brand-primary)',
          font: 'var(--type-body-3)',
          textTransform: 'uppercase',
        }}
      >
        {name[0]}
      </span>
      <span style={{ font: 'var(--type-body-3)', color: 'var(--content-secondary)' }}>{name}</span>
    </span>
  );
}

/* ---- the gallery ---------------------------------------------------------- */

const control = {
  height: 36,
  padding: '0 var(--spacing-12)',
  borderRadius: 'var(--radius-sm)',
  border: 'var(--border-width-regular) solid var(--border-primary)',
  background: 'var(--surface-raised)',
  color: 'var(--content-primary)',
  font: 'var(--type-body-2)',
  cursor: 'pointer',
} as const;

function Gallery() {
  const [platform, setPlatform] = useState<Platform>('all');
  const [owner, setOwner] = useState('all');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demos.filter(
      (d) =>
        (platform === 'all' || d.platform === platform) &&
        (owner === 'all' || d.owner === owner) &&
        (!q ||
          d.title.toLowerCase().includes(q) ||
          (d.note ?? '').toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q)),
    );
  }, [platform, owner, query]);

  return (
    <div style={shell}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: 'var(--spacing-32)' }}>
        <h1 style={{ font: 'var(--type-heading-3)', margin: 0 }}>
          {demos.length} {demos.length === 1 ? 'demo' : 'demos'}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-12)',
            alignItems: 'center',
            flexWrap: 'wrap',
            margin: 'var(--spacing-24) 0',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPlatform(p.key)}
                style={{
                  ...control,
                  borderRadius: 999,
                  borderColor: platform === p.key ? 'var(--border-brand)' : 'var(--border-primary)',
                  background:
                    platform === p.key ? 'var(--surface-brand-secondary)' : 'var(--surface-raised)',
                }}
              >
                {p.label}{' '}
                <span style={{ color: 'var(--content-tertiary)' }}>{countsByPlatform[p.key]}</span>
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search demos…"
            style={{ ...control, cursor: 'text', flex: '1 1 200px', maxWidth: 280 }}
          />

          {owners.length > 1 && (
            <select value={owner} onChange={(e) => setOwner(e.target.value)} style={control}>
              <option value="all">All designers</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </div>

        {shown.length === 0 ? (
          <p style={{ color: 'var(--content-tertiary)' }}>Nothing matches.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--spacing-16)',
            }}
          >
            {shown.map((d) => (
              <Card key={d.id} demo={d} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <nav
      style={{
        width: 220,
        flex: 'none',
        padding: 'var(--spacing-24) var(--spacing-16)',
        borderRight: 'var(--border-width-regular) solid var(--border-secondary)',
        background: 'var(--surface-raised)',
      }}
    >
      <div style={{ font: 'var(--type-subtitle-1)', marginBottom: 'var(--spacing-4)' }}>
        Console
      </div>
      <div
        style={{
          font: 'var(--type-body-3)',
          color: 'var(--content-tertiary)',
          marginBottom: 'var(--spacing-24)',
        }}
      >
        xuiground.vercel.app
      </div>
      <a href="?" style={linkStyle}>
        All demos
      </a>
      {/* Linked, not rebuilt. The design system already has a far better home
          than anything that would be reimplemented here. */}
      <a href="https://xui.koinx.com" target="_blank" rel="noreferrer" style={linkStyle}>
        XUI design system ↗
      </a>
      <div
        style={{
          marginTop: 'var(--spacing-24)',
          font: 'var(--type-body-3)',
          color: 'var(--content-tertiary)',
          lineHeight: 1.5,
        }}
      >
        Prototypes built with XUI. Add one by creating
        <code style={{ display: 'block', marginTop: 4 }}>src/demos/&lt;you&gt;/&lt;name&gt;/</code>
      </div>
    </nav>
  );
}

const linkStyle = {
  display: 'block',
  padding: 'var(--spacing-8) var(--spacing-12)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--content-primary)',
  textDecoration: 'none',
  font: 'var(--type-body-2)',
} as const;

/* ---- entry ---------------------------------------------------------------- */

export default function Console() {
  const id = new URLSearchParams(window.location.search).get('demo');
  if (!id) return <Gallery />;

  const demo = demos.find((d) => d.id === id);
  if (!demo) {
    return (
      <Centered>
        No demo called “{id}”. <a href="?" style={{ marginLeft: 6 }}>Back to all demos</a>
      </Centered>
    );
  }
  return <DemoView demo={demo} />;
}
