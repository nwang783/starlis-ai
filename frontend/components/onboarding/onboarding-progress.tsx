import { CheckCircle2 } from "lucide-react"

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, name: "Verification" },
    { id: 2, name: "Email Forwarding" },
    { id: 3, name: "Integrations" },
    { id: 4, name: "Voice Setup" },
    { id: 5, name: "Complete" },
  ]

  // Add a debug output to help diagnose the issue
  console.log("Current step in progress component:", currentStep)

  return (
    <div className="w-full">
      <div className="flex items-center justify-center max-w-full overflow-x-auto px-4 py-2">
        <div className="inline-flex items-center">
          {steps.map((step, index) => {
            // Determine if this step is active, completed, or upcoming
            const isCompleted = currentStep > step.id
            const isActive = currentStep === step.id
            const isUpcoming = currentStep < step.id

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className="flex items-center h-10">
                  {index > 0 && <div className={`h-1 w-16 ${currentStep >= step.id ? "bg-primary" : "bg-muted"}`} />}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary text-primary"
                          : "border-muted bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span>{step.id}</span>}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 w-16 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
                <div className="h-8 flex items-start justify-center">
                  <span
                    className={`mt-2 text-xs font-medium text-center w-16 ${
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

