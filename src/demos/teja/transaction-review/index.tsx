import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Drawer,
  EmptyState,
  Input,
  Pagination,
  Radio,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Toast,
  CheckIcon,
  FilterListIcon,
  GenerateReportIcon,
  SearchIcon,
  WarningAlertIcon,
} from '@koinx/xui';
import './styles.css';

type Status = 'processed' | 'needs-attention' | 'resolved' | 'ignored';
type TransactionType = 'Buy' | 'Sell' | 'Transfer' | 'Deposit' | 'Withdrawal' | 'Swap' | 'Reward' | 'Airdrop';
type IssueType = 'missing-cost-basis' | 'unmatched-transfer' | 'duplicate-transaction' | 'unsupported-transaction' | 'missing-information' | 'classification-required';

type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  asset: string;
  quantity: number;
  value: number;
  currency: 'USD';
  source: string;
  destination: string;
  address: string;
  status: Status;
  issueType?: IssueType;
  issueDescription?: string;
  costBasis?: number;
  matchedTransactionId?: string;
  classification?: string;
  conflict?: boolean;
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'KX-882041', date: '2026-03-24T15:42:00', type: 'Transfer', asset: 'ETH', quantity: 2.4, value: 8650, currency: 'USD', source: 'Unknown wallet', destination: 'Binance', address: '0x71C8...4A2F', status: 'needs-attention', issueType: 'unmatched-transfer', issueDescription: 'We found the incoming transfer, but could not match it to an outgoing transaction from a wallet you own.' },
  { id: 'KX-882039', date: '2026-03-22T11:18:00', type: 'Swap', asset: 'USDT', quantity: 1500, value: 1500, currency: 'USD', source: 'MetaMask', destination: 'Uniswap', address: '0xA3F1...90D2', status: 'needs-attention', issueType: 'missing-cost-basis', issueDescription: 'The acquisition history for this USDT is missing, so KoinX cannot calculate the taxable gain.' },
  { id: 'KX-882034', date: '2026-03-20T09:05:00', type: 'Deposit', asset: 'SOL', quantity: 18, value: 2430, currency: 'USD', source: 'Coinbase', destination: 'Coinbase', address: 'Cb-portfolio-02', status: 'needs-attention', issueType: 'duplicate-transaction', issueDescription: 'This deposit has the same asset, quantity, timestamp and source as another imported record.' },
  { id: 'KX-882033', date: '2026-03-20T09:05:00', type: 'Deposit', asset: 'SOL', quantity: 18, value: 2430, currency: 'USD', source: 'Coinbase', destination: 'Coinbase', address: 'Cb-portfolio-02', status: 'processed' },
  { id: 'KX-882026', date: '2026-03-18T18:31:00', type: 'Airdrop', asset: 'ARB', quantity: 425, value: 310, currency: 'USD', source: 'MetaMask', destination: 'MetaMask', address: '0xA3F1...90D2', status: 'needs-attention', issueType: 'classification-required', issueDescription: 'The wallet activity has no reliable transaction label. Confirm what this receipt represents.' },
  { id: 'KX-882019', date: '2026-03-16T12:14:00', type: 'Reward', asset: 'ETH', quantity: 0.08, value: 286, currency: 'USD', source: 'Ledger', destination: 'Ledger', address: '0x29BA...F011', status: 'needs-attention', issueType: 'unsupported-transaction', issueDescription: 'This validator event is not yet supported automatically. Review it and choose how it should be treated.' },
  { id: 'KX-882012', date: '2026-03-14T16:20:00', type: 'Withdrawal', asset: 'BTC', quantity: 0.25, value: 17480, currency: 'USD', source: 'Binance', destination: 'Ledger', address: 'bc1q9x...d7rz', status: 'resolved', issueType: 'unmatched-transfer', matchedTransactionId: 'KX-881998' },
  { id: 'KX-882008', date: '2026-03-13T10:04:00', type: 'Buy', asset: 'BTC', quantity: 0.12, value: 8350, currency: 'USD', source: 'Coinbase', destination: 'Coinbase', address: 'Cb-portfolio-02', status: 'processed' },
  { id: 'KX-882001', date: '2026-03-12T21:48:00', type: 'Sell', asset: 'ETH', quantity: 1.15, value: 4090, currency: 'USD', source: 'Binance', destination: 'Binance', address: 'Bn-spot-01', status: 'processed' },
  { id: 'KX-881998', date: '2026-03-12T08:12:00', type: 'Deposit', asset: 'BTC', quantity: 0.25, value: 17290, currency: 'USD', source: 'Ledger', destination: 'Binance', address: 'bc1q9x...d7rz', status: 'processed' },
  { id: 'KX-881987', date: '2026-03-10T13:37:00', type: 'Buy', asset: 'MATIC', quantity: 2200, value: 1910, currency: 'USD', source: 'Coinbase', destination: 'Coinbase', address: 'Cb-portfolio-02', status: 'needs-attention', issueType: 'missing-information', issueDescription: 'The imported CSV omitted the fee currency. Add a note or confirm the transaction without a fee.' },
  { id: 'KX-881972', date: '2026-03-08T19:11:00', type: 'Swap', asset: 'LINK', quantity: 84, value: 1240, currency: 'USD', source: 'MetaMask', destination: 'Uniswap', address: '0xA3F1...90D2', status: 'resolved', issueType: 'missing-cost-basis', costBasis: 1100 },
  { id: 'KX-881960', date: '2026-03-06T07:44:00', type: 'Reward', asset: 'ADA', quantity: 310, value: 176, currency: 'USD', source: 'Ledger', destination: 'Ledger', address: 'addr1q8...7tj', status: 'processed' },
  { id: 'KX-881944', date: '2026-03-03T14:26:00', type: 'Transfer', asset: 'USDC', quantity: 5000, value: 5000, currency: 'USD', source: 'Coinbase', destination: 'MetaMask', address: '0xA3F1...90D2', status: 'processed' },
  { id: 'KX-881921', date: '2026-02-28T22:03:00', type: 'Sell', asset: 'SOL', quantity: 9.5, value: 1384, currency: 'USD', source: 'Binance', destination: 'Binance', address: 'Bn-spot-01', status: 'needs-attention', issueType: 'missing-cost-basis', issueDescription: 'No purchase lot could be associated with this disposal.', conflict: true },
  { id: 'KX-881908', date: '2026-02-25T10:55:00', type: 'Withdrawal', asset: 'ETH', quantity: 0.6, value: 2112, currency: 'USD', source: 'Coinbase', destination: 'Ledger', address: '0x29BA...F011', status: 'processed' },
  { id: 'KX-881890', date: '2026-02-21T17:20:00', type: 'Airdrop', asset: 'OP', quantity: 150, value: 202, currency: 'USD', source: 'MetaMask', destination: 'MetaMask', address: '0xA3F1...90D2', status: 'resolved', issueType: 'classification-required', classification: 'Reward' },
  { id: 'KX-881877', date: '2026-02-18T08:18:00', type: 'Deposit', asset: 'USDT', quantity: 2500, value: 2500, currency: 'USD', source: 'Binance', destination: 'Binance', address: 'Bn-spot-01', status: 'processed' },
  { id: 'KX-881852', date: '2026-02-12T15:36:00', type: 'Transfer', asset: 'BTC', quantity: 0.08, value: 5350, currency: 'USD', source: 'Ledger', destination: 'Coinbase', address: 'bc1q9x...d7rz', status: 'needs-attention', issueType: 'unmatched-transfer', issueDescription: 'The receiving platform has no matching deposit within the expected time window.' },
  { id: 'KX-881839', date: '2026-02-08T12:02:00', type: 'Buy', asset: 'ETH', quantity: 1.4, value: 4820, currency: 'USD', source: 'Binance', destination: 'Binance', address: 'Bn-spot-01', status: 'processed' },
  { id: 'KX-881820', date: '2026-02-02T20:09:00', type: 'Swap', asset: 'UNI', quantity: 220, value: 1580, currency: 'USD', source: 'MetaMask', destination: 'Uniswap', address: '0xA3F1...90D2', status: 'processed' },
  { id: 'KX-881801', date: '2026-01-28T09:29:00', type: 'Sell', asset: 'BTC', quantity: 0.04, value: 2640, currency: 'USD', source: 'Coinbase', destination: 'Coinbase', address: 'Cb-portfolio-02', status: 'processed' },
  { id: 'KX-881779', date: '2026-01-20T18:47:00', type: 'Reward', asset: 'SOL', quantity: 1.8, value: 245, currency: 'USD', source: 'Ledger', destination: 'Ledger', address: 'Sol7w...L92', status: 'processed' },
  { id: 'KX-881754', date: '2026-01-14T11:05:00', type: 'Buy', asset: 'USDC', quantity: 3000, value: 3000, currency: 'USD', source: 'Binance', destination: 'Binance', address: 'Bn-spot-01', status: 'processed' },
];

