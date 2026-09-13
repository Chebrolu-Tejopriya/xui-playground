import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  DayIcon,
  NightIcon,
  AppShell,
  AppShellMain,
  // Aliased: the gallery's own nav below is also called Sidebar.
  Sidebar as XuiSidebar,
  SidebarHeader,
  SidebarNav,
  SidebarItem,
  KoinXWordmark,
  KoinXMark,
} from '@koinx/xui';
import { demos, owners, countsByPlatform } from './demos/registry';
import type { Demo } from './demos/registry';

/**
 * The Playground: every prototype in this repo, in one place.
 *
 * Built out of XUI, because a prototyping surface that does not use the design
 * system is the first place drift starts. The only raw values here are layout
 * arithmetic — grid columns, a thumbnail scale — which have no tokens by design.
 *
 * A demo renders in an <iframe> at its own URL rather than inline. Three
 * reasons, and the third is the one that matters:
 *   - a mobile demo gets a real 390px viewport instead of a CSS-scaled lie
 *   - a demo cannot leak global styles into the Playground or its neighbours
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

/* ---- theme ---------------------------------------------------------------- */

/**
 * XUI keys off `[data-theme]` on the root, with bare `:root` giving light — so
 * switching is one attribute.
 *
 * A demo renders in its own <iframe>, which is a separate document and does not
 * inherit that attribute. The theme therefore rides along in the URL, and the
 * frame applies it on mount. Without that, thumbnails stay light on a dark page.
 */
type Theme = 'light' | 'dark';

const KEY = 'xui-playground-theme';

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    if (fromUrl === 'dark' || fromUrl === 'light') return fromUrl;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Private windows and blocked site data throw on access rather than
      // returning null. The default is fine; do not take the page down for it.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // Same as above - a preference that cannot be saved is not an error.
    }
  }, [theme]);

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

/* ---- the demo route ------------------------------------------------------- */

function DemoView({ demo }: { demo: Demo }) {
  const Component = useMemo(() => lazy(demo.load), [demo]);
  return (
    <Suspense fallback={<Centered>Loading {demo.title}…</Centered>}>
      <Component />
    </Suspense>
  );
}

/**
 * A mobile demo, shown at a phone's width instead of stretched across a desktop.
 *
 * This has to be an <iframe> and not a 390px-wide <div>. Drawer, Dialog and
 * Toast all render through createPortal into document.body, so they escape any
 * container in the React tree — opening this demo full-screen gave a bottom
 * sheet spanning 1900px, which is the opposite of what it is for. A frame is a
 * real viewport, so a portal has nowhere else to go.
 *
 * The inner document loads with `raw=1` so it renders the demo bare rather than
 * framing it again, forever.
 */
function PhoneFrame({ demo, theme }: { demo: Demo; theme: Theme }) {
  const W = 390;
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-16)',
        padding: 'var(--spacing-24)',
        background: 'var(--surface-secondary)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-12)',
          width: '100%',
          maxWidth: 720,
        }}
      >
        <a href="?" style={{ color: 'var(--content-secondary)', textDecoration: 'none' }}>
          ← All demos
        </a>
        <span style={{ font: 'var(--type-subtitle-2)', color: 'var(--content-primary)' }}>
          {demo.title}
        </span>
        <span style={{ font: 'var(--type-body-3)', color: 'var(--content-tertiary)' }}>
          {W}px
        </span>
      </div>

      <div
        style={{
          width: W,
          /* Fill the window but never exceed a phone's proportions on a tall
             screen; the demo scrolls inside, as it would on a device. */
          height: `min(844px, calc(100vh - 120px))`,
          flex: 'none',
          overflow: 'hidden',
          borderRadius: 28,
          border: '1px solid var(--border-secondary)',
          background: 'var(--surface-primary)',
          boxShadow: 'var(--shadow-lg, 0 12px 32px rgb(0 0 0 / 0.18))',
        }}
      >
        <iframe
          src={`?demo=${demo.id}&theme=${theme}&raw=1`}
          title={demo.title}
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        />
      </div>
    </div>
  );
}

/**
 * A web demo shown inside KoinX, instead of floating on an empty page.
 *
 * Opt-in through `nav` in meta.ts. A screen rendered alone reads as a mockup;
 * the same screen with the product's sidebar round it, and its own nav item
 * selected, reads as a place in KoinX — which is the question a prototype is
 * usually trying to answer. Same idea as Intercom's design playground.
 *
 * Built only from XUI's own AppShell and Sidebar, so it is the real shell and
 * not a drawing of one. It deliberately has no section heading: XUI's Sidebar
 * has no such component, and inventing one here would be the Playground
 * designing the system instead of using it.
 *
 * Not an iframe, unlike PhoneFrame. There is no portal to contain — a sidebar
 * does not escape its parent — so thumbnails render it too, and the card in
 * the gallery shows the screen in the product rather than without it.
 */
function ProductFrame({ demo }: { demo: Demo }) {
  const [collapsed, setCollapsed] = useState(false);
  const nav = demo.nav!;
  return (
    <AppShell style={{ height: '100vh' }}>
      <XuiSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)}>
        <SidebarHeader>{collapsed ? <KoinXMark /> : <KoinXWordmark />}</SidebarHeader>
        <SidebarNav>
          <SidebarItem icon={nav.icon} label={nav.item} selected />
        </SidebarNav>
      </XuiSidebar>
      <AppShellMain>
        <DemoView demo={demo} />
      </AppShellMain>
    </AppShell>
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

