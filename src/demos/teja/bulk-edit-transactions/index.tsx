/* ============================================================================
 * KoinX — Transactions › Bulk edit transactions (web, 1440)
 *
 * Built in the playground from XUI, to solve a real requirement with the system
 * rather than to demo it. The brief: a CA filters transactions that need fixing
 * (cost basis missing, say), exports them as CSV, edits offline, and uploads the
 * corrections back.
 *
 * THE PROBLEM IN THE BRIEF, AND WHAT IS DIFFERENT HERE
 *
 * The flow as described has a round trip the brief calls out and then accepts:
 * open the dialog, close it to select and download, reopen it to upload. Two
 * changes remove it, and neither costs anything:
 *
 *   1. Download and upload are two STEPS OF ONE DIALOG, not two visits. The
 *      dialog already knows what the filters matched, so there is nothing to go
 *      back for. Closing it was only ever needed because selection lived outside.
 *   2. The toast after a download is the way BACK IN. The brief proposes a toast
 *      that tells you the upload exists; making it a link to the upload step is
 *      the same toast doing useful work. That is the whole round trip, removed.
 *
 * A third thing worth flagging to a designer: the dialog states the filters it
 * is about to export, as chips. A CA about to bulk-edit 23 rows should be able
 * to see WHICH 23 without trusting their memory of a filter bar behind a scrim.
 *
 * WHAT XUI DID NOT HAVE
 *
 *   - A menu component was flagged here as missing. THAT WAS WRONG, and teja
 *     caught it. Select is already the whole menu surface — rows with a left
 *     icon, a rightIcon, a subLabel, groups, search — and it drives an action
 *     menu directly: `value={null}` keeps it controlled at nothing so the
 *     trigger never adopts the choice, and `check={false}` drops the tick and
 *     the 32px inset it reserves. 85 lines of local component deleted.
 *
 *     Two much smaller gaps are real, though:
 *       a) the trigger cannot be a Button. Figma has that; XUI does not. It is
 *          `triggerButtonVariant`, already on the not-built list. So the
 *          "Actions" control here is a field where the reference is a filled
 *          button.
 *       b) the panel was pinned to the trigger width, so a short trigger label
 *          with long rows truncated — "Bulk edit transa…". FIXED: Select gained
 *          `menuWidth="content"`, which Menu.module.css had supported all along
 *          and Select's own `.panel` never used. The trigger stays its own size.
 *
 *     Two other things flagged here were ALSO wrong, and Figma said so:
 *       - UploadedFile being `{ name }` only. Every uploaded row in the file
 *         shows the filename and nothing else — no size, no progress. Correct
 *         as built.
 *       - Toast having no viewport. That is ADR 0007 working as intended:
 *         composable primitives over configured components. A Toast is a card
 *         and the screen places it; a provider that owns position and a queue
 *         is the configured-component shape that ADR argues against.
 *   - Select had no `size`. FIXED. This screen asked for it, did not compile,
 *     and that became scripts/check-variant-axes.mjs — a gate for completeness
 *     rather than fidelity. Select and Tabs now carry Figma's Size axis, so the
 *     filter bar below is the 36px Medium the reference actually draws.
 *   - UploadedFile is `{ name }` only: no size, no progress, no error, so an
 *     upload list cannot say how big a file is or that it failed.
 *   - Toast has no viewport. It is a card with no opinion about where it sits,
 *     so the screen positions it. Fine for one toast; a queue would need a
 *     provider.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import {
  AppShell,
  AppShellMain,
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarFooter,
  SidebarItem,
  Button,
  Badge,
  Select,
  Checkbox,
  Dialog,
  Toast,
  FileUpload,
  Tabs,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  KoinXLogo,
  KoinXMark,
  OverviewIcon,
  PortfolioIcon,
  TransactionsIcon,
  AddWalletIcon,
  TaxesIcon,
  ReportsIcon,
  GuideListIcon,
  ActionsIcon,
  ChevronDownIcon,
  FileDownloadIcon,
  UploadFileIcon,
  EditIcon,
  AddPlusIcon,
  WarningAlertIcon,
  SwapIcon,
} from '@koinx/xui';

/* ---- data ---------------------------------------------------------------- */

