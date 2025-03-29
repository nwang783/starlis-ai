import { CheckCircle2 } from "lucide-react"

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, name: "Email Setup" },
    { id: 2, name: "Integrations" },
    { id: 3, name: "Voice Setup" },
    { id: 4, name: "Complete" },
  ]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className="flex items-center">
              {index > 0 && <div className={`h-1 w-16 md:w-32 ${currentStep > index ? "bg-primary" : "bg-muted"}`} />}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : <span>{step.id}</span>}
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 w-16 md:w-32 ${currentStep > index + 1 ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

