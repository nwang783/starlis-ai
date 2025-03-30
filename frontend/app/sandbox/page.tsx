"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import {
  RefreshCw,
  Check,
  X,
  Info,
  AlertTriangle,
  Mail,
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CallCard } from "@/components/call-card"

export default function SandboxPage() {
  return (
    <div className="container py-6">
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="ui">UI Components</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CounterCard />
            <ToggleCard />
            <ToastCard />
            <EmailEditorCard />
            <CallDemoCard />
          </div>
        </TabsContent>

        <TabsContent value="ui">
          <div className="grid gap-6 md:grid-cols-2">
            <ButtonsCard />
            <BadgesCard />
            <SliderCard />
            <AlertsCard />
          </div>
        </TabsContent>

        <TabsContent value="forms">
          <div className="grid gap-6 md:grid-cols-2">
            <BasicFormCard />
            <TextAreaCard />
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="grid gap-6 md:grid-cols-2">
            <ApiTestCard />
            <DelayedResponseCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Rest of the component functions remain the same
function CounterCard() {
  const [count, setCount] = useState(0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Counter</CardTitle>
        <CardDescription>Test basic state management</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-4xl font-bold mb-4">{count}</div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setCount(count - 1)}>
          Decrease
        </Button>
        <Button variant="outline" onClick={() => setCount(0)}>
          Reset
        </Button>
        <Button onClick={() => setCount(count + 1)}>Increase</Button>
      </CardFooter>
    </Card>
  )
}

function ToggleCard() {
  const [enabled, setEnabled] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toggle</CardTitle>
        <CardDescription>Test toggle state</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Switch id="toggle" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="toggle">Status: {enabled ? "Enabled" : "Disabled"}</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={enabled ? "default" : "outline"} onClick={() => setEnabled(!enabled)}>
          Toggle State
        </Button>
      </CardFooter>
    </Card>
  )
}

function ToastCard() {
  const { toast } = useToast()

  const showToast = (type: "default" | "success" | "error" | "info") => {
    const toastOptions = {
      default: {
        title: "Default Toast",
        description: "This is a default toast notification",
      },
      success: {
        title: "Success!",
        description: "Operation completed successfully",
      },
      error: {
        title: "Error!",
        description: "Something went wrong",
        variant: "destructive" as const,
      },
      info: {
        title: "Information",
        description: "Here's some information for you",
      },
    }

    toast(toastOptions[type])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toast Notifications</CardTitle>
        <CardDescription>Test different toast notifications</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={() => showToast("default")}>Default Toast</Button>
        <Button onClick={() => showToast("success")}>Success Toast</Button>
        <Button variant="destructive" onClick={() => showToast("error")}>Error Toast</Button>
        <Button variant="outline" onClick={() => showToast("info")}>Info Toast</Button>
      </CardContent>
    </Card>
  )
}

function ButtonsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buttons</CardTitle>
        <CardDescription>Test different button variants</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled>Disabled</Button>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            With Icon
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BadgesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Badges</CardTitle>
        <CardDescription>Test different badge variants</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </CardContent>
    </Card>
  )
}

function SliderCard() {
  const [value, setValue] = useState([50])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slider</CardTitle>
        <CardDescription>Test slider component</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>Value: {value[0]}</div>
          <Slider defaultValue={[50]} max={100} step={1} value={value} onValueChange={setValue} />
        </div>
      </CardContent>
    </Card>
  )
}

function AlertsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>Test different alert types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Default Alert</AlertTitle>
          <AlertDescription>This is a default alert message.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Alert</AlertTitle>
          <AlertDescription>Something went wrong! Please try again.</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function BasicFormCard() {
  const [formData, setFormData] = useState({ name: "", email: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Form submitted with: ${JSON.stringify(formData)}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Form</CardTitle>
        <CardDescription>Test form inputs and submission</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>
          <Button type="submit" className="w-full">
            Submit Form
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function TextAreaCard() {
  const [text, setText] = useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text Area</CardTitle>
        <CardDescription>Test text area input</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="Type something here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
          />
          <div>
            <p className="text-sm text-muted-foreground">Character count: {text.length}</p>
          </div>
          <Button onClick={() => setText("")} variant="outline" className="w-full">
            Clear Text
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ApiTestCard() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const simulateApiCall = async () => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock successful response
      setResponse({
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000),
          name: "Test Item",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (err) {
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const simulateApiError = async () => {
    setLoading(true)
    setResponse(null)

    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock error
      throw new Error("API Error")
    } catch (err) {
      setError("API returned an error: Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Test</CardTitle>
        <CardDescription>Test simulated API calls</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={simulateApiCall} disabled={loading} className="flex-1">
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Fetch Data
            </Button>
            <Button onClick={simulateApiError} disabled={loading} variant="outline" className="flex-1">
              Simulate Error
            </Button>
          </div>

          {loading && (
            <div className="p-4 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response && !loading && (
            <div className="rounded-md bg-muted p-4">
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DelayedResponseCard() {
  const [delay, setDelay] = useState(2)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleDelayedAction = async () => {
    setLoading(true)
    setResult(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, delay * 1000))
      setResult(`Action completed after ${delay} seconds`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delayed Response</CardTitle>
        <CardDescription>Test actions with configurable delay</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="delay">Delay (seconds): {delay}</Label>
            </div>
            <Slider
              id="delay"
              min={1}
              max={10}
              step={1}
              value={[delay]}
              onValueChange={(value) => setDelay(value[0])}
            />
          </div>

          <Button onClick={handleDelayedAction} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Execute with ${delay}s Delay`
            )}
          </Button>

          {result && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmailEditorCard() {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Editor</CardTitle>
        <CardDescription>Open a mini email editor</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Open Email Editor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Email Editor</DialogTitle>
              <DialogDescription>Create and edit email content in HTML or plain text format.</DialogDescription>
            </DialogHeader>
            <EmailEditor />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Email tag input component
function EmailTagInput({
  value,
  onChange,
  placeholder,
  showCcToggle = false,
  showBccToggle = false,
  onCcToggle,
  onBccToggle,
}: {
  value: string[]
  onChange: (emails: string[]) => void
  placeholder: string
  showCcToggle?: boolean
  showBccToggle?: boolean
  onCcToggle?: () => void
  onBccToggle?: () => void
}) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Basic email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or Space
    if ((e.key === "Enter" || e.key === " ") && inputValue.trim()) {
      e.preventDefault()

      const email = inputValue.trim()

      if (isValidEmail(email) && !value.includes(email)) {
        onChange([...value, email])
        setInputValue("")
      }
    }

    // Remove last tag on Backspace if input is empty
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove))
  }

  return (
    <div
      className="flex flex-wrap gap-1 p-2 border rounded-md focus-within:ring-1 focus-within:ring-ring focus-within:border-input relative"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((email) => (
        <div
          key={email}
          className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
        >
          <span>{email}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeEmail(email)
            }}
            className="text-secondary-foreground/70 hover:text-secondary-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[120px] outline-none bg-transparent"
        placeholder={value.length === 0 ? placeholder : ""}
      />

      {(showCcToggle || showBccToggle) && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {showCcToggle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCcToggle?.()
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-secondary"
                  >
                    <span className="text-xs font-medium">Cc</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Cc field</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {showBccToggle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onBccToggle?.()
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-secondary"
                  >
                    <span className="text-xs font-medium">Bcc</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Bcc field</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  )
}

function EmailEditor() {
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [toEmails, setToEmails] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [bccEmails, setBccEmails] = useState<string[]>([])
  const [editorMode, setEditorMode] = useState<"html" | "text">("text")
  const [subject, setSubject] = useState("")
  const [htmlContent, setHtmlContent] = useState(
    "<p>Hello,</p><p>This is a sample email.</p><p>Regards,<br/>Your Name</p>",
  )
  const [textContent, setTextContent] = useState("Hello,\n\nThis is a sample email.\n\nRegards,\nYour Name")

  const handleAIAutofill = () => {
    setToEmails(["recipient@example.com"])

    // If CC or BCC are visible, populate them
    if (showCc) {
      setCcEmails(["manager@example.com", "team@example.com"])
    }

    if (showBcc) {
      setBccEmails(["records@example.com"])
    }

    setSubject("Important: Quarterly Update - Action Required")
  }

  return (
    <div className="space-y-4 pt-4 overflow-y-auto pr-1">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Email Details</h3>
        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleAIAutofill}>
          <span className="text-xs">AI Autofill</span>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <EmailTagInput
            value={toEmails}
            onChange={setToEmails}
            placeholder="Add recipients (press Enter or Space)"
            showCcToggle={!showCc}
            showBccToggle={!showBcc}
            onCcToggle={() => setShowCc(true)}
            onBccToggle={() => setShowBcc(true)}
          />
        </div>

        {showCc && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center">
              <Label htmlFor="cc">CC</Label>
              <button onClick={() => setShowCc(false)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="h-3 w-3" />
              </button>
            </div>
            <EmailTagInput value={ccEmails} onChange={setCcEmails} placeholder="Add CC recipients" />
          </div>
        )}

        {showBcc && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center">
              <Label htmlFor="bcc">BCC</Label>
              <button onClick={() => setShowBcc(false)} className="text-muted-foreground hover:text-foreground text-xs">
                <X className="h-3 w-3" />
              </button>
            </div>
            <EmailTagInput value={bccEmails} onChange={setBccEmails} placeholder="Add BCC recipients" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="text" value={editorMode} onValueChange={(value) => setEditorMode(value as "html" | "text")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="space-y-4">
          <div className="bg-muted/50 p-2 rounded-md flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Underline className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Image className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="min-h-[150px] max-h-[200px] font-mono text-sm"
          />

          <div className="rounded-md border max-h-[200px] overflow-auto">
            <div className="p-3 text-sm font-medium sticky top-0 bg-background border-b">Preview</div>
            <div className="p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <div className="bg-muted/50 p-2 rounded-md flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Underline className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-8" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Image className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-[200px] max-h-[300px] font-mono text-sm"
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background pb-2">
        <Button variant="outline">Save Draft</Button>
        <Button>Send Email</Button>
      </div>
    </div>
  )
}

function CallDemoCard() {
  const [showCall, setShowCall] = useState(false)

  const handleCallEnd = (transcript: string[]) => {
    setShowCall(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Demo</CardTitle>
        <CardDescription>Test the call interface</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {showCall ? (
          <div className="px-6 pb-6">
            <CallCard
              callSid="demo-123"
              phoneNumber="+1 (555) 123-4567"
              contactName="John Demo"
              onCallEnded={handleCallEnd}
              isDemo={true}
            />
          </div>
        ) : (
          <div className="text-center px-6 pb-6">
            <p className="text-muted-foreground mb-4">Click the button below to start a demo call</p>
            <Button onClick={() => setShowCall(true)}>Start Demo Call</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

