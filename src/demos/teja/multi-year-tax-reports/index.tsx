import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Dialog, Drawer, Input, Radio, Select, Tabs, ArrowForwardIcon, CheckIcon, InfoIcon, PercentageIcon } from '@koinx/xui';
import './styles.css';

// Illustrative service fixture only. Production must supply plans, caps, discounts,
// current-year adjustments, savings basis and payable through the existing quote API.
const fixture = { base: 14999, cap: 1000, transactions: 435, xp: 1000, coupon: 2000, extra: 2500, discounts: [0, 0, 20, 30] };
const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
type Quote = { term: number; year: number; future: number; current: number; coupon: number; xp: number; extra: number; total: number; savings: number };
function quote(term: number, year: number, coupon: boolean, xp: boolean, extra: boolean): Quote {
  const future = Math.round(fixture.base * (100 - fixture.discounts[term]) / 100);
  const adjustment = { coupon: coupon ? fixture.coupon : 0, xp: xp ? fixture.xp : 0, extra: extra ? fixture.extra : 0 };
  const current = fixture.base + adjustment.extra - adjustment.coupon - adjustment.xp;
  return { term, year, future, current, ...adjustment, total: current + (term - 1) * future, savings: (term - 1) * (fixture.base - future) };
}
const scenarios = [ ['eligible', 'Eligible user'], ['ineligible', 'Outside experiment'], ['conflict', 'Final future year already covered'], ['pricing-error', 'Pricing unavailable'], ['payment-error', 'Payment fails'], ['price-change', 'Price changes at checkout'], ['pending', 'Payment received · coverage pending'] ].map(([value, label]) => ({ value, label }));
export default function MultiYearTaxReports({ mobile = false }: { mobile?: boolean }) {
  const [savingsOpen, setSavingsOpen] = useState(false);
  const savingsAfterQuote = useRef<number | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellTerm, setUpsellTerm] = useState(2);
  const continueAfterQuote = useRef(false);
  const upsellSeen = useRef(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [version, setVersion] = useState('v3');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(2025);
  const [scenario, setScenario] = useState('eligible');
  const [xp, setXp] = useState(false);
  const [extra, setExtra] = useState(false);
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [pricing, setPricing] = useState<'loading' | 'ready' | 'error'>('loading');
  const [accepted, setAccepted] = useState<Quote | null>(null);
  const [checkout, setCheckout] = useState<'idle' | 'submitting' | 'failed' | 'pending' | 'success'>('idle');
  const [confirm, setConfirm] = useState(false);
  const [revised, setRevised] = useState(false);
  const [retry, setRetry] = useState(0);
  const couponRequest = useRef(0);
  const checkoutRequest = useRef(0);
  const eligible = scenario !== 'ineligible';
  const busy = checkout === 'submitting' || checkout === 'pending';
  useEffect(() => {
    setPricing('loading'); setAccepted(null); setCheckout('idle'); setRevised(false);
    const timer = window.setTimeout(() => {
      if (scenario === 'pricing-error') { setPricing('error'); return; }
      setAccepted(quote(term, year, coupon, xp, extra)); setPricing('ready');
    }, 450);
    return () => window.clearTimeout(timer);
  }, [term, year, coupon, xp, extra, scenario, retry]);
  useEffect(() => () => { couponRequest.current++; checkoutRequest.current++; }, []);
  function selectTerm(next: number) {
    if (next === term) return;
    setSavingsOpen(false);
    savingsAfterQuote.current = next > 1 ? next : null;
    setTerm(next);
  }
  useEffect(() => {
    if (savingsAfterQuote.current !== null && pricing === 'ready' && accepted?.term === savingsAfterQuote.current && accepted.term === term) {
      savingsAfterQuote.current = null;
      setSavingsOpen(true);
    }
    if (pricing === 'error') savingsAfterQuote.current = null;
  }, [accepted, pricing, term]);
  function changeScenario(value: string) {
    setSavingsOpen(false); savingsAfterQuote.current = null;
    setScenario(value); setCheckout('idle'); setConfirm(false); setUpsellOpen(false); continueAfterQuote.current = false; upsellSeen.current = false;
    if (value === 'ineligible' || (value === 'conflict' && term === 3)) setTerm(1);
  }
  async function applyCoupon() {
    const id = ++couponRequest.current; const submitted = code.trim();
    setCouponBusy(true); setCouponError('');
    await new Promise(resolve => window.setTimeout(resolve, 500));
    if (id !== couponRequest.current) return;
    if (submitted.toUpperCase() === 'SAVE20') setCoupon(true);
    else setCouponError(submitted.toUpperCase() === 'EXPIRED' ? 'This coupon has expired. Try another code.' : 'This code is not valid. Try SAVE20 in this demo.');
    setCouponBusy(false);
  }
  async function purchase(skipUpsell = false) {
    if (!accepted || pricing !== 'ready' || busy || couponBusy) return;
    if (term === 1 && eligible && !skipUpsell && !upsellSeen.current) { setUpsellTerm(2); setUpsellOpen(true); return; }
    if (scenario === 'price-change' && !revised) { setConfirm(true); return; }
    const id = ++checkoutRequest.current; setCheckout('submitting');
    await new Promise(resolve => window.setTimeout(resolve, 850));
    if (id !== checkoutRequest.current) return;
    setCheckout(scenario === 'payment-error' ? 'failed' : scenario === 'pending' ? 'pending' : 'success');
  }
  const payable = accepted ? accepted.total + (revised ? 100 : 0) : 0;
  const years = Array.from({ length: term }, (_, i) => year + i);
  const controlsDisabled = busy || couponBusy;
  useEffect(() => {
    if (continueAfterQuote.current && pricing === 'ready' && accepted?.term === term) {
      continueAfterQuote.current = false;
      void purchase(true);
    }
  }, [accepted, pricing, term]);
  function acceptUpsell() {
    upsellSeen.current = true;
    continueAfterQuote.current = true;
    setUpsellOpen(false);
    setTerm(upsellTerm);
  }
  function declineUpsell() {
    upsellSeen.current = true;
    setUpsellOpen(false);
    void purchase(true);
  }
  const upsellQuote = quote(upsellTerm, year, coupon, xp, extra);
  const upsellContent = <div className="mytax-upsell">
    <fieldset disabled={busy || couponBusy}><legend className="mytax-sr">Add future tax years</legend>{[2,3].filter(n=>scenario!=='conflict'||n!==3).map(n=>{
      const offer = quote(n,year,coupon,xp,extra);
      return <div key={n} className={'mytax-upsell-option '+(upsellTerm===n?'is-selected':'')}><Radio name="upsell-term" checked={upsellTerm===n} onChange={()=>setUpsellTerm(n)} label={<span><strong>{n===2?'Add FY '+(year+1):'Add FY '+(year+1)+' and FY '+(year+2)}</strong><small>{fixture.discounts[n]}% off {n===2?'the future year':'both future years'}</small></span>} /><div className="mytax-upsell-amount"><strong>+{money(offer.total-offer.current)}</strong><span>New total {money(offer.total+(revised?100:0))}</span></div><Badge variant="label-positive">Save {money(offer.savings)}{n===3?' · Largest savings':''}</Badge></div>;
    })}</fieldset><p>Each future year includes up to {fixture.cap.toLocaleString()} transactions. Future extra transactions are separate. Coupons and XP apply to FY {year} only.</p><p>One payment. No automatic annual charges. Totals before taxes.</p>{mobile&&<div className="mytax-upsell-actions"><Button fullWidth onClick={acceptUpsell}>Get {upsellTerm} years · {money(upsellQuote.total+(revised?100:0))}</Button><Button fullWidth variant="outline" onClick={declineUpsell}>Continue with 1 year · {money(payable)}</Button></div>}
  </div>;
  return <div className={"mytax " + (mobile ? "mytax-mobile " : "") + (version === "v2" ? "mytax-v2" : version === "v3" ? "mytax-v3" : "")}>
    <div className="mytax-version"><span>Explore layouts</span><Tabs size="medium" value={version} onChange={setVersion} disabled={busy} items={[{value: "v1", label: mobile ? "V1" : "V1 · Detailed"}, {value: "v2", label: mobile ? "V2" : "V2 · Compare plans"}, {value: "v3", label: mobile ? "V3" : "V3 · Compact checkout"}]} /></div>
    <details className="mytax-demo"><summary>Prototype controls <span>Illustrative USD pricing · no real payment</span></summary><div className="mytax-controls"><label>Preview scenario<Select options={scenarios} value={scenario} onChange={changeScenario} disabled={busy || couponBusy} /></label><Checkbox label="Current-year extra transactions (+$25)" checked={extra} disabled={controlsDisabled} onChange={e => setExtra(e.target.checked)} /><p>Demo future plan: Crypto Tax Report, 1,000 transactions per year. Plan selection, locking and upgrade policies are not configured.</p></div></details>
    <header className="mytax-header"><div><p className="mytax-eyebrow">TAX REPORTS</p><h1>Crypto Tax Reports</h1><p>Your filing this year. A head start on the next.</p></div><label className="mytax-year">Tax year<Select value={String(year)} options={[2024, 2025, 2026].map(y => ({ value: String(y), label: 'FY ' + y }))} onChange={v => setYear(Number(v))} disabled={controlsDisabled || checkout === 'success'} width="140px" /></label></header>
    {checkout === 'success' ? <section className="mytax-success" aria-live="polite"><div className="mytax-success-icon"><CheckIcon size={32} /></div><Badge variant="label-positive">Payment confirmed · demo</Badge><h2>You’re covered through FY {year + term - 1}</h2><p>{money(payable)} paid once for {term === 1 ? 'your report' : term + ' tax years'}. No automatic annual charges.</p><div className="mytax-years">{years.map((y, i) => <article className="mytax-year-card" key={y}><h3>FY {y}</h3><Badge variant="accent-primary">{i ? 'Prepaid' : 'Purchased'}</Badge><p>Crypto Tax Report</p><p>Up to {fixture.cap.toLocaleString()} transactions</p><strong>{money(i ? accepted!.future : accepted!.current)}</strong></article>)}</div><p>Return in each covered year to generate your report. Future extra capacity is separate.</p><div className="mytax-actions"><Button variant="outline" onClick={() => { upsellSeen.current = false; setCheckout('idle'); setTerm(1); setCoupon(false); setCode(''); setRetry(v => v + 1); }}>Restart preview</Button><span>Demo order KX-PREVIEW · payment and coverage simulated</span></div></section> : <div className="mytax-layout"><main className="mytax-main">
      {eligible && version === 'v2' && <section className="mytax-comparison"><div className="mytax-comparison-heading"><p className="mytax-eyebrow">CHOOSE YOUR COVERAGE</p><h2>One report now. Save on the years ahead.</h2><p>Choose how many tax years to pay for today. No annual auto-charges.</p></div><fieldset className="mytax-plan-cards" disabled={controlsDisabled}><legend className="mytax-sr">Choose covered tax years</legend>{[1, 2, 3].filter(n => scenario !== 'conflict' || n !== 3).map(n => {
        const preview = quote(n, year, coupon, xp, extra);
        const ready = pricing === 'ready';
        return <article className={'mytax-plan-card ' + (n === term ? 'is-selected ' : '') + (n === 3 ? 'best-value' : '')} key={n}>
          <div className="mytax-card-top"><Radio name="tax-term-v2" checked={term === n} onChange={() => selectTerm(n)} label={<strong>{n} {n === 1 ? 'year' : 'years'}</strong>} />{n === 3 && <Badge variant="label-positive">Largest savings</Badge>}</div>
          <p className="mytax-card-years">{Array.from({length:n}, (_,i) => 'FY ' + (year+i)).join(' + ')}</p>
          <div className="mytax-card-price">{ready ? money(preview.total + (n === term && revised ? 100 : 0)) : 'Updating…'}<span>paid once · before taxes</span></div>
          <div className="mytax-card-benefit">{n > 1 ? <><strong>{ready ? 'Save ' + money(preview.savings) : 'Calculating savings…'}</strong><span>{fixture.discounts[n]}% off each future year</span></> : <><strong>This year only</strong><span>Get your current tax report</span></>}</div>
          <div className="mytax-card-breakdown"><div><span>FY {year}</span><strong>{ready ? money(preview.current) : '—'}</strong></div>{Array.from({length:n-1},(_,i)=><div key={i}><span>FY {year+i+1}</span><strong>{ready ? money(preview.future) : '—'}</strong></div>)}</div>
          <p className="mytax-card-cap">{n > 1 ? 'Each future year includes up to ' + fixture.cap.toLocaleString() + ' transactions.' : 'Covers your current-year transactions.'}</p>
          <Button fullWidth variant={term === n ? 'primary' : 'outline'} disabled={controlsDisabled} onClick={() => selectTerm(n)}>{term === n ? 'Selected · ' : 'Choose '}{n} {n === 1 ? 'year' : 'years'}</Button>
        </article>;
      })}</fieldset><p className="mytax-note"><InfoIcon size={18} />Future-year extra transactions are charged separately when needed.</p>{scenario === 'conflict' && <p className="mytax-note">FY {year + 2} already has a plan. A 3-year purchase is unavailable.</p>}</section>}
      {eligible && version === 'v3' && <section className="mytax-compact-choice"><div className="mytax-section-heading"><h2>Choose your coverage</h2><span>Pay once · no auto-renewal</span></div><fieldset className="mytax-compact-terms" disabled={controlsDisabled}><legend className="mytax-sr">Plan term</legend>{[1,2,3].filter(n=>scenario !== 'conflict' || n !== 3).map(n=>{
        const preview=quote(n,year,coupon,xp,extra);
        return <div className={'mytax-compact-option '+(term===n?'is-selected':'')} key={n}><Radio name="tax-term-v3" checked={term===n} onChange={()=>selectTerm(n)} label={<span className="mytax-compact-label"><strong>{n} {n===1?'year':'years'}</strong><span>{pricing==='ready'?money(preview.total+(n===term&&revised?100:0)):'Updating…'}</span>{n>1?<Badge variant="label-positive">{pricing==='ready'?'Save '+money(preview.savings):'Updating…'}</Badge>:<span className="mytax-compact-single">This year only</span>}</span>} /></div>;
      })}</fieldset><p className="mytax-note">Totals before taxes. {term>1?fixture.discounts[term]+'% off future-year base prices.':'Add future years to save on your next reports.'}</p>{scenario==='conflict'&&<p className="mytax-note">FY {year+2} already has a plan. A 3-year purchase is unavailable.</p>}</section>}
      {version==='v3'&&<section className="mytax-compact-coverage" aria-label="Selected coverage"><div className="mytax-section-heading"><h3>{term===1?'Your selected tax year':'Your selected tax years'}</h3><Badge variant="accent-primary">{term} {term===1?'year':'years'}</Badge></div><div className="mytax-coverage-strip">{years.map((y,i)=><div key={y}><strong>FY {y}</strong><span>{i?'Future report':'Current report'}</span><strong>{pricing==='ready'&&accepted?money(i?accepted.future:accepted.current):'Updating…'}</strong></div>)}</div>{term>1&&<p className="mytax-note">Each future year includes up to {fixture.cap.toLocaleString()} transactions. Extra transactions are separate.</p>}</section>}
      {eligible && version === 'v1' && <section><div className="mytax-section-heading"><h2>Choose your plan term</h2><span>One payment. More years sorted.</span></div><fieldset className="mytax-terms" disabled={controlsDisabled}><legend className="mytax-sr">Plan term</legend>{[1, 2, 3].filter(n => scenario !== 'conflict' || n !== 3).map(n => <div className={'mytax-term ' + (term === n ? 'is-selected' : '')} key={n}><Radio name="tax-term" checked={term === n} onChange={() => selectTerm(n)} label={<span className="mytax-term-label"><strong>{n} {n === 1 ? 'year' : 'years'}</strong>{n > 1 && <Badge variant="label-positive">{fixture.discounts[n]}% off future years</Badge>}</span>} /></div>)}</fieldset>{scenario === 'conflict' && <p className="mytax-note">FY {year + 2} already has a plan. A 3-year purchase is unavailable.</p>}</section>}
      {term > 1 && version === 'v1' && <section className="mytax-panel mytax-coverage"><div className="mytax-section-heading"><h2>Included through FY {year + term - 1}</h2><Badge variant="accent-primary">{term} tax years</Badge></div><div className="mytax-years">{years.map((y, i) => <article key={y} className="mytax-year-card"><p className="mytax-eyebrow">{i ? 'FUTURE YEAR' : 'CURRENT REPORT'}</p><h3>FY {y}</h3><p>{i ? 'Included in this purchase' : 'Filing this year'}</p><strong>{pricing === 'ready' && accepted ? money(i ? accepted.future : accepted.current) : 'Updating…'}</strong>{i > 0 && <p>{fixture.discounts[term]}% off · up to {fixture.cap.toLocaleString()} transactions</p>}</article>)}</div><p className="mytax-note"><InfoIcon size={18} />Each year has its own transaction cap. Future extra-transaction charges are not prepaid.</p></section>}
      <section className="mytax-report"><div><p className="mytax-eyebrow">CURRENT-YEAR REPORT</p><h2>Crypto Tax Report</h2><p>Covers {extra ? '1,200' : fixture.transactions} transactions · FY {year}</p></div><div className="mytax-report-price">{money(fixture.base)}<span>Base report price</span></div></section>
      <section className="mytax-panel"><h3>What’s included in your report</h3><div className="mytax-features">{['IRS Schedule D & Form 8949', 'TurboTax upload', 'Tax & PnL reports', 'PDF, CSV & Excel downloads'].map(label => <div key={label}><CheckIcon size={18} /><span>{label}</span></div>)}</div></section>
      {!mobile && version !== 'v3' && <section className="mytax-panel mytax-xp"><div><h3>Use your XP</h3><p>Apply {money(fixture.xp)} to the current-year report only.</p></div><Checkbox label="Use 100 XP" checked={xp} disabled={controlsDisabled} onChange={e => setXp(e.target.checked)} /></section>}
      <div className="mytax-disclosure"><InfoIcon size={20} /><p>Pay once for your selected years. No automatic annual charges. Return in each covered year to generate your report.</p></div>
    </main><aside className="mytax-summary" aria-label="Order summary"><div className="mytax-section-heading"><h2>Order summary</h2><Badge variant="accent-primary">{term}-year term</Badge></div><div aria-live="polite" aria-busy={pricing === 'loading'}>{pricing === 'loading' ? <div className="mytax-loading">Updating your quote…<div /><div /><div /></div> : pricing === 'error' ? <div className="mytax-error"><h3>We couldn’t load pricing</h3><p>Your selection is saved. Retry or preview the single-year checkout.</p><Button variant="outline" onClick={() => { setScenario('eligible'); setRetry(v => v + 1); }}>Retry pricing</Button></div> : accepted && <div className="mytax-lines"><div><span>FY {year} Tax Report</span><strong>{money(fixture.base)}</strong></div>{accepted.extra > 0 && <div><span>Extra transactions · FY {year}</span><strong>{money(accepted.extra)}</strong></div>}{years.slice(1).map(y => <div key={y}><span>FY {y} prepayment<small>{fixture.discounts[term]}% off future-year base price</small></span><strong>{money(accepted.future)}</strong></div>)}{accepted.coupon > 0 && <div className="positive"><span>Coupon · FY {year} only</span><strong>−{money(accepted.coupon)}</strong></div>}{accepted.xp > 0 && <div className="positive"><span>XP · FY {year} only</span><strong>−{money(accepted.xp)}</strong></div>}{revised && <div><span>Updated quote adjustment · demo</span><strong>{money(100)}</strong></div>}</div>}</div>
      {(mobile || version==='v3')&&<div className="mytax-summary-xp"><Checkbox label="Use 100 XP" checked={xp} disabled={controlsDisabled} onChange={e=>setXp(e.target.checked)} /><span>Save {money(fixture.xp)} on FY {year}</span></div>}
      <div className="mytax-coupon"><Input label="Apply coupon" placeholder="Enter promo code" value={code} disabled={controlsDisabled || coupon} onChange={e => { setCode(e.target.value); setCouponError(''); }} error={Boolean(couponError)} helperText={couponError || (coupon ? 'SAVE20 applied to the current year only.' : 'Try SAVE20 in this preview.')} trailing={<Button size="small" variant="outline" loading={couponBusy} disabled={busy || (!coupon && !code.trim())} onClick={coupon ? () => { setCoupon(false); setCouponError(''); } : applyCoupon}>{coupon ? 'Remove' : 'Apply'}</Button>} /><p>Coupons and XP reduce the current year only.</p></div>
      {accepted && pricing === 'ready' && <>{term > 1 && <div className="mytax-saving"><span>Future-year savings</span><strong>{money(accepted.savings)}</strong></div>}<div className="mytax-total"><div><h3>Pay today</h3><span>Before applicable taxes</span></div><strong>{money(payable)}</strong></div><p className="mytax-note">One payment for {term === 1 ? '1 year' : term + ' years'}. Taxes confirmed at payment.</p></>}
      {checkout === 'failed' && <p className="mytax-error" role="alert">Payment failed in this preview. Your selection is saved; you can retry.</p>}{checkout === 'pending' && <div className="mytax-error" role="status"><h3>Payment received</h3><p>We’re confirming your covered years. Please don’t pay again.</p><Button variant="outline" onClick={() => setCheckout('success')}>Simulate coverage confirmation</Button></div>}
      <Button fullWidth loading={checkout === 'submitting'} disabled={pricing !== 'ready' || couponBusy || checkout === 'pending'} iconRight={<ArrowForwardIcon />} onClick={() => void purchase()}>{checkout === 'failed' ? 'Retry payment' : term === 1 ? 'Get my report' : 'Get ' + term + ' years'}{accepted && pricing === 'ready' ? ' · ' + money(payable) : ''}</Button><p className="mytax-summary-footer">Preview only · no payment will be collected</p>
    </aside></div>}
    {mobile && checkout!=='success' && <>
      <div className="mytax-mobile-bar"><div><Button size="small" variant="outline" onClick={()=>setBreakdownOpen(true)} disabled={!accepted || pricing!=='ready'} aria-label="View price breakdown" iconRight={<InfoIcon size={16} />}>{accepted&&pricing==='ready'?money(payable):'Updating…'}</Button><span>Before taxes · paid once</span></div><Button loading={checkout==='submitting'} disabled={pricing!=='ready'||couponBusy||checkout==='pending'} onClick={() => void purchase()}>{term===1?'Get report':'Get '+term+' years'}</Button></div>
      <Drawer open={breakdownOpen} onClose={()=>setBreakdownOpen(false)} placement="bottom" title="Price breakdown" footer={<Button fullWidth loading={checkout==='submitting'} disabled={pricing!=='ready'||couponBusy||checkout==='pending'} onClick={()=>{setBreakdownOpen(false);void purchase();}}>Get {term===1?'my report':term+' years'}{accepted&&pricing==='ready'?' · '+money(payable):''}</Button>}>
        {accepted&&pricing==='ready'?<div className="mytax-lines mytax-mobile-breakdown"><div><span>FY {year} report</span><strong>{money(fixture.base)}</strong></div>{accepted.extra>0&&<div><span>Extra transactions · FY {year}</span><strong>{money(accepted.extra)}</strong></div>}{years.slice(1).map(y=><div key={y}><span>FY {y} prepayment<small>{fixture.discounts[term]}% off · {fixture.cap.toLocaleString()} transactions</small></span><strong>{money(accepted.future)}</strong></div>)}{accepted.coupon>0&&<div className="positive"><span>Coupon · FY {year} only</span><strong>−{money(accepted.coupon)}</strong></div>}{accepted.xp>0&&<div className="positive"><span>XP · FY {year} only</span><strong>−{money(accepted.xp)}</strong></div>}{revised&&<div><span>Updated quote adjustment</span><strong>{money(100)}</strong></div>}{term>1&&<div className="positive"><span>Future-year savings</span><strong>{money(accepted.savings)}</strong></div>}<div className="mytax-mobile-sheet-total"><strong>Pay today</strong><strong>{money(payable)}</strong></div><p>Before applicable taxes. One payment, no automatic annual charges.</p></div>:<p>Pricing is updating. Close this sheet to review your selection.</p>}
      </Drawer>
    </>}
    {mobile ? <Drawer open={upsellOpen} onClose={()=>setUpsellOpen(false)} placement="bottom" title="Save on your next tax reports">{upsellContent}</Drawer> : <Dialog open={upsellOpen} onClose={()=>setUpsellOpen(false)} title="Save on your next tax reports" description="Add future years to this purchase and pay once." confirmLabel={'Get '+upsellTerm+' years · '+money(upsellQuote.total+(revised?100:0))} cancelLabel="Back to report" onConfirm={acceptUpsell}>{upsellContent}<Button className="mytax-upsell-decline" variant="outline" fullWidth onClick={declineUpsell}>Continue with 1 year · {money(payable)}</Button></Dialog>}
    <Dialog open={savingsOpen && Boolean(accepted) && pricing === 'ready' && term > 1} onClose={()=>setSavingsOpen(false)} icon={<PercentageIcon />} title={accepted ? 'Save '+money(accepted.savings)+' with '+term+' years' : 'Multi-year savings'} description={fixture.discounts[term]+'% off '+(term===2?'your next tax year':'each of your next two tax years')+'. Included in your selected plan.'} confirmLabel="Continue with this plan" cancelLabel="Keep comparing" onConfirm={()=>setSavingsOpen(false)}>
      <div className="mytax-savings-popup"><p>{years.map(y=>'FY '+y).join(' · ')}</p><div><span>Pay once today</span><strong>{money(payable)}</strong></div><p>Before applicable taxes. No automatic annual charges.</p></div>
    </Dialog>
    <Dialog open={confirm} onClose={() => setConfirm(false)} title="Your quote has changed" description={'The demo payable increased by $1.00. Updated total: ' + money(payable + 100) + ' before taxes. Review the new amount before continuing.'} confirmLabel="Review updated quote" cancelLabel="Keep reviewing" onConfirm={() => { setRevised(true); setConfirm(false); }} />
  </div>;
}
