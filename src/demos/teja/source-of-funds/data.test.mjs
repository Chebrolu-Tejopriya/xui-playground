import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const source = await readFile(new URL('./data.ts', import.meta.url), 'utf8');
const js = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const dataUrl = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
const data = await import(dataUrl);
const { transactions, selected, byId, origins, level, summary } = data;
assert.equal(transactions.length, 14);
assert.equal(new Set(transactions.map(t => t.id)).size, 14);
assert.equal(Math.max(...transactions.map(t => level(t.id))), 7);
assert.equal(origins(selected.id).reduce((sum,t) => sum+t.share,0),100);
for (const t of transactions) {
  if (t.children.length) assert.equal(t.children.reduce((sum,id) => sum+byId[id].share,0),t.share,'Child contribution mismatch at '+t.id);
  for (const id of t.children) assert.ok(byId[id].date<t.date,'Parent must follow earlier input');
  if (t.paired) { assert.equal(byId[t.paired].paired,t.id);assert.equal(byId[t.paired].amount,t.amount); }
}
assert.deepEqual(summary('complete'),{traced:100,untraced:0,origins:3,depth:7,sources:2});
assert.equal(summary('partial').traced,60);
assert.equal(summary('partial').untraced,40);
assert.equal(summary('unmatched').traced,0);
assert.equal(summary('untraceable').traced,0);
const {buildTrace}=data;
const partial=buildTrace('partial');
assert.equal(partial.records.length,13);
assert.equal(partial.issueFor('KX-0738').kind,'import');
assert.ok(!partial.lookup['KX-0698']);
assert.equal(buildTrace('partial',new Set(['KX-0738'])).info.traced,100);
const wallet=buildTrace('unconnected');
assert.equal(wallet.info.traced,65);
assert.equal(wallet.issueFor('KX-0740').kind,'connect');
assert.equal(buildTrace('unconnected',new Set(['KX-0740'])).records.length,14);
const unmatched=buildTrace('unmatched');
assert.equal(unmatched.records.length,2);
assert.equal(unmatched.info.depth,2);
assert.equal(unmatched.lookup['KX-0838'].paired,undefined);
const matched=buildTrace('unmatched',new Set(['KX-0838']));
assert.equal(matched.lookup['KX-0838'].paired,'KX-0837');
assert.equal(matched.info.traced,100);
assert.equal(matched.records.length,14);
const mixed=buildTrace('mixed');
assert.equal(mixed.info.traced,25);
assert.equal(mixed.unresolved.length,2);
const oneRecovered=buildTrace('mixed',new Set(['KX-0740']));
assert.equal(oneRecovered.info.traced,60);
assert.equal(oneRecovered.info.untraced,40);
assert.equal(oneRecovered.unresolved.length,1);
assert.deepEqual(oneRecovered.lookup['KX-0699'],mixed.lookup['KX-0699'],'Successful branches must remain unchanged');
const allRecovered=buildTrace('mixed',new Set(['KX-0740','KX-0738']));
assert.equal(allRecovered.info.traced,100);
assert.equal(allRecovered.unresolved.length,0);
assert.equal(allRecovered.records.length,14);
assert.equal(buildTrace('untraceable',new Set(['KX-0841'])).info.traced,0,'Unsupported origins cannot be invented');
assert.deepEqual(buildTrace('partial',new Set(['irrelevant'])).info,partial.info,'Unrelated evidence cannot improve a trace');
assert.deepEqual(buildTrace('mixed').info,mixed.info,'A failed or cancelled operation leaves the dataset unchanged');
for(const trace of [partial,wallet,unmatched,matched,mixed,oneRecovered,allRecovered]) {
 assert.equal(trace.leaves(selected.id).reduce((sum,t)=>sum+t.share,0),100);
 assert.equal(trace.info.traced+trace.info.untraced,100);
 assert.equal(trace.records.length,new Set(trace.records.map(t=>t.id)).size);
 assert.equal(trace.unresolved.reduce((sum,i)=>sum+trace.lookup[i.id].share,0),trace.info.untraced);
}
// Exercise the real CSV generator with browser capabilities replaced by small stubs.
const exportSource = await readFile(new URL('./export.ts',import.meta.url),'utf8');
const exportJs = ts.transpile(exportSource,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}).replace("from './data'",'from '+JSON.stringify(dataUrl));
let savedBlob;let clicked=false;
const originalCreate=URL.createObjectURL;const originalRevoke=URL.revokeObjectURL;
globalThis.document={createElement:()=>({click(){clicked=true;}})};
URL.createObjectURL=blob=>{savedBlob=blob;return 'blob:demo';};URL.revokeObjectURL=()=>{};
const exporter=await import('data:text/javascript;base64,'+Buffer.from(exportJs).toString('base64'));
exporter.exportCsv('partial');
assert.ok(clicked);
const csv=await savedBlob.text();
assert.ok(csv.includes('Contribution to selected transaction')||csv.includes('Share of selected transaction'));
assert.ok(csv.includes('Origin not identified'));
assert.ok(csv.includes('Earlier transactions may be missing'));
assert.equal(csv.split('\r\n').filter(row=>row.startsWith('"7"')).length,2);
exporter.exportCsv('mixed',oneRecovered);
const recoveredCsv=await savedBlob.text();
assert.ok(recoveredCsv.includes('"Traced percentage","60"'));
assert.ok(recoveredCsv.includes('"Unresolved percentage","40"'));
assert.ok(recoveredCsv.includes('"KX-0700"'));
assert.ok(!recoveredCsv.includes('"KX-0698"'));
// Render the real shared report/tree against the same trace before and after recovery.
// This checks data-to-UI consistency without claiming browser interaction coverage.
const require=createRequire(import.meta.url);
const componentSource=await readFile(new URL('./components.tsx',import.meta.url),'utf8');
const componentJs=ts.transpile(componentSource,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.React})
 .replace("from './data'",'from '+JSON.stringify(dataUrl))
 .replace("from '@koinx/xui'",'from '+JSON.stringify(new URL('./dist/xui.js',pathToFileURL(require.resolve('@koinx/xui/package.json'))).href))
 .replace("from 'react'",'from '+JSON.stringify(pathToFileURL(require.resolve('react')).href));
