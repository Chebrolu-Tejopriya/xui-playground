export type Category = 'External deposits' | 'Staking rewards' | 'Income';
export type Scenario = 'complete' | 'partial' | 'unmatched' | 'untraceable' | 'failed' | 'unconnected' | 'mixed';
export type Transaction = { id: string; type: string; date: string; asset: string; amount: number; sent: string; wallet: string; network: string; share: number; children: string[]; category?: Category; paired?: string };
const record = (id: string, type: string, date: string, asset: string, amount: number, sent: string, wallet: string, share: number, children: string[], category?: Category, paired?: string): Transaction => ({ id, type, date, asset, amount, sent, wallet, share, children, category, paired, network: wallet === 'CoinDCX' ? 'Exchange ledger' : 'Linea' });
// Explicit attribution tree. Shares are percentages of the selected transaction,
// not percentages of a branch. Stablecoin conversions assume parity, no fees.
export const transactions: Transaction[] = [
  record('KX-0841','Swap','2025-08-17T14:32:00','REX',184.7878,'84.903 USDT','Linea wallet',100,['KX-0838']),
  record('KX-0838','Internal deposit','2025-08-16T11:04:00','USDT',84.903,'—','Linea wallet',100,['KX-0837'],undefined,'KX-0837'),
  record('KX-0837','Internal withdrawal','2025-08-16T11:02:00','USDT',84.903,'84.903 USDT','CoinDCX',100,['KX-0820','KX-0819'],undefined,'KX-0838'),
  record('KX-0820','Trade','2025-08-14T09:15:00','USDT',50.9418,'50.9418 USDC','CoinDCX',60,['KX-0790','KX-0789']),
  record('KX-0819','Trade','2025-08-13T10:10:00','USDT',33.9612,'33.9612 DAI','CoinDCX',40,['KX-0788']),
  record('KX-0790','Trade','2025-08-10T12:00:00','USDC',29.71605,'29.71605 DAI','CoinDCX',35,['KX-0740']),
  record('KX-0789','Trade','2025-08-09T12:00:00','USDC',21.22575,'21.22575 DAI','CoinDCX',25,['KX-0739']),
  record('KX-0788','Trade','2025-08-08T12:00:00','DAI',33.9612,'33.9612 USDC','CoinDCX',40,['KX-0738']),
  record('KX-0740','Trade','2025-08-05T12:00:00','DAI',29.71605,'29.71605 USDC','CoinDCX',35,['KX-0700']),
  record('KX-0739','Trade','2025-08-04T12:00:00','DAI',21.22575,'21.22575 USDT','CoinDCX',25,['KX-0699']),
  record('KX-0738','Trade','2025-08-03T12:00:00','USDC',33.9612,'33.9612 USDT','CoinDCX',40,['KX-0698']),
  record('KX-0700','External deposit','2025-08-01T08:00:00','USDC',29.71605,'—','CoinDCX',35,[],'External deposits'),
  record('KX-0699','Staking reward','2025-07-30T08:00:00','USDT',21.22575,'—','CoinDCX',25,[],'Staking rewards'),
  record('KX-0698','Income','2025-07-28T08:00:00','USDT',33.9612,'—','CoinDCX',40,[],'Income'),
];
export const byId = Object.fromEntries(transactions.map(t => [t.id,t]));
export const categories: Category[] = ['External deposits','Staking rewards','Income'];
export const selected = transactions[0];
export const INR = 3499.41;
export const currency = (n: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n);
export const date = (s: string) => new Date(s+'Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export function level(id: string, at = selected.id, depth = 1): number { if(at===id)return depth; for(const child of byId[at].children){const found=level(id,child,depth+1);if(found)return found;}return 0; }
export function origins(id: string): Transaction[] { const t=byId[id];return t.children.length?t.children.flatMap(origins):[t]; }
export function isResolved(t: Transaction, scenario: Scenario) { return scenario==='complete'||(scenario==='partial'&&t.category!=='Income'); }
export function summary(scenario: Scenario) { return buildTrace(scenario).info; }
export const methodology = 'Demonstration attribution follows explicit parent-child records backward from the selected swap. Contributions are shares of that transaction, carried across stablecoin conversions at assumed parity without fees. Repeated shares across levels represent the same funds and must not be summed. FIFO is the illustrative accounting context; this concept does not implement a production lot-selection engine. Origin labels describe imported events, not independent verification of source legitimacy. Internal transfers are paired only where the fixture supplies both records.';
export const limitations = 'Local demonstration data only. CoinDCX API and Linea wallet imports are simulated; no live wallet connection or blockchain verification is performed. External deposits are trace endpoints within the connected dataset, not proof of their pre-deposit provenance.';

export type RecoveryKind = 'connect' | 'import' | 'match' | 'unsupported';
export type TraceIssue = { id: string; kind: RecoveryKind; title: string; reason: string; action?: string };
const issues: Record<RecoveryKind, Omit<TraceIssue,'id'>> = {
  connect: { kind:'connect', title:'Account not connected', reason:"This portion may have originated from an account that isn't connected to KoinX.", action:'Connect account' },
  import: { kind:'import', title:'Missing transaction history', reason:'Earlier transactions may be missing from your imported history.', action:'Import transaction history' },
  match: { kind:'match', title:'Internal transfer not matched', reason:"We found a possible transfer, but couldn't match it to the corresponding transaction.", action:'Review transfer' },
  unsupported: { kind:'unsupported', title:'Source cannot be determined', reason:"We couldn't identify the original source from the available information." },
};
// Recovery restores only explicit edges/records from the fixture; it never invents an origin.
export function buildTrace(scenario: Scenario, recovered: ReadonlySet<string> = new Set()) {
  const missing: Record<string, RecoveryKind> = scenario==='partial'?{'KX-0738':'import'}:scenario==='unconnected'?{'KX-0740':'connect'}:scenario==='mixed'?{'KX-0740':'connect','KX-0738':'import'}:scenario==='unmatched'?{'KX-0838':'match'}:scenario==='untraceable'?{'KX-0841':'unsupported'}:{};
  const unresolved: TraceIssue[]=[];
  const records: Transaction[]=[];
  function visit(id:string) {
    const original=byId[id];const kind=missing[id];
    const blocked=Boolean(kind&&(kind==='unsupported'||!recovered.has(id)));
    if(blocked)unresolved.push({id,...issues[kind]});
    const t={...original,children:blocked?[]:[...original.children],paired:blocked&&kind==='match'?undefined:original.paired};
    records.push(t);t.children.forEach(visit);
  }
  visit(selected.id);
  const lookup=Object.fromEntries(records.map(t=>[t.id,t]));
  const leaves=(id:string):Transaction[]=>{const t=lookup[id];return t?t.children.length?t.children.flatMap(leaves):[t]:[];};
  const issueFor=(id:string)=>unresolved.find(i=>i.id===id);
  const identified=(t:Transaction)=>Boolean(t.category&&!issueFor(t.id));
  const terminals=leaves(selected.id);
  const traced=terminals.filter(identified).reduce((sum,t)=>sum+t.share,0);
  const info={traced,untraced:100-traced,origins:terminals.filter(identified).length,depth:Math.max(...records.map(t=>level(t.id))),sources:new Set(records.map(t=>t.wallet)).size};
  const classification=(t:Transaction)=>issueFor(t.id)?'Origin not identified · '+issueFor(t.id)!.title:identified(t)?'Origin · '+t.category:t.paired?'Paired internal transfer':'Intermediate transaction';
  const branchState=(id:string)=>{const ends=leaves(id);const total=ends.reduce((s,t)=>s+t.share,0);const known=ends.filter(identified).reduce((s,t)=>s+t.share,0);return known===total?'identified':known>0?'partial':'unresolved';};
  return {records,lookup,leaves,issueFor,identified,info,unresolved,classification,branchState};
}
export type Trace = ReturnType<typeof buildTrace>;
