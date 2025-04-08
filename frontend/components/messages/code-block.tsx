import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface CodeBlockProps {
  language: string
  value: string
  className?: string
}

export function CodeBlock({ language, value, className }: CodeBlockProps) {
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy code:", error)
      toast({
        title: "Error",
        description: "Failed to copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-[#1E1E1E]", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700">
        <span className="text-xs text-neutral-400">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-neutral-400 hover:text-neutral-200"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontFamily: "var(--font-geist-mono), monospace",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
} 