/* ============================================================================
 * KoinX Taxes — Overview › ITR Filing (mobile, 390)
 *
 * Built in the playground from XUI, to prove the system composes a real mobile
 * screen. Measurements came from the Figma file's own properties
 * (KoinX-Fidisys-Internal, MCP Mobile Taxes › Overview › "ITR Filing",
 * node 9838:204172), not from a screenshot:
 *
 *   detail rows  label Body/3 w48, value Subtitle/2, gaps 4 (plan) and 8 (status)
 *   assigned-to  label Body/3, then 6px-spaced rows of a 16px icon + gap 4
 *   chips        wrap, gap 8
 *   footer       outline button, full width
 *
 * WHERE THE FRAME AND THE SYSTEM DISAGREE, THE SYSTEM WINS — teja's call.
 * So the pills and the drawer's own spacing are XUI's, not the frame's:
 *
 *   pill / chips  Badge `accent-primary`. Its surface-brand-secondary on
 *                 content-primary is exactly what the frame paints, and
 *                 `bordered` gives surface-brand-primary — the same blue the
 *                 frame's border-brand resolves to. Two deltas taken from the
 *                 system: Badge is 20 tall where the frame draws 24, and its
 *                 border is solid where the frame's status pill is dashed.
 *   icons in them Badge sizes its own icon slot to 12; the frame uses 16.
 *   drawer        panel padding, header and the full-bleed rule are whatever
 *                 Drawer supplies. Nothing here overrides them. (The frame
 *                 draws pt 12 to XUI's 8, and titles in Body/1 where XUI uses
 *                 Subtitle/1.)
 *
 * One translation that is not a disagreement: every text fill in the frame is
 * bound to `content-absolute-white`, because this screen was only ever drawn
 * dark. Written literally it would be white-on-white in light mode, so it reads
 * `content-primary` / `content-secondary` here.
 *
 * Still unresolved: the frame's building and briefcase glyphs have no XUI
 * equivalent, and its chip icons are gradient-filled (the file's own
 * Dark/Gradients styles) which XUI's monochrome icons cannot express. Those
 * four stay as exported assets until the icon set catches up.
 * ========================================================================== */

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Drawer,
  Button,
  Badge,
  CallIcon,
  EmailIcon,
  CalendarIcon,
} from '@koinx/xui';

import buildingIcon from '../../../assets/building.svg';
import moneyIcon from '../../../assets/money.svg';
import graphIcon from '../../../assets/graph.svg';
import businessCenterIcon from '../../../assets/business-center.svg';

/** An exported glyph at Badge's own icon size — its `.icon > svg` rule cannot reach an <img>. */
const chipIcon = (src: string) => <img src={src} alt="" width={12} height={12} />;

/** Figma: label Body/3 fixed at 48, value Subtitle/2. */
function DetailRow({ label, gap, children }: { label: string; gap: number; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <span style={{ width: 48, flex: 'none', font: 'var(--type-body-3)', color: 'var(--content-secondary)' }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/** A 16px glyph and its line, 4px apart. */
function ContactRow({ icon, children, strong }: { icon: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--content-primary)' }}>
      <span style={{ display: 'inline-flex', flex: 'none', width: 16, height: 16 }}>{icon}</span>
      <span style={{ font: strong ? 'var(--type-subtitle-2)' : 'var(--type-body-2)' }}>{children}</span>
    </div>
  );
}

const rule = { height: 1, flex: 'none', background: 'var(--border-secondary)' } as const;
const column = { display: 'flex', flexDirection: 'column' } as const;

export default function ITRFiling() {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-primary)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'var(--spacing-24)',
      }}
    >
      <Button onClick={() => setOpen(true)}>Open ITR Filing</Button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom"
        title="ITR Filing"
        footer={
          <Button variant="outline" fullWidth>
            Got it
          </Button>
        }
      >
        <div style={{ ...column, gap: 'var(--spacing-16)' }}>
          <div style={{ ...column, gap: 'var(--spacing-8)' }}>
            <DetailRow label="Plan:" gap={4}>
              <span style={{ font: 'var(--type-subtitle-2)', color: 'var(--content-primary)' }}>
                Comprehensive ITR Filing
              </span>
            </DetailRow>
            <DetailRow label="Status:" gap={8}>
              <Badge variant="accent-primary" bordered>
                In Progress
              </Badge>
            </DetailRow>
          </div>

          <div style={rule} />

          <div style={{ ...column, gap: 'var(--spacing-6)' }}>
            <span style={{ font: 'var(--type-body-3)', color: 'var(--content-secondary)' }}>Assigned to:</span>
            <div style={{ ...column, gap: 'var(--spacing-6)' }}>
              <ContactRow strong icon={<img src={buildingIcon} alt="" width={16} height={16} />}>
                ABC Tax Consultancy
              </ContactRow>
              <ContactRow icon={<CallIcon size={16} />}>+91-9876543210</ContactRow>
              <ContactRow icon={<EmailIcon size={16} />}>contact.agency@gmail.com</ContactRow>
              <ContactRow icon={<CalendarIcon size={16} />}>Assigned on: 07 Apr 2026</ContactRow>
            </div>
          </div>

          <div style={rule} />

          <div style={{ ...column, gap: 'var(--spacing-6)' }}>
            <span style={{ font: 'var(--type-body-3)', color: 'var(--content-secondary)' }}>
              What’s included in this plan:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
              <Badge variant="accent-primary" iconLeft={chipIcon(moneyIcon)}>
                Salary Income
              </Badge>
              <Badge variant="accent-primary" iconLeft={chipIcon(graphIcon)}>
                Business or Professional Income
              </Badge>
              <Badge variant="accent-primary" iconLeft={chipIcon(businessCenterIcon)}>
                Stocks or Mutual Funds
              </Badge>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