const componentUrl='data:text/javascript;base64,'+Buffer.from('import React from '+JSON.stringify(pathToFileURL(require.resolve('react')).href)+';\n'+componentJs).toString('base64');
const components=await import(componentUrl);
const renderReport=trace=>renderToStaticMarkup(React.createElement(components.TraceContext.Provider,{value:trace},React.createElement(components.Report,{scenario:'mixed',generated:'Test date'})));
const beforeReport=renderReport(mixed);
assert.ok(beforeReport.includes('Unresolved portions'));
assert.ok(beforeReport.includes('Account not connected'));
assert.ok(beforeReport.includes('Missing transaction history'));
const afterReport=renderReport(oneRecovered);
assert.ok(!afterReport.includes('Account not connected'));
assert.ok(afterReport.includes('Missing transaction history'));
assert.ok(afterReport.includes('60%'));
assert.ok(afterReport.includes('KX-0700'));
assert.ok(!afterReport.includes('KX-0698'));
assert.ok(!renderReport(allRecovered).includes('Unresolved portions'));
const tree=renderToStaticMarkup(React.createElement(components.TraceContext.Provider,{value:mixed},React.createElement(components.Lineage,{scenario:'mixed',focus:'all',expanded:new Set(transactions.map(t=>t.id)),toggle(){},active:selected.id,onSelect(){}})));
assert.ok(tree.includes('Partially traceable'));
assert.ok(tree.includes('Origin not identified'));
assert.ok(tree.includes('Connect account'));
assert.ok(tree.includes('Import transaction history'));
assert.ok(!tree.includes('KX-0698'));
const transactionSource=await readFile(new URL('./Transactions.tsx',import.meta.url),'utf8');
const transactionJs=ts.transpile(transactionSource,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.React})
 .replace("from './data'",'from '+JSON.stringify(dataUrl))
 .replace("from './components'",'from '+JSON.stringify(componentUrl))
 .replace("from '@koinx/xui'",'from '+JSON.stringify(new URL('./dist/xui.js',pathToFileURL(require.resolve('@koinx/xui/package.json'))).href))
 .replace("from 'react'",'from '+JSON.stringify(pathToFileURL(require.resolve('react')).href))
 .replace(/import usdtLogo from [^;]+;/,"const usdtLogo='local-usdt-fixture.png';");
const transactionUI=await import('data:text/javascript;base64,'+Buffer.from('import React from '+JSON.stringify(pathToFileURL(require.resolve('react')).href)+';\n'+transactionJs).toString('base64'));
const transactionMarkup=renderToStaticMarkup(React.createElement(components.TraceContext.Provider,{value:mixed},React.createElement(transactionUI.TransactionList,{rows:[selected],scenario:'mixed',onInvestigate(){}})));
assert.ok(transactionMarkup.includes('17 Aug 2025'));
assert.ok(transactionMarkup.includes('84.903 USDT'));
assert.ok(transactionMarkup.includes('184.7878'));
assert.ok(transactionMarkup.includes('Investigate source of funds'));
assert.ok(transactionMarkup.includes('Details'));
assert.ok(transactionMarkup.includes('25% traced'));
assert.ok(transactionMarkup.includes('Cost basis / fees / TDS'));
URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
console.log('Passed: 14 records, 7 levels, reconciled attribution, all recovery paths, partial recovery, cancellation/no-op guards and synchronized CSV exports.');
