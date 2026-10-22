import { transactions, selected, currency, INR, level, summary, isResolved, methodology, limitations, type Scenario } from './data';
export function exportCsv(scenario: Scenario) {
  const info=summary(scenario);
  const rows: (string|number)[][] = [['KoinX Source of Funds — demonstration report'],['Selected transaction',selected.id],['Reporting currency','INR'],['Accounting context','FIFO — illustrative'],['Generated',new Date().toISOString()],['Traced percentage',info.traced],['Methodology',methodology],['Limitations',limitations],[],['Level','Transaction ID','Date (UTC)','Type','Asset received','Amount received','Sent','Wallet / platform','Network','Share of selected transaction (%)','Attributed INR value','Classification','Paired transaction','Data source','Import method']];
  for(const t of transactions)rows.push([level(t.id),t.id,t.date+'Z',t.type,t.asset,t.amount,t.sent,t.wallet,t.network,t.share,Number((INR*t.share/100).toFixed(2)),t.category?(isResolved(t,scenario)?t.category:'Unresolved origin'):t.type,t.paired||'',t.wallet,t.wallet==='CoinDCX'?'Simulated API import':'Simulated wallet import']);
  rows.push([],['Selected transaction value',currency(INR)],['Warning','Attributed values repeat across levels; sum terminal sources only.']);
  const quote=(v:string|number)=>'"'+String(v).replaceAll('"','""')+'"';
  const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='KoinX-source-of-funds-'+selected.id+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function printReport(){ window.print(); }
