import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'

/**
 * Proposed visual-direction review page. Purely additive: renders the
 * current design system next to a proposed one using local arbitrary
 * Tailwind classes, without touching tailwind.config.ts or any shared
 * component. Delete or gate behind a flag once the direction is approved
 * and the real token/component changes land.
 */

const CURRENT_COLORS = [
  { name: 'primary', hex: '#3B82F6' },
  { name: 'success', hex: '#10B981' },
  { name: 'warning', hex: '#F59E0B' },
  { name: 'danger', hex: '#EF4444' },
  { name: 'info', hex: '#3B82F6' },
  { name: 'neutral', hex: '#6B7280' },
]

const PROPOSED_PRIMARY_SCALE = [
  { step: '50', hex: '#EEF2FF' },
  { step: '100', hex: '#E0E7FF' },
  { step: '200', hex: '#C7D2FE' },
  { step: '300', hex: '#A5B4FC' },
  { step: '400', hex: '#818CF8' },
  { step: '500', hex: '#6366F1' },
  { step: '600', hex: '#4F46E5' },
  { step: '700', hex: '#4338CA' },
  { step: '800', hex: '#3730A3' },
  { step: '900', hex: '#312E81' },
]

const PROPOSED_SEMANTIC = [
  { name: 'success', subtle: '#D1FAE5', DEFAULT: '#059669', emphasis: '#065F46' },
  { name: 'warning', subtle: '#FEF3C7', DEFAULT: '#D97706', emphasis: '#92400E' },
  { name: 'danger', subtle: '#FEE2E2', DEFAULT: '#DC2626', emphasis: '#991B1B' },
  { name: 'info', subtle: '#E0F2FE', DEFAULT: '#0284C7', emphasis: '#075985' },
  { name: 'neutral', subtle: '#F1F5F9', DEFAULT: '#64748B', emphasis: '#334155' },
]

const PROPOSED_SURFACE_INK = [
  { name: 'surface', hex: '#F8FAFC', usage: 'page background' },
  { name: 'surface-card', hex: '#FFFFFF', usage: 'card background' },
  { name: 'surface-border', hex: '#E2E8F0', usage: 'border' },
  { name: 'ink-primary', hex: '#0F172A', usage: 'headings, primary text' },
  { name: 'ink-secondary', hex: '#475569', usage: 'body text' },
  { name: 'ink-muted', hex: '#94A3B8', usage: 'captions, placeholders' },
]

const TYPE_SCALE = [
  { name: 'display', className: 'text-[2.25rem] leading-[2.75rem] font-bold', sample: 'Page display title' },
  { name: 'h1', className: 'text-[1.875rem] leading-[2.25rem] font-bold', sample: 'Section heading' },
  { name: 'h2', className: 'text-[1.5rem] leading-[2rem] font-semibold', sample: 'Card / panel title' },
  { name: 'h3', className: 'text-[1.25rem] leading-[1.75rem] font-semibold', sample: 'Subsection title' },
  { name: 'h4', className: 'text-[1.125rem] leading-[1.5rem] font-semibold', sample: 'Minor heading' },
  { name: 'body-lg', className: 'text-base leading-6 font-normal', sample: 'Larger body copy for emphasis' },
  { name: 'body', className: 'text-sm leading-5 font-normal', sample: 'Default body copy used across forms and tables' },
  { name: 'body-sm', className: 'text-[0.8125rem] leading-[1.125rem] font-normal', sample: 'Secondary/support copy' },
  { name: 'caption', className: 'text-xs leading-4 font-normal', sample: 'Timestamps, helper text, table meta' },
]

