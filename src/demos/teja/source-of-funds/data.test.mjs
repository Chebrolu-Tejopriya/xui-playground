import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
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
assert.ok(csv.includes('Unresolved origin'));
assert.equal(csv.split('\r\n').filter(row=>row.startsWith('"7"')).length,3);
URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
console.log('Passed: 14 records, 7 levels, reconciled contributions, paired transfers, trace scenarios and CSV export.');
