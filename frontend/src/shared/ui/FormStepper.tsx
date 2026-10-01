import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type FormStepperStep = {
  title: string
  description?: ReactNode
}

type FormStepperProps = {
  steps: readonly FormStepperStep[]
  activeStep: number
  visitedSteps?: ReadonlySet<number>
  onStepChange?: (step: number) => void
  className?: string
}

function FormStepper({ steps, activeStep, visitedSteps, onStepChange, className }: FormStepperProps) {
  const active = steps[activeStep]

  return (
    <nav aria-label="Progreso del formulario" className={cn('border-b border-border-subtle pb-5', className)}>
      <p className="text-body-small font-medium text-foreground md:hidden">
        Paso {activeStep + 1} de {steps.length}: <span className="font-semibold">{active?.title}</span>
      </p>
      <ol className="hidden grid-cols-4 gap-3 md:grid">
        {steps.map((step, index) => {
          const isActive = index === activeStep
          const isVisited = visitedSteps?.has(index) ?? index <= activeStep
          const isComplete = isVisited && !isActive
          const canNavigate = Boolean(onStepChange) && isVisited

          return (
            <li key={step.title} className="min-w-0">
              <button
                type="button"
                onClick={() => onStepChange?.(index)}
                disabled={!canNavigate}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex w-full items-start gap-3 rounded-control p-2 text-left transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-default',
                  isActive ? 'bg-background-selected text-foreground' : 'text-muted-foreground hover:bg-surface-muted disabled:hover:bg-transparent',
                )}
              >
                <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold', isActive ? 'border-primary bg-primary text-primary-foreground' : isComplete ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong bg-surface text-muted-foreground')}>
                  {isComplete ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-label font-semibold leading-snug text-current">{step.title}</span>
                  {step.description ? <span className="mt-0.5 block text-caption leading-normal text-muted-foreground">{step.description}</span> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { FormStepper }
export type { FormStepperProps }