function Thumbnail({ demo, theme }: { demo: Demo; theme: Theme }) {
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
        src={`?demo=${demo.id}&theme=${theme}&raw=1`}
        title={demo.title}
        loading="lazy"
        tabIndex={-1}
        style={{
          // flex: none, or the flex parent shrinks a 1440 iframe to the ~370px
          // card - under XUI's 900px breakpoint - and every web thumbnail
          // silently showed the MOBILE layout: no sidebar, one narrow column.
          flex: 'none',
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

function Card({ demo, theme }: { demo: Demo; theme: Theme }) {
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
      <Thumbnail demo={demo} theme={theme} />
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
            {/* Say it on the card, not only in the docs. Someone who cannot
                remember whether a demo is shared will assume the wrong one,
                and both wrong assumptions are bad. */}
            {demo.isPrivate && (
              <span
                style={{
                  font: 'var(--type-body-3)',
                  padding: '2px var(--spacing-8)',
                  borderRadius: 999,
                  background: 'var(--surface-secondary)',
                  color: 'var(--content-secondary)',
                }}
                title="Private — gitignored, never published"
              >
                Local only
              </span>
            )}
            <span
              style={{
                font: 'var(--type-body-3)',
                letterSpacing: '0.04em',
                color: 'var(--content-tertiary)',
              }}
            >
              {demo.platform.toUpperCase()}
            </span>
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

function Gallery({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
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
      <Sidebar isGallery />
      <main style={{ flex: 1, minWidth: 0, padding: 'var(--spacing-32)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ font: 'var(--type-heading-3)', margin: 0 }}>
            {demos.length} {demos.length === 1 ? 'demo' : 'demos'}
          </h1>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-width-regular) solid var(--border-primary)',
              background: 'var(--surface-raised)',
              color: 'var(--content-secondary)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <DayIcon size={18} /> : <NightIcon size={18} />}
          </button>
        </div>

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
              <Card key={d.id} demo={d} theme={theme} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Sidebar({ isGallery }: { isGallery: boolean }) {
  return (
    <nav
      style={{
        width: 220,
        flex: 'none',
        padding: 'var(--spacing-32) var(--spacing-16)',
        borderRight: 'var(--border-width-regular) solid var(--border-secondary)',
        background: 'var(--surface-raised)',
      }}
    >
      {/* 36px matches the theme button, which is what sets the height of the
          main column's header row - so the wordmark and the "N demos" heading
          sit on the same line instead of eight pixels apart. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 36,
          padding: '0 var(--spacing-12)',
          font: 'var(--type-subtitle-1)',
          color: 'var(--content-primary)',
          marginBottom: 'var(--spacing-24)',
        }}
      >
        Playground
      </div>
      <a href="?" aria-current={isGallery ? 'page' : undefined} style={isGallery ? linkActive : linkStyle}>
        All demos
      </a>
      {/* Linked, not rebuilt. The design system already has a far better home
          than anything that would be reimplemented here. */}
      <a href="https://xui-five.vercel.app" target="_blank" rel="noreferrer" style={linkStyle}>
        XUI design system ↗
      </a>
    </nav>
  );
}

const linkStyle = {
  display: 'block',
  padding: 'var(--spacing-8) var(--spacing-12)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--content-secondary)',
  textDecoration: 'none',
  font: 'var(--type-body-2)',
} as const;

/* Selected carries weight AND background, not colour alone - a nav that marks
   the current page with hue only disappears for anyone who cannot separate the
   two. Same reason SidebarItem in XUI pairs its tone change with a fill. */
const linkActive = {
  ...linkStyle,
  color: 'var(--content-brand-primary)',
  background: 'var(--surface-brand-secondary)',
  font: 'var(--type-subtitle-2)',
} as const;

/* ---- entry ---------------------------------------------------------------- */

export default function Playground() {
  // Applies `data-theme` on mount, reading ?theme= first — which is how a demo
  // rendered inside a thumbnail iframe inherits the gallery's theme.
  const [theme, toggleTheme] = useTheme();
  const id = new URLSearchParams(window.location.search).get('demo');
  if (!id) return <Gallery theme={theme} toggleTheme={toggleTheme} />;

  const demo = demos.find((d) => d.id === id);
  if (!demo) {
    return (
      <Centered>
        No demo called “{id}”. <a href="?" style={{ marginLeft: 6 }}>Back to all demos</a>
      </Centered>
    );
  }
  // `raw=1` is the inside of a frame, or a thumbnail. Anything else that is
  // mobile gets shown at a phone's width rather than stretched to the window.
  const raw = new URLSearchParams(window.location.search).get('raw') === '1';
  if (demo.platform === 'mobile' && !raw) return <PhoneFrame demo={demo} theme={theme} />;
  // Not gated on `raw`: that flag only exists to stop phone frames nesting
  // inside iframes forever, and the product frame is not an iframe. So the
  // gallery thumbnail shows the product frame too.
  if (demo.platform === 'web' && demo.nav) return <ProductFrame demo={demo} />;
  return <DemoView demo={demo} />;
}
