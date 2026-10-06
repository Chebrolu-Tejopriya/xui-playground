import { useMemo, useState } from 'react';
import {
  AIIcon,
  AddPlusIcon,
  ArchivedIcon,
  ArrowForwardIcon,
  Badge,
  BubbleIcon,
  Button,
  ChevronUpIcon,
  Checkbox,
  Dialog,
  DownloadIcon,
  FilterListIcon,
  GuidesIcon,
  MoreVertIcon,
  Select,
  SendIcon,
  SwapIcon,
  Tabs,
  TradeIcon,
} from '@koinx/xui';
import binanceLogo from './binance-logo.png';
import maticLogo from './matic.png';
import usdtLogo from './usdt.png';
import './styles.css';

const ARCHIVED_COUNT_KEY = 'koinx-transaction-archive-count';
const TOTAL_TRANSACTIONS = 2983;
const INITIAL_ARCHIVED_COUNT = 14;

type Transaction = {
  id: string;
  time: string;
  type: string;
  fromCoin: string;
  fromAmount: string;
  fromCost: string;
  toCoin: string;
  toAmount: string;
  toValue: string;
  gain: string;
  fee: string;
  description: string;
  archived: boolean;
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'KX-31696', time: '3:54:28 PM', type: 'Trade', fromCoin: 'MATIC', fromAmount: '- 2500 MATIC',
    fromCost: 'Cost: ₹4,858.54', toCoin: 'USDT', toAmount: '+ 6,875 USDT', toValue: '≈ ₹5,18,341.99',
    gain: '+ ₹5,14,273.45', fee: '0.10% Fees\n₹43.2 TDS',
    description: 'You traded 2500 MATIC for 6,875 USDT (worth ₹5,18,341.99) and paid a fee of 7.82 USDT (₹428.45) and TDS of ₹5,183. Your cost-basis for 2500 MATIC has been calculated using FIFO from the investments listed below. Your final capital gain for this transaction is + ₹5,14,273.45',
    archived: false,
  },
  {
    id: 'KX-4071', time: '3:54:28 PM', type: 'Trade', fromCoin: 'ETH', fromAmount: '- 11.78 ETH',
    fromCost: 'Cost: ₹18,32,410.00', toCoin: 'BTC', toAmount: '+ 0.778 BTC', toValue: '≈ ₹21,76,023.10',
    gain: '+ ₹3,43,613.10', fee: '0.10% Fees\n₹1,340 TDS',
    description: 'Ethereum was swapped for Bitcoin. The gain shown is calculated from your available acquisition history.',
    archived: false,
  },
  {
    id: 'KX-99593', time: '11:12:09 AM', type: 'Trade', fromCoin: 'MATIC', fromAmount: '- 400 MATIC',
    fromCost: 'Cost: ₹742.00', toCoin: 'USDT', toAmount: '+ 950 USDT', toValue: '≈ ₹78,320.00',
    gain: '+ ₹77,578.00', fee: '0.10% Fees\n₹783 TDS',
    description: 'This transaction was imported from Binance and included in the original tax calculation.',
    archived: true,
  },
];

function getInitialArchivedCount() {
  const stored = Number(window.localStorage.getItem(ARCHIVED_COUNT_KEY));
  return Number.isFinite(stored) && stored >= 0 ? stored : INITIAL_ARCHIVED_COUNT;
}

function navigateToIntegration() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  window.location.assign(`?demo=teja/integration-detail&theme=${theme}`);
}

function AssetMark({ coin }: { coin: string }) {
  if (coin === 'MATIC') return <img className="txn-coin-logo" src={maticLogo} alt="MATIC" />;
  if (coin === 'USDT') return <img className="txn-coin-logo" src={usdtLogo} alt="USDT" />;
  return <span className="txn-coin-text" aria-label={coin}>{coin}</span>;
}