type Txn = {
  id: string;
  time: string;
  from: string;
  to: string;
  fromAmt: string;
  toAmt: string;
  venue: string;
  issue: 'cost-basis' | 'missing-prior' | null;
  gain: string | null;
};

const TXNS: Txn[] = [
  { id: 't1', time: '3:54:28 PM', from: 'ETH', to: 'BTC', fromAmt: '−11.78 ETH', toAmt: '+0.5 BTC', venue: 'Binance', issue: null, gain: '+₹43,613.45' },
  { id: 't2', time: '3:54:28 PM', from: 'MATIC', to: 'USDT', fromAmt: '−2,500 MATIC', toAmt: '+6,875 USDT', venue: 'Binance', issue: null, gain: '+₹5,14,273.45' },
  { id: 't3', time: '3:54:28 PM', from: 'ETH', to: 'BTC', fromAmt: '−11.78 ETH', toAmt: '+0.778 BTC', venue: 'Binance', issue: 'cost-basis', gain: null },
  { id: 't4', time: '3:54:28 PM', from: 'USDT', to: 'USDT', fromAmt: '−19.98 USDT', toAmt: '+19.98 USDT', venue: 'KuCoin → Bitbns', issue: 'missing-prior', gain: null },
  { id: 't5', time: '3:54:28 PM', from: 'MATIC', to: 'USDT', fromAmt: '−2,500 MATIC', toAmt: '+6,875 USDT', venue: 'Binance', issue: 'cost-basis', gain: null },
  { id: 't6', time: '3:51:02 PM', from: 'SOL', to: 'USDT', fromAmt: '−140 SOL', toAmt: '+21,400 USDT', venue: 'CoinDCX', issue: 'cost-basis', gain: null },
];

const NAV = [
  { id: 'overview', label: 'Overview', icon: OverviewIcon },
  { id: 'portfolio', label: 'Portfolio', icon: PortfolioIcon },
  { id: 'transactions', label: 'Transactions', icon: TransactionsIcon },
  { id: 'integrations', label: 'Integrations', icon: AddWalletIcon },
  { id: 'taxes', label: 'Taxes', icon: TaxesIcon },
  { id: 'reports', label: 'Tax Reports', icon: ReportsIcon },
] as const;

const opts = (...v: string[]) => v.map((x) => ({ value: x.toLowerCase().replace(/\s+/g, '-'), label: x }));

const ISSUE_LABEL: Record<string, string> = {
  'cost-basis': 'Cost basis missing',
  'missing-prior': 'Prior transaction missing',
};

/* ---- the flow ------------------------------------------------------------ */

type Step = 'download' | 'upload';

