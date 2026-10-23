import { selected, currency, INR, level, buildTrace, methodology, limitations, type Trace, type Scenario } from './data';
export function exportCsv(scenario: Scenario, trace:Trace=buildTrace(scenario)) {
  const info=trace.info;const transactions=trace.records;
  const rows: (string|number)[][] = [['KoinX Source of Funds — demonstration report'],['Selected transaction',selected.id],['Reporting currency','INR'],['Accounting context','FIFO — illustrative'],['Generated',new Date().toISOString()],['Traced percentage',info.traced],['Unresolved percentage',info.untraced],['Unresolved INR value',Number((INR*info.untraced/100).toFixed(2))],['Transactions identified',transactions.length],['Tracing levels',info.depth],['Methodology',methodology],['Limitations',limitations],[],['Level','Transaction ID','Date (UTC)','Type','Asset received','Amount received','Sent','Wallet / platform','Network','Share of selected transaction (%)','Attributed INR value','Classification','Paired transaction','Data source','Import method','Unresolved reason']];
  for(const t of transactions)rows.push([level(t.id),t.id,t.date+'Z',t.type,t.asset,t.amount,t.sent,t.wallet,t.network,t.share,Number((INR*t.share/100).toFixed(2)),trace.classification(t),t.paired||'',t.wallet,t.wallet==='CoinDCX'?'Simulated API import':'Simulated wallet import',trace.issueFor(t.id)?.reason||'']);
  rows.push([],['Selected transaction value',currency(INR)],['Warning','Attributed values repeat across levels; sum terminal sources only.']);
  const quote=(v:string|number)=>'"'+String(v).replaceAll('"','""')+'"';
  const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='KoinX-source-of-funds-'+selected.id+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function printReport(){ window.print(); }