const CURRENT_TYPE_SAMPLES = [
  { className: 'text-4xl font-bold text-gray-900', label: 'text-4xl font-bold (seen on some page titles)' },
  { className: 'text-3xl font-bold text-gray-900', label: 'text-3xl font-bold (seen on other page titles)' },
  { className: 'text-2xl font-bold text-gray-900', label: 'text-2xl font-bold (seen on yet other page titles)' },
  { className: 'text-xl font-semibold text-gray-900', label: 'text-xl font-semibold (section headings)' },
  { className: 'text-lg font-semibold text-gray-900', label: 'text-lg font-semibold (card titles)' },
]

const ELEVATIONS = [
  { name: 'elevation-1', current: 'shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)]', proposed: 'shadow-[0_1px_3px_0_rgb(15_23_42_/_0.08),0_1px_2px_-1px_rgb(15_23_42_/_0.06)]' },
  { name: 'elevation-2', current: 'shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),0_2px_4px_-2px_rgb(0_0_0_/_0.1)]', proposed: 'shadow-[0_4px_8px_-2px_rgb(15_23_42_/_0.12),0_2px_4px_-2px_rgb(15_23_42_/_0.08)]' },
  { name: 'elevation-3', current: 'shadow-[0_10px_15px_-3px_rgb(0_0_0_/_0.1),0_4px_6px_-4px_rgb(0_0_0_/_0.1)]', proposed: 'shadow-[0_12px_24px_-6px_rgb(15_23_42_/_0.18),0_4px_8px_-4px_rgb(15_23_42_/_0.1)]' },
]

const BADGE_VARIANTS: BadgeVariant[] = ['default', 'primary', 'success', 'warning', 'danger', 'info', 'secondary']

function Swatch({ hex, label, sublabel }: { hex: string; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: hex }} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-500 font-mono">{sublabel ?? hex}</p>
      </div>
    </div>
  )
}

function SideBySide({ title, current, proposed }: { title: string; current: React.ReactNode; proposed: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Current</p>
          <Card padding="md">{current}</Card>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-2">Proposed</p>
          <div className="rounded-2xl p-6 bg-white border border-[#E2E8F0] shadow-[0_1px_3px_0_rgb(15_23_42_/_0.08),0_1px_2px_-1px_rgb(15_23_42_/_0.06)]">
            {proposed}
          </div>
        </div>
      </div>
    </div>
  )
}

