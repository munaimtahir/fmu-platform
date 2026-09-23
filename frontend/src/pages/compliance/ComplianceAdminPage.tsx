import React, { useState } from 'react'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { Button } from '@/components/ui/Button'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { AssignDialog, DefinitionsTab } from './DefinitionsTab'
import { AllRequirementsTab, ReviewQueueTab } from './RequirementsTab'
import { OnboardingRulesTab } from './OnboardingRulesTab'

type TabKey = 'queue' | 'requirements' | 'definitions' | 'onboarding'

const TABS: Array<{ key: TabKey; label: string; tasks: string[] }> = [
  { key: 'queue', label: 'Review queue', tasks: ['compliance.requirements.view'] },
  { key: 'requirements', label: 'All requirements', tasks: ['compliance.requirements.view'] },
  { key: 'definitions', label: 'Definitions', tasks: ['compliance.definitions.view'] },
  { key: 'onboarding', label: 'Onboarding rules', tasks: ['compliance.definitions.view'] },
]

export const ComplianceAdminPage: React.FC = () => {
  const { can } = useCapabilities()
  const visibleTabs = TABS.filter((tab) => can(...tab.tasks))
  const [active, setActive] = useState<TabKey | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const current = active && visibleTabs.some((tab) => tab.key === active) ? active : visibleTabs[0]?.key

  return (
    <PageShell
      title="Compliance"
      description="Review student submissions, manage requirement definitions and assign requirements."
      actions={
        <Can tasks={['compliance.requirements.assign']}>
          <Button onClick={() => setIsAssigning(true)}>Assign requirement</Button>
        </Can>
      }
    >
      <div role="tablist" aria-label="Compliance sections" className="flex gap-2 border-b border-surface-border mb-6">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={current === tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              current === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current === 'queue' && <ReviewQueueTab />}
      {current === 'requirements' && <AllRequirementsTab />}
      {current === 'definitions' && <DefinitionsTab />}
      {current === 'onboarding' && <OnboardingRulesTab />}
      {isAssigning && <AssignDialog onClose={() => setIsAssigning(false)} />}
    </PageShell>
  )
}
