import { Check, ChevronDown, ChevronRight, BrainCircuit, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

interface Model {
  id: string
  name: string
  company: string
  description: string
  isSelected: boolean
  icon?: React.ReactNode
}

interface ModelLibraryProps {
  models: Model[]
  onSelectModel: (modelId: string) => void
}

export function ModelLibrary({ models, onSelectModel }: ModelLibraryProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Filter models based on search query
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique companies from filtered models
  const filteredCompanies = Array.from(
    new Set(filteredModels.map((model) => model.company))
  )

  // Auto-expand companies when searching
  useEffect(() => {
    if (searchQuery) {
      const companiesWithMatches = filteredCompanies
      setExpandedCompanies(companiesWithMatches)
    }
  }, [searchQuery, filteredCompanies])

  // Auto-expand the company of the selected model
  useEffect(() => {
    const selectedModel = models.find((model) => model.isSelected)
    if (selectedModel && !expandedCompanies.includes(selectedModel.company)) {
      setExpandedCompanies((prev) => [...prev, selectedModel.company])
    }
  }, [models, expandedCompanies])

  const toggleCompany = (company: string) => {
    setExpandedCompanies((prev) =>
      prev.includes(company)
        ? prev.filter((c) => c !== company)
        : [...prev, company]
    )
  }

  const getCompanyIcon = (company: string) => {
    switch (company) {
      case "OpenAI":
        return (
          <Image
            src="/openai-logo.svg"
            alt="OpenAI Logo"
            width={16}
            height={16}
            className="dark:brightness-0 dark:invert brightness-0"
          />
        )
      case "Anthropic":
        return (
          <Image
            src="/anthropic-logo.svg"
            alt="Anthropic Logo"
            width={16}
            height={16}
            className="dark:brightness-0 dark:invert brightness-0"
          />
        )
      case "Google":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            className="h-4 w-4 dark:brightness-0 dark:invert brightness-0"
          >
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )
      default:
        return <BrainCircuit className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCompanies.map((company) => (
          <div key={company} className="mb-4">
            <button
              onClick={() => toggleCompany(company)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                {getCompanyIcon(company)}
                <span>{company}</span>
              </div>
              {expandedCompanies.includes(company) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedCompanies.includes(company) && (
              <div className="mt-2 space-y-1">
                {filteredModels
                  .filter((model) => model.company === company)
                  .map((model) => (
                    <button
                      key={model.id}
                      onClick={() => onSelectModel(model.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent",
                        model.isSelected && "bg-accent"
                      )}
                    >
                      {model.icon}
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                      {model.isSelected && (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 