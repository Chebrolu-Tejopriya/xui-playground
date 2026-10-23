import { useContext, useState } from 'react';
import { ArrowForwardIcon, Badge, Button, Checkbox, ChevronDownIcon, DepositIcon, SwapIcon, Tabs, WalletIcon, WithdrawIcon } from '@koinx/xui';
import usdtLogo from '../transaction-archive/usdt.png';
import { currency, date, INR, selected, type Scenario, type Transaction } from './data';
import { Status, TraceContext } from './components';

function Asset({symbol}:{symbol:string}) {
 return symbol==='USDT'?<img className="sof-txn-asset" src={usdtLogo} width={40} height={40} alt="USDT"/>:<span className="sof-txn-asset sof-txn-monogram" aria-label={symbol}>{symbol.slice(0,3)}</span>;
}
export function TransactionFlow({transaction:t}:{transaction:Transaction}) {
 const trace=useContext(TraceContext);
 const withdrawal=t.type.toLowerCase().includes('withdrawal');
 const external=!t.children.length&&t.sent==='—';
 const fromSymbol=t.sent==='—'?'':t.sent.split(' ').at(-1)!;
 const fromWallet=t.type==='Internal deposit'?(t.paired&&trace.lookup[t.paired]?trace.lookup[t.paired].wallet:'Sender not identified'):external?'External account':t.wallet;
 const fromAmount=t.sent==='—'?(t.type==='Internal deposit'?t.amount+' '+t.asset:'Source account unavailable'):'− '+t.sent;
 const toWallet=withdrawal?(t.paired&&trace.lookup[t.paired]?trace.lookup[t.paired].wallet:'Destination not identified'):t.wallet;
 return <div className="sof-txn-flow"><div className="sof-txn-leg sof-txn-sent"><div><small><WalletIcon size={14}/>{fromWallet}</small><strong>{fromAmount}</strong><span>{t.id===selected.id?'Exchanged':'Earlier funding record'}</span></div>{fromSymbol?<Asset symbol={fromSymbol}/>:<span className="sof-txn-asset sof-txn-monogram"><WalletIcon size={22}/></span>}</div><ArrowForwardIcon size={20}/><div className="sof-txn-leg sof-txn-received">{withdrawal?<span className="sof-txn-asset sof-txn-monogram"><WalletIcon size={22}/></span>:<Asset symbol={t.asset}/>}<div><small><WalletIcon size={14}/>{toWallet}</small><strong>{withdrawal?'':' + '}{t.amount} {t.asset}</strong><span>{t.id===selected.id?'≈ '+currency(INR):'Attributed: '+currency(INR*t.share/100)}</span></div></div></div>;
}
export function TransactionList({rows,scenario,onInvestigate}:{rows:Transaction[];scenario:Scenario;onInvestigate:(id:string)=>void}) {
 const trace=useContext(TraceContext);
 const [expanded,setExpanded]=useState<string|null>(selected.id);
 const [tab,setTab]=useState('details');
 const [checked,setChecked]=useState<Set<string>>(()=>new Set());
 const groups=new Map<string,Transaction[]>();for(const t of rows){const day=t.date.slice(0,10);groups.set(day,[...(groups.get(day)??[]),t]);}
 const selectedCount=rows.filter(t=>checked.has(t.id)).length;
 return <div className="sof-txn-groups">{selectedCount>0&&<div className="sof-txn-selection"><strong>{selectedCount} transaction{selectedCount===1?'':'s'} selected</strong><span>Selection for review · no records changed</span><Button size="small" variant="outline" onClick={()=>setChecked(new Set())}>Clear selection</Button></div>}{Array.from(groups,([day,items])=><section className="sof-txn-group" key={day} aria-label={'Transactions on '+date(items[0].date)}><h3>{date(items[0].date)}</h3>{items.map(t=>{
 const open=expanded===t.id;const Icon=t.type.toLowerCase().includes('withdrawal')?WithdrawIcon:t.type.toLowerCase().includes('deposit')?DepositIcon:SwapIcon;
 const issue=trace.issueFor(t.id);const isRoot=t.id===selected.id;
 return <article className={'sof-txn-row '+(checked.has(t.id)?'is-checked':'')} key={t.id}><div className="sof-txn-summary"><Checkbox aria-label={'Select '+t.id} checked={checked.has(t.id)} onChange={()=>setChecked(prev=>{const next=new Set(prev);if(next.has(t.id))next.delete(t.id);else next.add(t.id);return next;})}/><button className="sof-txn-type" onClick={()=>{setExpanded(open?null:t.id);setTab('details');}} aria-expanded={open}><span><Icon size={24}/><strong>{t.type}</strong></span><time dateTime={t.date+'Z'}>{t.date.slice(11)} UTC</time></button><TransactionFlow transaction={t}/><div className="sof-txn-status">{isRoot?<Status scenario={scenario}/>:issue?<Badge variant="label-warning">Origin not identified</Badge>:<Badge variant="label-neutral">Imported record</Badge>}<small>{isRoot?trace.info.traced+'% traced':'Part of '+selected.id}</small></div><div className="sof-txn-end"><small>{t.id}</small><small>Fees / TDS: unavailable</small><Button size="small" iconOnly aria-label={(open?'Collapse ':'Expand ')+t.id} aria-expanded={open} onClick={()=>{setExpanded(open?null:t.id);setTab('details');}}><ChevronDownIcon style={{transform:open?'rotate(180deg)':undefined}} size={18}/></Button></div></div>
 {open&&<div className="sof-txn-expanded"><Tabs variant="underline" size="medium" value={tab} onChange={setTab} items={[{value:'details',label:'Details'},{value:'analysis',label:'Analysis'}]}/>{tab==='details'?<><p>{isRoot?'You exchanged 84.903 USDT for 184.7878 REX on Linea, worth '+currency(INR)+'.':t.type+' of '+t.amount+' '+t.asset+' in the imported '+t.wallet+' records.'} This is local demonstration data; no live blockchain verification is performed.</p><dl><div><dt>Transaction ID</dt><dd>{t.id}</dd></div><div><dt>Network</dt><dd>{t.network}</dd></div><div><dt>Imported from</dt><dd>{t.wallet} · simulated import</dd></div><div><dt>Cost basis / fees / TDS</dt><dd>Unavailable in this sample</dd></div></dl></>:<><p>{isRoot?trace.info.traced+'% of this transaction is traced to '+trace.info.origins+' origin events across '+trace.info.depth+' levels. '+trace.info.untraced+'% remains unresolved.':'This record contributes '+t.share+'% of the selected swap. Its attributed value is '+currency(INR*t.share/100)+', not a historical market valuation.'}</p><p>Contributions repeat across levels and must not be added together. Missing history does not imply suspicious activity.</p></>}<div className="sof-txn-cta"><div><strong>Source of Funds</strong><p>{isRoot?'Trace this swap back through its funding history.':'This transaction is available as supporting evidence within the REX swap investigation.'}</p></div><Button variant={isRoot?'primary':'outline'} iconRight={<ArrowForwardIcon/>} onClick={()=>onInvestigate(t.id)}>{isRoot?'Investigate source of funds':'Why unavailable as a starting transaction?'}</Button></div></div>}
 </article>;
 })}</section>)}</div>;
}