const ISSUE_LABELS: Record<IssueType, string> = {
  'missing-cost-basis': 'Missing cost basis',
  'unmatched-transfer': 'Unmatched transfer',
  'duplicate-transaction': 'Duplicate transaction',
  'unsupported-transaction': 'Unsupported transaction',
  'missing-information': 'Missing information',
  'classification-required': 'Classification required',
};

const option = (value: string, label = value) => ({ value, label });
const STATUS_OPTIONS = [option('all', 'All statuses'), option('needs-attention', 'Needs attention'), option('resolved', 'Resolved'), option('processed', 'Processed'), option('ignored', 'Ignored')];
const ISSUE_OPTIONS = [option('all', 'All issue types'), ...Object.entries(ISSUE_LABELS).map(([value, label]) => option(value, label))];
const TYPE_OPTIONS = [option('all', 'All transaction types'), ...['Buy', 'Sell', 'Transfer', 'Swap', 'Deposit', 'Withdrawal', 'Reward', 'Airdrop'].map((v) => option(v, v))];
const SOURCE_OPTIONS = [option('all', 'All sources'), ...['Binance', 'Coinbase', 'Ledger', 'MetaMask'].map((v) => option(v, v))];
const CLASSIFICATIONS = ['Personal transfer', 'Purchase', 'Sale', 'Swap', 'Reward', 'Other'];
const PAGE_SIZE = 8;