export const StyleGuidePage = () => {
  const [switchOn, setSwitchOn] = useState(true)
  const [selectValue, setSelectValue] = useState('active')

  return (
    <div className="space-y-10 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visual Direction — Style Guide</h1>
        <p className="text-gray-600">
          Proposed palette, typography, spacing, and elevation direction for the full visual refresh.
          This page is additive only — nothing here is wired into <code className="font-mono text-sm bg-gray-100 px-1 rounded">tailwind.config.ts</code> or
          any shared component yet. Review and approve a direction before the foundation phase begins.
        </p>
      </div>

      {/* Color palette */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">1. Color palette</h2>
        <SideBySide
          title="Semantic tokens"
          current={
            <div className="grid grid-cols-2 gap-4">
              {CURRENT_COLORS.map((c) => (
                <Swatch key={c.name} hex={c.hex} label={c.name} />
              ))}
            </div>
          }
          proposed={
            <div className="space-y-4">
              {PROPOSED_SEMANTIC.map((s) => (
                <div key={s.name}>
                  <p className="text-sm font-medium text-gray-900 mb-1.5 capitalize">{s.name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Swatch hex={s.subtle} label="subtle" sublabel={s.subtle} />
                    <Swatch hex={s.DEFAULT} label="DEFAULT" sublabel={s.DEFAULT} />
                    <Swatch hex={s.emphasis} label="emphasis" sublabel={s.emphasis} />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        <SideBySide
          title="Primary scale"
          current={<Swatch hex="#3B82F6" label="primary (single hex, no scale)" />}
          proposed={
            <div className="grid grid-cols-5 gap-3">
              {PROPOSED_PRIMARY_SCALE.map((p) => (
                <div key={p.step} className="text-center">
                  <div className="h-12 w-full rounded-lg border border-gray-200 mb-1" style={{ backgroundColor: p.hex }} />
                  <p className="text-xs font-mono text-gray-500">{p.step}</p>
                </div>
              ))}
            </div>
          }
        />

        <SideBySide
          title="Surface & ink (new tokens)"
          current={
            <p className="text-sm text-gray-600">
              No dedicated tokens today — layout chrome hardcodes <code className="font-mono bg-gray-100 px-1 rounded">bg-[#FAFAFA]</code>,
              text hardcodes <code className="font-mono bg-gray-100 px-1 rounded">text-gray-900</code> / <code className="font-mono bg-gray-100 px-1 rounded">text-gray-500</code> per component.
            </p>
          }
          proposed={
            <div className="grid grid-cols-2 gap-3">
              {PROPOSED_SURFACE_INK.map((s) => (
                <Swatch key={s.name} hex={s.hex} label={s.name} sublabel={s.usage} />
              ))}
            </div>
          }
        />
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">2. Typography scale</h2>
        <SideBySide
          title="Type scale"
          current={
            <div className="space-y-3">
              {CURRENT_TYPE_SAMPLES.map((t) => (
                <div key={t.label}>
                  <p className={t.className}>{t.label.split(' (')[0]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
          }
          proposed={
            <div className="space-y-3">
              {TYPE_SCALE.map((t) => (
                <div key={t.name}>
                  <p className={`${t.className} text-[#0F172A]`}>{t.sample}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">{t.name}</p>
                </div>
              ))}
            </div>
          }
        />
      </section>

      {/* Spacing & elevation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">3. Elevation</h2>
        <SideBySide
          title="Shadow scale"
          current={
            <div className="grid grid-cols-3 gap-4">
              {ELEVATIONS.map((e) => (
                <div key={e.name} className="text-center">
                  <div className={`h-16 w-full rounded-xl bg-white border border-gray-100 ${e.current}`} />
                  <p className="text-xs font-mono text-gray-500 mt-2">{e.name}</p>
                </div>
              ))}
            </div>
          }
          proposed={
            <div className="grid grid-cols-3 gap-4">
              {ELEVATIONS.map((e) => (
                <div key={e.name} className="text-center">
                  <div className={`h-16 w-full rounded-xl bg-white border border-gray-100 ${e.proposed}`} />
                  <p className="text-xs font-mono text-gray-500 mt-2">{e.name}</p>
                </div>
              ))}
            </div>
          }
        />
      </section>

      {/* Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">4. Components (current, unchanged)</h2>
        <p className="text-sm text-gray-600">
          Rendered from the real shared components as they exist today — these are the ones the foundation
          phase will restyle once a direction above is approved.
        </p>
        <Card padding="lg">
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="primary" isLoading>Loading</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Badges</h3>
              <div className="flex flex-wrap gap-2">
                {BADGE_VARIANTS.map((v) => (
                  <Badge key={v} variant={v}>{v}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Alerts</h3>
              <div className="space-y-3">
                <Alert variant="info" title="Info">Informational message.</Alert>
                <Alert variant="success" title="Success">Action completed successfully.</Alert>
                <Alert variant="warning" title="Warning">Something needs attention.</Alert>
                <Alert variant="error" title="Error">Something went wrong.</Alert>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Empty state</h3>
              <Card padding="none" className="border-dashed">
                <EmptyState title="No records found" description="Try adjusting your filters." action={{ label: 'Reset filters', onClick: () => {} }} />
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Form inputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <Input label="Full name" placeholder="Jane Doe" />
                <Input label="Email" placeholder="jane@example.com" error="This field is required" />
                <Select
                  label="Status"
                  value={selectValue}
                  onChange={setSelectValue}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'graduated', label: 'Graduated' },
                  ]}
                />
                <Switch id="demo-switch" checked={switchOn} onChange={setSwitchOn} label="Enable notifications" description="Send email updates" />
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