export default function TransactionArchive() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [archivedCount, setArchivedCount] = useState(getInitialArchivedCount);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState('KX-31696');
  const [detailTab, setDetailTab] = useState('details');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const visibleTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.archived === (view === 'archived')),
    [transactions, view],
  );
  const selectedVisible = visibleTransactions.filter((transaction) => selected.includes(transaction.id));

  function openArchiveConfirmation(ids: string[]) {
    setPendingIds(ids);
    setConfirmOpen(true);
  }

  function archivePending() {
    const ids = new Set(pendingIds);
    const updatedCount = archivedCount + ids.size;
    setTransactions((current) => current.map((transaction) => ids.has(transaction.id) ? { ...transaction, archived: true } : transaction));
    setArchivedCount(updatedCount);
    window.localStorage.setItem(ARCHIVED_COUNT_KEY, String(updatedCount));
    setSelected((current) => current.filter((id) => !ids.has(id)));
    setConfirmOpen(false);
  }

  function unarchive(id: string) {
    const updatedCount = Math.max(0, archivedCount - 1);
    setTransactions((current) => current.map((transaction) => transaction.id === id ? { ...transaction, archived: false } : transaction));
    setArchivedCount(updatedCount);
    window.localStorage.setItem(ARCHIVED_COUNT_KEY, String(updatedCount));
  }

  function setTransactionView(value: 'active' | 'archived') {
    setView(value);
    setSelected([]);
  }

  function handleRowAction(id: string, action: string) {
    if (action === 'archive') openArchiveConfirmation([id]);
    if (action === 'unarchive') unarchive(id);
  }

  return (
    <main className="txn-page">
      <header className="txn-header">
        <h1>Transactions</h1>
        <div className="txn-header-actions">
          <Button variant="outline" size="medium" iconLeft={<GuidesIcon size={18} />} iconRight={<ChevronUpIcon variant="outlined" size={18} />}>Guides</Button>
          <Button iconLeft={<AddPlusIcon />}>Add Transaction</Button>
          <Button variant="outline" iconRight={<DownloadIcon />}>Download CSV</Button>
        </div>
      </header>

      <section className="txn-ai-prompt" aria-label="Ask KoinX AI">
        <div className="txn-ai-brand"><AIIcon size={24} /><strong>Ask KoinX AI</strong><Badge variant="label-warning">New</Badge></div>
        <input aria-label="Ask KoinX AI" placeholder="Example: Fetch BTC and ETH transactions in FY25..." />
        <Button className="txn-ai-send" iconRight={<SendIcon size={18} />}>Send</Button>
      </section>

      <section className="txn-filters" aria-label="Transaction filters">
        <Select size="medium" value={null} check={false} placeholder="All Integrations" options={[{ value: 'all', label: 'All Integrations' }, { value: 'binance', label: 'Binance' }]} />
        <Select size="medium" value={null} check={false} placeholder="Types" options={[{ value: 'all', label: 'Types' }, { value: 'trade', label: 'Trade' }, { value: 'transfer', label: 'Transfer' }]} />
        <Select size="medium" value={null} check={false} placeholder="Coins" options={[{ value: 'all', label: 'Coins' }, { value: 'matic', label: 'MATIC' }, { value: 'usdt', label: 'USDT' }]} />
        <Select size="medium" value={null} check={false} placeholder="Labels" options={[{ value: 'all', label: 'Labels' }]} />
        <Select size="medium" value={null} check={false} placeholder="Sort by: Highest Gains" options={[{ value: 'gains', label: 'Sort by: Highest Gains' }, { value: 'recent', label: 'Most Recent' }]} />
        <Button variant="outline" size="medium" iconLeft={<FilterListIcon size={16} />} iconRight={<Badge variant="label-negative">4</Badge>}>More Filters</Button>
      </section>

      <div className="txn-context-row">
        <div className="txn-result-count"><span>{TOTAL_TRANSACTIONS.toLocaleString('en-IN')} transactions</span><span className="txn-dot">·</span><span>{archivedCount} archived</span></div>
        <Button variant="link" size="small" onClick={navigateToIntegration}>View integration <ArrowForwardIcon size={16} /></Button>
      </div>

      <div className="txn-list-toolbar">
        <Tabs
          variant="underline"
          size="medium"
          value={view}
          onChange={(value) => setTransactionView(value as 'active' | 'archived')}
          items={[
            { value: 'active', label: 'Transactions' },
            { value: 'archived', label: `Archived (${archivedCount})` },
          ]}
        />
        <span className="txn-tax-note">Archived transactions are excluded from tax calculations and portfolio.</span>
      </div>

      {selectedVisible.length > 0 && view === 'active' && (
        <div className="txn-bulk-bar" aria-live="polite">
          <strong>{selectedVisible.length} selected</strong>
          <span>Archiving updates tax calculations and portfolio; billing stays based on all connected transactions.</span>
          <Button size="small" iconLeft={<ArchivedIcon />} onClick={() => openArchiveConfirmation(selectedVisible.map((transaction) => transaction.id))}>
            Archive {selectedVisible.length} selected
          </Button>
        </div>
      )}

      <section className="txn-feed" aria-label={view === 'active' ? 'Transactions' : 'Archived transactions'}>
        <h2 className="txn-date-heading">10 Mar 2024</h2>
        {visibleTransactions.length > 0 ? visibleTransactions.map((transaction) => {
          const expanded = expandedId === transaction.id;
          const actions = transaction.archived
            ? [{ value: 'unarchive', label: 'Unarchive transaction' }]
            : [
                { value: 'edit', label: 'Edit' },
                { value: 'description', label: 'Edit Description' },
                { value: 'label', label: 'Label Transaction' },
                { value: 'split', label: 'Split' },
                { value: 'migrate', label: 'Migrate Coin(s)' },
                { value: 'spam', label: 'Mark As Spam' },
                { value: 'archive', label: 'Archive transaction' },
                { value: 'delete', label: 'Delete' },
              ];

          return (
            <article className={`txn-card${expanded ? ' is-expanded' : ''}`} key={transaction.id}>
              <div className="txn-card-summary">
                <Checkbox
                  className="txn-select-checkbox"
                  aria-label={`${selected.includes(transaction.id) ? 'Deselect' : 'Select'} ${transaction.id}`}
                  checked={selected.includes(transaction.id)}
                  onChange={() => setSelected((current) => current.includes(transaction.id) ? current.filter((item) => item !== transaction.id) : [...current, transaction.id])}
                />
                <button className="txn-type-button" type="button" onClick={() => setExpandedId(expanded ? '' : transaction.id)} aria-expanded={expanded}>
                  <span className="txn-type-title"><TradeIcon size={20} />{transaction.type}</span>
                  <span className="txn-time">{transaction.time}</span>
                </button>
                <div className="txn-asset-flow">
                  <div className="txn-asset-side txn-asset-from">
                    <span className="txn-exchange"><img src={binanceLogo} alt="" /> Binance</span>
                    <strong>{transaction.fromAmount}</strong>
                    <span className="txn-subvalue">{transaction.fromCost}</span>
                  </div>
                  <AssetMark coin={transaction.fromCoin} />
                  <SwapIcon className="txn-swap-icon" variant="outlined" size={20} />
                  <AssetMark coin={transaction.toCoin} />
                  <div className="txn-asset-side txn-asset-to">
                    <span className="txn-exchange"><img src={binanceLogo} alt="" /> Binance</span>
                    <strong>{transaction.toAmount}</strong>
                    <span className="txn-subvalue">{transaction.toValue}</span>
                  </div>
                </div>
                <div className="txn-gain">{transaction.gain}</div>
                <div className="txn-fees">{transaction.fee.split('\n').map((line) => <span key={line}>{line}</span>)}</div>
                {transaction.archived ? <Badge className="txn-archived-badge" variant="label-neutral">Archived</Badge> : null}
                <Select
                  className="txn-action-select"
                  size="medium"
                  value={null}
                  check={false}
                  menuWidth="content"
                  width="40px"
                  iconRight={<MoreVertIcon size={20} />}
                  options={actions}
                  onChange={(value) => handleRowAction(transaction.id, value)}
                  aria-label={`Actions for ${transaction.id}`}
                />
              </div>

              {expanded && (
                <div className="txn-card-detail">
                  <div className="txn-detail-tabs">
                    <Tabs
                      variant="underline"
                      size="medium"
                      value={detailTab}
                      onChange={setDetailTab}
                      items={[{ value: 'details', label: 'Details' }, { value: 'analysis', label: 'Analysis' }]}
                    />
                  </div>
                  {detailTab === 'details' ? (
                    <>
                      <p className="txn-description">{transaction.description}</p>
                      <div className="txn-detail-columns">
                        <div className="txn-flow-detail">
                          <div><TradeIcon size={24} /><span><strong>Trade</strong><small>22 Aug 2022, 3:54:28 PM (IST)</small></span></div>
                          <div className="txn-flow-leg"><AssetMark coin={transaction.fromCoin} /><span><small>Binance</small><strong>{transaction.fromAmount}</strong></span></div>
                          <div className="txn-flow-leg"><AssetMark coin={transaction.toCoin} /><span><small>Binance</small><strong>{transaction.toAmount}</strong></span></div>
                          <p><BubbleIcon size={14} /> Description</p><small>{transaction.description}</small>
                          <p>Imported From</p><a href="#imported-file">binance......pot.csv <ArrowForwardIcon size={14} /></a>
                        </div>
                        <div className="txn-cost-breakdown">
                          <div><span>Purchase Price (for {transaction.fromAmount.replace('- ', '')}):</span><strong>{transaction.fromCost.replace('Cost: ', '')}</strong></div>
                          <div><span>Sale Price (per {transaction.toAmount.replace('+ ', '')}):</span><strong>{transaction.toValue.replace('≈ ', '')}</strong></div>
                          <div><span>Platform Fees:</span><strong>7.82 USDT (₹428.45)</strong></div>
                          <div><span>TDS Deducted:</span><strong>₹5,183</strong></div>
                          <div className="txn-profit-row"><span>Profit:</span><strong>{transaction.gain}</strong></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="txn-analysis-placeholder"><strong>Transaction analysis</strong><span>Cost basis and realized gain are calculated from the available transaction history.</span></div>
                  )}
                </div>
              )}
            </article>
          );
        }) : (
          <div className="txn-empty-archive">
            <ArchivedIcon size={24} />
            <strong>No archived transactions in this activity sample</strong>
            <span>Archive a transaction to see it here. You can unarchive at any time.</span>
          </div>
        )}
      </section>

      <footer className="txn-feed-footer">Showing recent activity <span>·</span> {TOTAL_TRANSACTIONS.toLocaleString('en-IN')} connected transactions, including archived</footer>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant="alert"
        title={`Archive ${pendingIds.length === 1 ? 'this transaction' : `${pendingIds.length} transactions`}?`}
        description="Archiving excludes these transactions from your tax calculations and portfolio. Your tax report numbers will change."
        confirmLabel="Archive transactions"
        cancelLabel="Go back"
        onConfirm={archivePending}
      >
        <div className="txn-dialog-note"><ArchivedIcon size={18} /><span>You can unarchive any time. Archived transactions remain in your account and still count toward billing; your portfolio recalculates automatically.</span></div>
      </Dialog>
    </main>
  );
}
