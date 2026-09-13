/* ============================================================================
 * KoinX for Professionals — Dashboard
 *
 * Built in the playground from XUI, to prove the system composes a real screen.
 * Every measurement here came from the Figma file's own properties (bound
 * variables, auto-layout gaps), not from a screenshot:
 *
 *   banner      1168x40, gap 10, pad 8/10, radius 8,
 *               surface-warning-tertiary + border-warning, body-1
 *   tabs        1168x38, underline variant, 10px above the filter row
 *   filter row  1168x44, search 148 then five selects, 8px gaps,
 *               Clear Filters right-aligned
 *   table       header 52 + rows 52
 *   action bar  611x66, pad 11/28, radius 6, surface-raised + border-brand,
 *               inner gap 26, buttons gap 14
 *   column      20px between header and content, 16px between sections
 * ========================================================================== */

import { useState } from 'react';
import {
  AppShell, AppShellMain,
  Sidebar, SidebarHeader, SidebarNav, SidebarFooter, SidebarItem,
  Button, Badge, Input, Select, Tabs, Checkbox, Pagination,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell, PriorityMeter,
  KoinXProfessionalsWordmark, KoinXMark,
  OverviewIcon, UserGroupIcon, TaxesIcon, BubbleIcon, CallIcon, RulesIcon,
  WarningAlertIcon, AddUserIcon, ActionsIcon, CloseIcon,
} from '@koinx/xui';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: OverviewIcon },
  { id: 'team', label: 'Team', icon: UserGroupIcon },
  { id: 'requests', label: 'Client Requests', icon: AddUserIcon },
  { id: 'licenses', label: 'Licenses', icon: TaxesIcon },
  { id: 'chats', label: 'Chats', icon: BubbleIcon },
  { id: 'calls', label: 'Call Logs', icon: CallIcon },
] as const;

type Row = {
  id: string; client: string; plan: string; priority: number;
  filing: 'Derivatives' | 'Only Spot'; assignee: string; on: string;
  coverage: 'License' | 'Own Plan' | 'No License' | 'Upgrade Required';
};

const ROWS: Row[] = [
  { id: '1', client: 'Rony Joseph', plan: 'Comprehensive ITR Filing', priority: 3, filing: 'Derivatives', assignee: 'Arjun Mehta', on: '30 Jul 2026', coverage: 'License' },
  { id: '2', client: 'Laura Fitzgerald', plan: 'Crypto ITR Filing', priority: 1, filing: 'Only Spot', assignee: 'Rahul Verma', on: '30 Jul 2026', coverage: 'Own Plan' },
  { id: '3', client: 'Marcus Johnson', plan: 'Salary ITR Filing', priority: 3, filing: 'Only Spot', assignee: 'James Smith', on: '30 Jul 2026', coverage: 'Own Plan' },
  { id: '4', client: 'James Chen', plan: 'Salary ITR Filing', priority: 1, filing: 'Only Spot', assignee: 'James Smith', on: '30 Jul 2026', coverage: 'No License' },
  { id: '5', client: 'Natalie Brooks', plan: 'Crypto ITR Filing', priority: 2, filing: 'Derivatives', assignee: 'Arjun Mehta', on: '30 Jul 2026', coverage: 'Upgrade Required' },
  { id: '6', client: 'Sarah Mitchell', plan: 'Comprehensive ITR Filing', priority: 1, filing: 'Only Spot', assignee: 'James Smith', on: '30 Jul 2026', coverage: 'License' },
];

const COVERAGE: Record<Row['coverage'], 'label-positive' | 'label-info' | 'label-neutral' | 'label-negative'> = {
  License: 'label-positive',
  'Own Plan': 'label-info',
  'No License': 'label-neutral',
  'Upgrade Required': 'label-negative',
};

