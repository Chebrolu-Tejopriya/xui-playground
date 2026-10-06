import { useState } from 'react';
import {
  AddIntegrationIcon,
  ArrowBackwardIcon,
  ArrowForwardIcon,
  Badge,
  Button,
  DownloadIcon,
  EditIcon,
  SyncIcon,
  Tabs,
  UnlinkIcon,
} from '@koinx/xui';
import binanceLogo from '../transaction-archive/binance-logo.png';
import './styles.css';

const ARCHIVED_COUNT_KEY = 'koinx-transaction-archive-count';

function getArchivedCount() {
  const stored = Number(window.localStorage.getItem(ARCHIVED_COUNT_KEY));
  return Number.isFinite(stored) && stored >= 0 ? stored : 14;
}

function navigateToTransactions() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  window.location.assign(`?demo=teja/transaction-archive&theme=${theme}`);
}

export default function IntegrationDetail() {
  const [archivedCount, setArchivedCount] = useState(getArchivedCount);
  const [tab, setTab] = useState('overview');
  const [lastSynced, setLastSynced] = useState('14 days ago');

  function syncNow() {
    setLastSynced('Just now');
    setArchivedCount(getArchivedCount());
  }

  const chartBars = [
    { label: 'Deposits', value: '86%', className: 'int-bar-deposit' },
    { label: 'Withdrawals', value: '68%', className: 'int-bar-withdraw' },
    { label: 'Trades', value: '70%', className: 'int-bar-trade' },
    { label: 'Transfers', value: '34%', className: 'int-bar-transfer' },
  ];

  return (
    <main className="int-page">
      <header className="int-page-header">
        <Button variant="link" iconLeft={<ArrowBackwardIcon />} onClick={navigateToTransactions}>Integrations</Button>
      </header>

      <section className="int-connection-card" aria-label="Binance integration details">
        <div className="int-connection-actions">
          <Button variant="link" size="small" iconOnly aria-label="Edit integration"><EditIcon size={20} /></Button>
          <Button variant="link" size="small" iconOnly aria-label="Disconnect integration"><UnlinkIcon size={20} /></Button>
        </div>
        <div className="int-connection-main">
          <div className="int-connection-heading">
            <img src={binanceLogo} alt="Binance" />
            <div><h1>Binance</h1><Badge variant="label-neutral">API Key</Badge></div>
          </div>

          <div className="int-stats-panel">
            <div className="int-stat int-stat-transactions">
              <span>Transactions</span>
              <div className="int-stat-number-row"><strong>2,983</strong><span>{archivedCount} archived</span></div>
            </div>
            <div className="int-stat"><span>Last Synced</span><strong>{lastSynced}</strong></div>
            <div className="int-stat"><span>Last Transaction</span><strong>2 months ago</strong></div>
          </div>
          <p className="int-billing-note">All 2,983 connected transactions count toward billing, including archived transactions.</p>

          <div className="int-connection-buttons">
            <Button iconRight={<ArrowForwardIcon size={18} />} onClick={navigateToTransactions}>View Transactions</Button>
            <Button variant="outline" iconRight={<SyncIcon size={18} />} onClick={syncNow}>Sync Now</Button>
            <Button variant="outline" iconRight={<DownloadIcon size={18} />}>Import Data From File</Button>
          </div>
        </div>
      </section>

      <section className="int-overview" aria-label="Integration overview">
        <Tabs
          className="int-tabs"
          variant="underline"
          size="large"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'history', label: 'Sync History' },
            { value: 'settings', label: 'Settings' },
          ]}
        />

        {tab === 'overview' ? (
          <div className="int-overview-grid">
            <section className="int-health-card">
              <h2>Health Score <span className="int-info-mark">i</span></h2>
              <div className="int-health-body">
                <div className="int-health-gauge"><div><strong>82</strong></div></div>
                <div className="int-health-metrics">
                  {[
                    ['Data Quality', '26/40', '65%', 'warning'],
                    ['Reliability', '20/20', '100%', 'success'],
                    ['Sync Freshness', '10/10', '100%', 'success'],
                    ['Recency', '10/10', '100%', 'success'],
                    ['Uniqueness', '16/20', '80%', 'warning'],
                  ].map(([label, score, width, tone]) => <div className="int-health-metric" key={label}>
                    <span>{label}<span className="int-info-mark">i</span></span>
                    <div className="int-health-track"><div className={`int-health-fill is-${tone}`} style={{ width }} /></div>
                    <strong>{score}</strong>
                  </div>)}
                </div>
              </div>
            </section>

            <section className="int-chart-card">
              <header><h2>Transactions</h2><strong>2,983</strong></header>
              <div className="int-chart-area">
                <div className="int-chart-ylabels"><span>1500</span><span>1200</span><span>900</span><span>600</span><span>300</span></div>
                <div className="int-chart-plot">
                  <div className="int-chart-gridlines"><i /><i /><i /><i /><i /></div>
                  <div className="int-chart-bars">{chartBars.map((bar) => <div className="int-chart-bar-wrap" key={bar.label}>
                    <div className={`int-chart-bar ${bar.className}`} style={{ height: bar.value }} />
                    <span>{bar.label}</span>
                  </div>)}</div>
                </div>
              </div>
            </section>
          </div>
        ) : tab === 'history' ? (
          <section className="int-tab-panel"><SyncIcon size={22} /><strong>Sync History</strong><span>Last successful sync: {lastSynced}</span></section>
        ) : (
          <section className="int-tab-panel"><AddIntegrationIcon size={22} /><strong>Integration settings</strong><span>Manage the API connection and sync preferences for Binance.</span></section>
        )}
      </section>
    </main>
  );
}