export default function BulkEditTransactions() {
  const [active, setActive] = useState('transactions');
  const [issueFilter, setIssueFilter] = useState('cost-basis');
  const [venueFilter, setVenueFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<Step | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [toast, setToast] = useState<number | null>(null);
  const [applied, setApplied] = useState<number | null>(null);

  const ACTIONS: Record<string, () => void> = {
    download: () => setDialog('download'),
    bulk: () => setDialog('download'),
    add: () => undefined,
    accounts: () => undefined,
  };

  const rows = useMemo(
    () =>
      TXNS.filter((t) => (issueFilter === 'all' ? true : t.issue === issueFilter)).filter((t) =>
        venueFilter === 'all' ? true : t.venue.toLowerCase().includes(venueFilter),
      ),
    [issueFilter, venueFilter],
  );

  // What the export covers: an explicit selection if there is one, else the
  // whole filtered set. Stating that in the dialog is the point — a CA should
  // not have to remember which.
  const exportIds = selected.length ? selected.filter((id) => rows.some((r) => r.id === id)) : rows.map((r) => r.id);
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const chips = [
    issueFilter !== 'all' && ISSUE_LABEL[issueFilter],
    venueFilter !== 'all' && venueFilter.charAt(0).toUpperCase() + venueFilter.slice(1),
    selected.length ? `${selected.length} selected` : null,
  ].filter(Boolean) as string[];

  const download = () => {
    const header = 'id,time,from,to,amount_in,amount_out,venue,issue\n';
    const body = TXNS.filter((t) => exportIds.includes(t.id))
      .map((t) => [t.id, t.time, t.from, t.to, t.fromAmt, t.toAmt, t.venue, t.issue ?? ''].join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'koinx-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);

    setDialog(null);
    setToast(exportIds.length);
  };

  return (
    <AppShell style={{ height: '100vh' }}>
      <Sidebar>
        <SidebarHeader>
          <KoinXLogo />
        </SidebarHeader>
        <SidebarNav>
          {NAV.map((n) => (
            <SidebarItem
              key={n.id}
              icon={n.icon}
              label={n.label}
              selected={active === n.id}
              onClick={() => setActive(n.id)}
            />
          ))}
        </SidebarNav>
        <SidebarFooter>
          <KoinXMark />
        </SidebarFooter>
      </Sidebar>

      <AppShellMain style={{ gap: 'var(--spacing-20)', position: 'relative' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)', flex: 'none' }}>
          <h1 style={{ margin: 0, font: 'var(--type-heading-2)', color: 'var(--content-primary)' }}>Transactions</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-12)' }}>
            <Button variant="outline" iconLeft={<GuideListIcon />}>
              Guides
            </Button>
            {/* An action menu built from Select, not a bespoke component.
                `value={null}` keeps it controlled at nothing, so the trigger
                never adopts what you picked — onChange is a dispatch, not a
                binding — and `check={false}` drops the selected-row tick and
                the 32px inset it reserves. */}
            <Select
              value={null}
              onChange={(v) => ACTIONS[v]?.()}
              placeholder="Actions"
              check={false}
              size="medium"
              // The trigger stays trigger-sized and the panel grows to its rows.
              // `menuWidth="content"` exists because this screen needed it.
              menuWidth="content"
              options={[
                { value: 'download', label: 'Download CSV', icon: <FileDownloadIcon size={20} /> },
                { value: 'bulk', label: 'Bulk edit transactions', icon: <EditIcon size={20} /> },
                { value: 'add', label: 'Add transactions', icon: <AddPlusIcon size={20} /> },
                { value: 'accounts', label: 'Potential accounts', icon: <ActionsIcon size={20} /> },
              ]}
            />
          </div>
        </header>

        {/* filter bar — every field fills, nothing hugs but the trailing action */}
        <div style={{ display: 'flex', gap: 'var(--spacing-8)', flex: 'none' }}>
          <Select size="medium"
            options={[
              { value: 'all', label: 'All issues' },
              { value: 'cost-basis', label: ISSUE_LABEL['cost-basis'] },
              { value: 'missing-prior', label: ISSUE_LABEL['missing-prior'] },
            ]}
            value={issueFilter}
            onChange={setIssueFilter}
          />
          <Select size="medium"
            options={[
              { value: 'all', label: 'All integrations' },
              { value: 'binance', label: 'Binance' },
              { value: 'kucoin', label: 'KuCoin' },
              { value: 'coindcx', label: 'CoinDCX' },
            ]}
            value={venueFilter}
            onChange={setVenueFilter}
          />
          <Select size="medium" options={opts('Types')} placeholder="Types" />
          <Select size="medium" options={opts('Coins')} placeholder="Coins" />
          <Select size="medium" options={opts('Labels')} placeholder="Labels" />
        </div>

        {chips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', flex: 'none', flexWrap: 'wrap' }}>
            <span style={{ font: 'var(--type-body-3)', color: 'var(--content-secondary)' }}>
              {rows.length} of {TXNS.length} transactions
            </span>
            {chips.map((c) => (
              <Badge key={c} variant="accent-primary">
                {c}
              </Badge>
            ))}
          </div>
        )}

        <div style={{ minHeight: 0, overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell width={40}>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={!allChecked && selected.length > 0}
                    onChange={() => setSelected(allChecked ? [] : rows.map((r) => r.id))}
                  />
                </TableHeaderCell>
                <TableHeaderCell width={150}>Type</TableHeaderCell>
                <TableHeaderCell width={220} fill>
                  Sent
                </TableHeaderCell>
                <TableHeaderCell width={220} fill>
                  Received
                </TableHeaderCell>
                <TableHeaderCell width={180} fill>
                  Integration
                </TableHeaderCell>
                <TableHeaderCell width={200} align="end">
                  Gain / issue
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id} selected={selected.includes(t.id)}>
                  <TableCell width={40}>
                    <Checkbox
                      checked={selected.includes(t.id)}
                      onChange={() =>
                        setSelected((s) => (s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id]))
                      }
                    />
                  </TableCell>
                  <TableCell width={150}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
                      <SwapIcon size={20} />
                      Trade
                    </span>
                  </TableCell>
                  <TableCell width={220} fill>
                    {t.fromAmt}
                  </TableCell>
                  <TableCell width={220} fill>
                    {t.toAmt}
                  </TableCell>
                  <TableCell width={180} fill>
                    {t.venue}
                  </TableCell>
                  <TableCell width={200} align="end">
                    {t.gain ? (
                      <span style={{ color: 'var(--content-success-primary)' }}>{t.gain}</span>
                    ) : (
                      <Badge variant="accent-negative" iconLeft={<WarningAlertIcon />}>
                        {ISSUE_LABEL[t.issue as string]}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ---- the toast. Positioned by the screen: Toast is a card with no
                viewport of its own. This is the shortcut that removes the round
                trip the brief accepted. ---- */}
        {toast !== null && (
          <div style={{ position: 'absolute', left: '50%', bottom: 'var(--spacing-24)', transform: 'translateX(-50%)', zIndex: 30 }}>
            <Toast
              title={`${toast} transactions downloaded`}
              subtitle="Edited the file? Upload it to apply your changes."
              actionLabel="Upload edits"
              onAction={() => {
                setToast(null);
                setDialog('upload');
              }}
              dismissible
              onDismiss={() => setToast(null)}
            />
          </div>
        )}

        {applied !== null && (
          <div style={{ position: 'absolute', left: '50%', bottom: 'var(--spacing-24)', transform: 'translateX(-50%)', zIndex: 30 }}>
            <Toast
              variant="success"
              title={`${applied} transactions updated`}
              subtitle="Cost basis recalculated from your edits."
              dismissible
              onDismiss={() => setApplied(null)}
            />
          </div>
        )}
      </AppShellMain>

      {/* ---- one dialog, two steps ---- */}
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title="Bulk edit transactions"
        description="Export the transactions you need to fix, edit them in a spreadsheet, then upload the file to apply every change at once."
        confirmLabel={dialog === 'download' ? `Download ${exportIds.length} transactions` : 'Apply changes'}
        cancelLabel="Cancel"
        onConfirm={
          dialog === 'download'
            ? download
            : () => {
                setApplied(exportIds.length);
                setFile(null);
                setDialog(null);
              }
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <Tabs
            variant="boxed"
            value={dialog ?? 'download'}
            onChange={(v) => setDialog(v as Step)}
            items={[
              { value: 'download', label: '1 · Download' },
              { value: 'upload', label: '2 · Upload' },
            ]}
          />

          {dialog === 'download' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
                <span style={{ font: 'var(--type-body-3)', color: 'var(--content-secondary)' }}>Exporting</span>
                {chips.length ? (
                  chips.map((c) => (
                    <Badge key={c} variant="accent-primary">
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="accent-primary">All transactions</Badge>
                )}
              </div>
              <p style={{ margin: 0, font: 'var(--type-body-2)', color: 'var(--content-secondary)' }}>
                The CSV keeps one row per transaction and an <code>id</code> column. Leave that column alone — it is how
                your edits are matched back.
              </p>
            </>
          ) : (
            <FileUpload
              accept=".csv"
              title="Drop the edited CSV here"
              description="One file, .csv, up to 10 MB"
              files={file ? [{ name: file.name }] : []}
              onFilesSelected={(f) => setFile(f[0] ?? null)}
              onRemove={() => setFile(null)}
            />
          )}
        </div>
      </Dialog>
    </AppShell>
  );
}