const opts = (...v: string[]) => v.map((x) => ({ value: x.toLowerCase(), label: x }));

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<string>('dashboard');
  const [tab, setTab] = useState('filings');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const allChecked = selected.length === ROWS.length;
  const toggleAll = () => setSelected(allChecked ? [] : ROWS.map((r) => r.id));
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <AppShell style={{ height: '100vh' }}>
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)}>
        <SidebarHeader>{collapsed ? <KoinXMark /> : <KoinXProfessionalsWordmark />}</SidebarHeader>

        {!collapsed && (
          <div style={{ padding: '0 var(--spacing-12) var(--spacing-8)' }}>
            <Button fullWidth iconLeft={<AddUserIcon />}>
              Add Client
            </Button>
          </div>
        )}

        <SidebarNav>
          {NAV.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              selected={active === item.id}
              onClick={() => setActive(item.id)}
            />
          ))}
        </SidebarNav>

        <SidebarFooter>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-body-3)', color: 'var(--content-tertiary)', whiteSpace: 'nowrap' }}>
            <RulesIcon size={16} variant="dualtone" />
            {!collapsed && <>Available for calls</>}
          </span>
        </SidebarFooter>
      </Sidebar>

      {/* 20px between the page header and the content below it (Figma). */}
      <AppShellMain style={{ gap: 'var(--spacing-20)', position: 'relative' }}>
        {/* ---- page header: not a component — a title, a select, actions ---- */}
        {/* The year select is not a filter — it hugs. It carries no width
            because Figma's 147 clipped it by 3px: the selected value renders
            in subtitle-2 (500 weight), wider than the body-2 placeholder the
            mock was measured against. */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-16)',
            flex: 'none',
          }}
        >
          <h1 style={{ margin: 0, font: 'var(--type-heading-2)', color: 'var(--content-primary)' }}>
            Dashboard
          </h1>
          <Select options={opts('FY 2025-2026', 'FY 2024-2025')} defaultValue="fy 2025-2026" />
        </header>

        {/* ---- sections stack 16px apart ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', minHeight: 0 }}>
          {/* Banner. Every value read from the node's bound variables. */}
          <div
            role="status"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 9px', borderRadius: 'var(--radius-mid)',
              background: 'var(--surface-warning-tertiary)',
              border: 'var(--border-width-regular) solid var(--border-warning)',
              font: 'var(--type-body-1)', color: 'var(--content-primary)',
              flex: 'none',
            }}
          >
            <WarningAlertIcon size={20} style={{ color: 'var(--content-warning-primary)', flex: 'none' }} />
            You have only 2 available licenses remaining. Contact your admin to get more.
          </div>

          {/* Tabs sit 10px above the filter row. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 'none' }}>
            <Tabs
              variant="underline"
              items={[
                { value: 'filings', label: 'KoinX Filings' },
                { value: 'clients', label: 'Clients' },
              ]}
              value={tab}
              onChange={setTab}
            />

            {/* Every field fills the row in an equal share; only the trailing
                action hugs. That is the product's pattern (see
                app.koinx.com/transactions), and it is why the controls carry
                no width here: each Select's 255px is a flex BASIS, so six of
                them in a 1168px row shrink to equal widths on their own.
                Figma's measured widths are not used — they were 1-3px short
                of their own placeholders and clipped every label. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
              <div style={{ flex: '1 1 255px', minWidth: 0 }}>
                {/* GAP: Icons v2 has no magnifier. The Figma frame uses `Icons/search`
                    from the older set, which ADR 0010 ruled out. Left bare rather than
                    substituting a wrong glyph. */}
                <Input placeholder="Search..." size="small" />
              </div>
              <Select options={opts('Pending', 'Filed')} placeholder="Status" />
              <Select options={opts('Arjun Mehta', 'James Smith')} placeholder="Professional" />
              <Select options={opts('Basic', 'Pro')} placeholder="Plan" />
              <Select options={opts('High', 'Low')} placeholder="Priority" />
              <Select options={opts('Derivatives', 'Only Spot')} placeholder="Filing Type" />
              <Button variant="link" style={{ flex: 'none' }} iconLeft={<CloseIcon />}>
                Clear Filters
              </Button>
            </div>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell width={40}>
                  <Checkbox checked={allChecked} onChange={toggleAll} aria-label="Select all" />
                </TableHeaderCell>
                <TableHeaderCell width={134} fill>Client Name</TableHeaderCell>
                <TableHeaderCell width={200} fill>Plan</TableHeaderCell>
                <TableHeaderCell width={90} fill>Status</TableHeaderCell>
                <TableHeaderCell width={80}>Priority</TableHeaderCell>
                <TableHeaderCell width={133} fill>Filing Type</TableHeaderCell>
                <TableHeaderCell width={133} fill>Assigned To</TableHeaderCell>
                <TableHeaderCell width={133} fill>Assigned On</TableHeaderCell>
                <TableHeaderCell width={133} fill>Coverage</TableHeaderCell>
                <TableHeaderCell width={60} />
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.id} selected={selected.includes(r.id)}>
                  <TableCell width={40}>
                    <Checkbox
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Select ${r.client}`}
                    />
                  </TableCell>
                  <TableCell width={134} fill>{r.client}</TableCell>
                  <TableCell width={200} fill>{r.plan}</TableCell>
                  <TableCell width={90} fill><Badge variant="label-info">Pending</Badge></TableCell>
                  <TableCell width={80}><PriorityMeter level={r.priority as 1 | 2 | 3} /></TableCell>
                  <TableCell width={133} fill>
                    <Badge variant={r.filing === 'Derivatives' ? 'label-accent' : 'label-warning'}>{r.filing}</Badge>
                  </TableCell>
                  <TableCell width={133} fill>{r.assignee}</TableCell>
                  <TableCell width={133} fill>{r.on}</TableCell>
                  <TableCell width={133} fill><Badge variant={COVERAGE[r.coverage]}>{r.coverage}</Badge></TableCell>
                  <TableCell width={60}>
                    <span style={{ display: 'inline-flex', gap: 'var(--spacing-8)', color: 'var(--content-tertiary)' }}>
                      <AddUserIcon size={18} />
                      <ActionsIcon size={18} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div style={{ display: 'flex', justifyContent: 'center', flex: 'none' }}>
            <Pagination page={page} pageCount={5} onPageChange={setPage} />
          </div>
        </div>

        {/* Selected-rows action bar. Figma: 611x66, pad 11/28, radius 6,
            surface-raised on border-brand, inner gap 26, buttons gap 14. */}
        {selected.length > 0 && (
          <div
            style={{
              position: 'absolute', bottom: 'var(--spacing-24)', left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 26,
              padding: '11px 28px', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-raised)',
              border: 'var(--border-width-regular) solid var(--border-brand)',
              boxShadow: 'var(--elevation-md)', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-8)', font: 'var(--type-heading-5)', color: 'var(--content-primary)' }}>
              {selected.length} Client{selected.length > 1 ? 's' : ''} Selected
              <button
                type="button"
                onClick={() => setSelected([])}
                aria-label="Clear selection"
                style={{ display: 'inline-flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: 'var(--content-error-primary)' }}
              >
                <CloseIcon size={20} />
              </button>
            </span>
            <span style={{ display: 'inline-flex', gap: 14 }}>
              <Button variant="outline">Assign CA</Button>
              <Button>Change Status</Button>
            </span>
          </div>
        )}
      </AppShellMain>
    </AppShell>
  );
}