function formatDate(date: string, long = false) {
  return new Intl.DateTimeFormat('en-IN', long ? { dateStyle: 'medium', timeStyle: 'short' } : { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function StatusBadge({ transaction }: { transaction: Transaction }) {
  if (transaction.status === 'needs-attention') return <Badge variant="label-warning" iconLeft={<WarningAlertIcon />}>Needs attention</Badge>;
  if (transaction.status === 'resolved') return <Badge variant="label-positive" iconLeft={<CheckIcon />}>Resolved</Badge>;
  if (transaction.status === 'ignored') return <Badge variant="label-neutral">Ignored</Badge>;
  return <Badge variant="label-info">Processed</Badge>;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: 'attention' | 'success' }) {
  return <div className={`review-card${tone ? ` review-card-${tone}` : ''}`}><span className="review-card-label">{label}</span><strong className="review-card-value">{value.toLocaleString('en-IN')}</strong></div>;
}

type ConfirmState = { kind: 'discard' | 'ignore' | 'duplicate-remove' | 'bulk-ignore'; ids?: string[] } | null;

export default function TransactionReview() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [issue, setIssue] = useState('all');
  const [type, setType] = useState('all');
  const [source, setSource] = useState('all');
  const [sort, setSort] = useState<'date-desc' | 'date-asc' | 'value-desc' | 'value-asc'>('date-desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [costBasis, setCostBasis] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [classification, setClassification] = useState('');
  const [matchId, setMatchId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<{ variant: 'success' | 'error' | 'warning'; title: string; subtitle?: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const active = transactions.find((t) => t.id === activeId) ?? null;
  const stats = useMemo(() => ({
    total: transactions.length,
    processed: transactions.filter((t) => t.status === 'processed').length,
    needsAttention: transactions.filter((t) => t.status === 'needs-attention').length,
    resolved: transactions.filter((t) => t.status === 'resolved').length,
    remaining: transactions.filter((t) => t.status === 'needs-attention').length,
  }), [transactions]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions
      .filter((t) => status === 'all' || t.status === status)
      .filter((t) => issue === 'all' || t.issueType === issue)
      .filter((t) => type === 'all' || t.type === type)
      .filter((t) => source === 'all' || t.source === source || t.destination === source)
      .filter((t) => !needle || [t.id, t.asset, t.address, t.source, t.destination, t.type].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => sort.startsWith('date')
        ? (sort.endsWith('desc') ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
        : (sort.endsWith('desc') ? b.value - a.value : a.value - b.value));
  }, [transactions, query, status, issue, type, source, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleSelected = rows.filter((t) => selected.includes(t.id));
  const allVisibleSelected = rows.length > 0 && visibleSelected.length === rows.length;
  const selectedTransactions = transactions.filter((t) => selected.includes(t.id));
  const sameIssue = selectedTransactions.length > 0 && selectedTransactions.every((t) => t.issueType === selectedTransactions[0].issueType);

  useEffect(() => { setPage(1); }, [query, status, issue, type, source, sort]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  useEffect(() => {
    if (!active) return;
    setCostBasis(active.costBasis?.toString() ?? '');
    setClassification(active.classification ?? '');
    setMatchId(active.matchedTransactionId ?? '');
    setNote('');
    setDirty(false);
    setError('');
    window.setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [activeId]);

  const resetFilters = () => { setQuery(''); setStatus('all'); setIssue('all'); setType('all'); setSource('all'); };
  const closeDrawer = () => dirty ? setConfirm({ kind: 'discard' }) : setActiveId(null);
  const updateActive = (patch: Partial<Transaction>, message: string) => {
    if (!active) return;
    setTransactions((items) => items.map((t) => t.id === active.id ? { ...t, ...patch, status: 'resolved' } : t));
    setDirty(false);
    setError('');
    setToast({ variant: 'success', title: message, subtitle: `${active.asset} transaction ${active.id} is now resolved.` });
    setActiveId(null);
  };

  const saveResolution = () => {
    if (!active?.issueType) return;
    if (active.conflict) {
      setError('This transaction changed in another session. We loaded the latest version; review your preserved input and try again.');
      setTransactions((items) => items.map((t) => t.id === active.id ? { ...t, conflict: false } : t));
      return;
    }
    if (active.issueType === 'missing-cost-basis') {
      const amount = Number(costBasis);
      if (!costBasis || Number.isNaN(amount) || amount <= 0) { setError('Enter a cost basis greater than zero.'); return; }
      if (costBasis === '13.37') { setError('We could not save this correction. Your value is still here—try again.'); return; }
      updateActive({ costBasis: amount }, 'Cost basis added');
    } else if (active.issueType === 'unmatched-transfer') {
      if (!matchId) { setError('Select the matching transaction.'); return; }
      updateActive({ matchedTransactionId: matchId }, 'Transfer matched');
    } else if (active.issueType === 'classification-required' || active.issueType === 'unsupported-transaction') {
      if (!classification) { setError('Choose a classification.'); return; }
      const typeMap: Record<string, TransactionType> = { 'Personal transfer': 'Transfer', Purchase: 'Buy', Sale: 'Sell', Swap: 'Swap', Reward: 'Reward', Other: active.type };
      updateActive({ classification, type: typeMap[classification] }, 'Classification saved');
    } else if (active.issueType === 'missing-information') {
      if (note.trim().length < 3) { setError('Add a short note explaining the missing information.'); return; }
      updateActive({}, 'Transaction information confirmed');
    } else if (active.issueType === 'duplicate-transaction') {
      updateActive({}, 'Both transactions kept');
    }
  };

  const applyBulk = (action: string) => {
    if (action === 'ignore') { setConfirm({ kind: 'bulk-ignore', ids: selected }); return; }
    if (action === 'reviewed') {
      setTransactions((items) => items.map((t) => selected.includes(t.id) && t.status === 'needs-attention' ? { ...t, status: 'resolved' } : t));
      setToast({ variant: 'success', title: `${selected.length} transactions marked as reviewed` });
      setSelected([]);
    }
    if (action.startsWith('classify:')) {
      const value = action.replace('classify:', '');
      setTransactions((items) => items.map((t) => selected.includes(t.id) ? { ...t, status: 'resolved', classification: value } : t));
      setToast({ variant: 'success', title: `${selected.length} transactions classified as ${value}` });
      setSelected([]);
    }
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === 'discard') { setDirty(false); setActiveId(null); }
    if (confirm.kind === 'ignore' && active) {
      setTransactions((items) => items.map((t) => t.id === active.id ? { ...t, status: 'ignored' } : t));
      setToast({ variant: 'warning', title: 'Issue ignored', subtitle: 'You can restore it by reopening the transaction.' });
      setActiveId(null);
    }
    if (confirm.kind === 'bulk-ignore' && confirm.ids) {
      setTransactions((items) => items.map((t) => confirm.ids?.includes(t.id) ? { ...t, status: 'ignored' } : t));
      setToast({ variant: 'warning', title: `${confirm.ids.length} issues ignored` });
      setSelected([]);
    }
    if (confirm.kind === 'duplicate-remove' && active) {
      setTransactions((items) => items.map((t) => t.id === active.id ? { ...t, status: 'ignored' } : t));
      setToast({ variant: 'success', title: 'Duplicate excluded', subtitle: 'The original import remains unchanged.' });
      setActiveId(null);
    }
    setConfirm(null);
  };

  const filtersActive = [status, issue, type, source].some((v) => v !== 'all') || Boolean(query);
  const candidates = active?.issueType === 'unmatched-transfer' ? transactions.filter((t) => t.asset === active.asset && t.id !== active.id).slice(0, 3) : [];
  const duplicate = active?.issueType === 'duplicate-transaction' ? transactions.find((t) => t.id === 'KX-882033') : null;

  return <main className="transaction-review">
    <header className="review-header">
      <div><h1 className="review-title">Transaction review</h1><p className="review-subtitle">Review imported activity so your tax calculation is complete and accurate.</p></div>
      <div className="review-header-actions">
        <Button variant="outline" onClick={() => setTransactions(INITIAL_TRANSACTIONS)}>Reset demo</Button>
        <Button iconLeft={<GenerateReportIcon />} disabled={stats.remaining > 0} onClick={() => setToast({ variant: 'success', title: 'Tax report generation started' })}>Generate tax report</Button>
      </div>
    </header>

    {stats.remaining === 0 && <section className="review-complete" aria-live="polite"><CheckIcon size={32} /><div className="review-complete-copy"><h2>You’re ready to generate your tax report</h2><p>All {stats.total} transactions have been reviewed. There are no critical issues remaining.</p></div><Button iconLeft={<GenerateReportIcon />} onClick={() => setToast({ variant: 'success', title: 'Tax report generation started' })}>Generate tax report</Button></section>}

    <section className="review-summary" aria-label="Transaction overview">
      <SummaryCard label="Total transactions" value={stats.total} />
      <SummaryCard label="Processed" value={stats.processed} />
      <SummaryCard label="Need attention" value={stats.needsAttention} tone={stats.needsAttention ? 'attention' : undefined} />
      <SummaryCard label="Resolved issues" value={stats.resolved} tone="success" />
      <SummaryCard label="Remaining issues" value={stats.remaining} tone={stats.remaining ? 'attention' : 'success'} />
    </section>
    <div className="review-progress" role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={stats.resolved + stats.remaining} aria-valuenow={stats.resolved}><div style={{ width: `${stats.resolved + stats.remaining ? (stats.resolved / (stats.resolved + stats.remaining)) * 100 : 100}%` }} /></div>

    <section aria-label="Transaction filters">
      <div className="review-toolbar">
        <div className="review-search"><Input size="small" aria-label="Search transactions" placeholder="Search asset, ID, wallet or exchange" value={query} onChange={(e) => setQuery(e.target.value)} leading={<SearchIcon size={18} />} /></div>
        <Button className="review-filter-toggle" variant="outline" iconLeft={<FilterListIcon size={18} />} onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>Filters</Button>
        {filtersOpen && <div className="review-filters">
          <Select size="medium" width="168px" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          <Select size="medium" width="190px" options={ISSUE_OPTIONS} value={issue} onChange={setIssue} />
          <Select size="medium" width="184px" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <Select size="medium" width="150px" options={SOURCE_OPTIONS} value={source} onChange={setSource} />
        </div>}
      </div>
      <div className="review-result-bar"><span>{filtered.length.toLocaleString('en-IN')} matching transactions</span>{filtersActive && <Button variant="link" size="small" onClick={resetFilters}>Clear filters</Button>}<Select size="medium" width="176px" value={sort} onChange={(v) => setSort(v as typeof sort)} options={[option('date-desc', 'Newest first'), option('date-asc', 'Oldest first'), option('value-desc', 'Highest value'), option('value-asc', 'Lowest value')]} /></div>
    </section>

    {selected.length > 0 && <div className="review-bulk-bar" aria-live="polite">
      <span className="review-bulk-copy">{selected.length} selected</span>
      <Button size="small" variant="outline" onClick={() => applyBulk('reviewed')}>Mark as reviewed</Button>
      {sameIssue && selectedTransactions[0]?.issueType === 'classification-required' && <Select size="medium" width="190px" value={null} check={false} placeholder="Assign classification" onChange={(v) => applyBulk(`classify:${v}`)} options={CLASSIFICATIONS.map((v) => option(v, v))} />}
      <Button size="small" variant="destructive" onClick={() => applyBulk('ignore')}>Ignore issue</Button>
    </div>}

    <section className="review-table-shell" aria-label="Transactions">
      {rows.length ? <>
        <div className="review-table-scroll"><Table><TableHead><TableRow>
          <TableHeaderCell width={44}><Checkbox aria-label="Select all visible transactions" checked={allVisibleSelected} indeterminate={!allVisibleSelected && visibleSelected.length > 0} onChange={() => setSelected((current) => allVisibleSelected ? current.filter((id) => !rows.some((r) => r.id === id)) : Array.from(new Set([...current, ...rows.map((r) => r.id)])))} /></TableHeaderCell>
          <TableHeaderCell width={132}>Date</TableHeaderCell><TableHeaderCell width={112}>Type</TableHeaderCell><TableHeaderCell width={150} fill>Asset / amount</TableHeaderCell><TableHeaderCell width={120} align="end">Value</TableHeaderCell><TableHeaderCell width={140} fill>Source</TableHeaderCell><TableHeaderCell width={210} fill>Status</TableHeaderCell><TableHeaderCell width={84}>Action</TableHeaderCell>
        </TableRow></TableHead><TableBody>{rows.map((t) => <TableRow key={t.id} selected={selected.includes(t.id)}>
          <TableCell width={44}><Checkbox aria-label={`Select ${t.id}`} checked={selected.includes(t.id)} onChange={() => setSelected((current) => current.includes(t.id) ? current.filter((id) => id !== t.id) : [...current, t.id])} /></TableCell>
          <TableCell width={132}><span>{formatDate(t.date)}</span><div className="review-muted">{t.id}</div></TableCell>
          <TableCell width={112}>{t.type}</TableCell>
          <TableCell width={150} fill><span className="review-asset">{t.asset}</span><div className="review-muted">{t.quantity.toLocaleString('en-US')} {t.asset}</div></TableCell>
          <TableCell width={120} align="end">{formatMoney(t.value)}</TableCell>
          <TableCell width={140} fill><span>{t.source}</span><div className="review-muted">to {t.destination}</div></TableCell>
          <TableCell width={210} fill><StatusBadge transaction={t} />{t.status === 'needs-attention' && t.issueType && <div className="review-muted review-issue">{ISSUE_LABELS[t.issueType]}</div>}</TableCell>
          <TableCell width={84}><Button className="review-row-button" size="small" variant="link" onClick={() => setActiveId(t.id)} aria-label={`Review transaction ${t.id}`}>{t.status === 'needs-attention' ? 'Review' : 'View'}</Button></TableCell>
        </TableRow>)}</TableBody></Table></div>
        <div className="review-pagination"><Pagination page={page} pageCount={pageCount} onPageChange={setPage} size="small" mobile={window.innerWidth < 700} /></div>
      </> : <div className="review-empty"><EmptyState title={query ? 'No transactions found' : 'No transactions match these filters'} description={query ? `Try another search or clear “${query}”.` : 'Clear one or more filters to see transactions.'} actions={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>} /></div>}
    </section>

    <Drawer open={Boolean(active)} onClose={closeDrawer} placement={window.innerWidth < 700 ? 'bottom' : 'right'} width="520px" height={window.innerWidth < 700 ? '88%' : undefined} title={active ? `${active.asset} · ${active.type}` : ''} footer={active?.status === 'needs-attention' ? <div className="review-drawer-actions"><Button variant="outline" onClick={() => setConfirm({ kind: 'ignore' })}>Ignore issue</Button><Button onClick={saveResolution}>{active.issueType === 'unmatched-transfer' ? 'Confirm match' : active.issueType === 'classification-required' || active.issueType === 'unsupported-transaction' ? 'Save classification' : active.issueType === 'duplicate-transaction' ? 'Keep both' : 'Save correction'}</Button></div> : undefined}>
      {active && <div className="review-drawer-body">
        <div className="review-inline"><StatusBadge transaction={active} />{active.issueType && <Badge variant="accent-secondary">{ISSUE_LABELS[active.issueType]}</Badge>}</div>
        <section className="review-detail-grid" aria-label="Transaction information">
          {[['Date and time', formatDate(active.date, true)], ['Quantity', `${active.quantity.toLocaleString('en-US')} ${active.asset}`], ['Value', formatMoney(active.value)], ['Source', active.source], ['Destination', active.destination], ['Transaction ID', active.id], ['Wallet address', active.address]].map(([label, value]) => <div className="review-detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </section>
        {active.status === 'needs-attention' && active.issueType && <>
          <section className="review-section review-callout"><h3>What KoinX detected</h3><p>{active.issueDescription}</p></section>
          <section className="review-section"><h3>{ISSUE_LABELS[active.issueType]}</h3>
            {active.issueType === 'missing-cost-basis' && <><p>Enter what you paid for this asset. This value will be used to recalculate the gain or loss.</p><div className="review-form-grid"><Input ref={firstInputRef} label="Cost basis" type="number" min="0" step="0.01" value={costBasis} error={Boolean(error)} helperText={error || 'Use the total acquisition cost.'} onChange={(e) => { setCostBasis(e.target.value); setDirty(true); setError(''); }} /><Select width="132px" value={currency} onChange={(v) => { setCurrency(v); setDirty(true); }} options={[option('USD'), option('INR'), option('EUR')]} /></div><p className="review-muted">Demo error: enter 13.37 to simulate a failed save.</p></>}
            {active.issueType === 'unmatched-transfer' && <><p>We found {candidates.length} possible matching transactions. Select the outgoing or incoming record that represents the same transfer.</p><div className="review-match-list">{candidates.map((candidate) => <label className="review-match-row" key={candidate.id}><Radio ref={!matchId ? firstInputRef : undefined} name="match" checked={matchId === candidate.id} onChange={() => { setMatchId(candidate.id); setDirty(true); setError(''); }} /><span className="review-match-copy"><strong>{formatDate(candidate.date)} · {candidate.quantity} {candidate.asset}</strong><span>{candidate.source} → {candidate.destination} · {candidate.id}</span></span></label>)}</div></>}
            {(active.issueType === 'classification-required' || active.issueType === 'unsupported-transaction') && <><p>What was this transaction? Your choice determines how it is treated in the tax calculation.</p><div className="review-radio-list">{CLASSIFICATIONS.map((value, index) => <label className="review-radio-row" key={value}><Radio ref={index === 0 ? firstInputRef : undefined} name="classification" label={value} checked={classification === value} onChange={() => { setClassification(value); setDirty(true); setError(''); }} /></label>)}</div></>}
            {active.issueType === 'missing-information' && <><p>Confirm how KoinX should treat the missing fee information. Your note is kept with the review record.</p><Input ref={firstInputRef} label="Review note" placeholder="e.g. Exchange confirmed there was no fee" value={note} error={Boolean(error)} helperText={error} onChange={(e) => { setNote(e.target.value); setDirty(true); setError(''); }} /></>}
            {active.issueType === 'duplicate-transaction' && <><p>Compare both imports before deciding. Nothing is permanently deleted during review.</p><div className="review-match-list"><div className="review-match-row"><span className="review-match-copy"><strong>{active.id} · {active.quantity} {active.asset}</strong><span>{active.source} · {formatDate(active.date, true)}</span></span><Badge variant="label-warning">Potential duplicate</Badge></div>{duplicate && <div className="review-match-row"><span className="review-match-copy"><strong>{duplicate.id} · {duplicate.quantity} {duplicate.asset}</strong><span>{duplicate.source} · {formatDate(duplicate.date, true)}</span></span><Badge variant="label-info">Original import</Badge></div>}</div><div className="review-inline"><Button variant="destructive" onClick={() => setConfirm({ kind: 'duplicate-remove' })}>Remove duplicate</Button><Button variant="outline" onClick={() => updateActive({}, 'Marked as not a duplicate')}>Mark as not duplicate</Button></div></>}
            {error && active.issueType !== 'missing-cost-basis' && active.issueType !== 'missing-information' && <div className="review-callout" role="alert"><p>{error}</p></div>}
          </section>
        </>}
        {active.status !== 'needs-attention' && <section className="review-callout review-callout-success"><h3>Review complete</h3><p>This transaction no longer blocks report generation.</p></section>}
      </div>}
    </Drawer>

    <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} variant={confirm?.kind === 'discard' ? 'alert' : 'destructive'} title={confirm?.kind === 'discard' ? 'Discard unsaved changes?' : confirm?.kind === 'duplicate-remove' ? 'Remove this duplicate?' : 'Ignore this issue?'} description={confirm?.kind === 'discard' ? 'Your changes have not been saved.' : confirm?.kind === 'duplicate-remove' ? 'The transaction will be excluded, not permanently deleted. You can restore it later.' : 'Ignored issues will not block report generation, but may affect the accuracy of your report.'} confirmLabel={confirm?.kind === 'discard' ? 'Discard changes' : confirm?.kind === 'duplicate-remove' ? 'Remove duplicate' : 'Ignore issue'} onConfirm={confirmAction} />

    {toast && <div className="review-toast" aria-live="polite"><Toast variant={toast.variant} title={toast.title} subtitle={toast.subtitle} dismissible onDismiss={() => setToast(null)} /></div>}
  </main>;
}
