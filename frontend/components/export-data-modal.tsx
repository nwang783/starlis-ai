"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ExportDataModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function ExportDataModal({ isOpen, onClose, userEmail }: ExportDataModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedData, setSelectedData] = useState({
    settings: false,
    transcripts: false,
    recordings: false,
    chatHistory: false,
    integrations: false,
  })

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedData).every((value) => value)

    setSelectedData({
      settings: !allSelected,
      transcripts: !allSelected,
      recordings: !allSelected,
      chatHistory: !allSelected,
      integrations: !allSelected,
    })
  }

  const handleCheckboxChange = (key: keyof typeof selectedData) => {
    setSelectedData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleExport = async () => {
    // Check if at least one option is selected
    if (!Object.values(selectedData).some((value) => value)) {
      toast({
        title: "No data selected",
        description: "Please select at least one type of data to export.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // In a real app, this would call an API to trigger the export
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Export initiated",
        description: `An email will be sent to ${userEmail} with your exported data. This may take some time.`,
      })

      onClose()
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Account Data</DialogTitle>
          <DialogDescription>
            Select the data you would like to export. The data will be sent to your email address.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={Object.values(selectedData).every((value) => value)}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All
            </Label>
          </div>

          <div className="space-y-3 border rounded-md p-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="settings"
                checked={selectedData.settings}
                onCheckedChange={() => handleCheckboxChange("settings")}
              />
              <Label htmlFor="settings">Account Settings</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="transcripts"
                checked={selectedData.transcripts}
                onCheckedChange={() => handleCheckboxChange("transcripts")}
              />
              <Label htmlFor="transcripts">Call Transcripts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recordings"
                checked={selectedData.recordings}
                onCheckedChange={() => handleCheckboxChange("recordings")}
              />
              <Label htmlFor="recordings">Voice Recordings</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="chatHistory"
                checked={selectedData.chatHistory}
                onCheckedChange={() => handleCheckboxChange("chatHistory")}
              />
              <Label htmlFor="chatHistory">Chat History</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="integrations"
                checked={selectedData.integrations}
                onCheckedChange={() => handleCheckboxChange("integrations")}
              />
              <Label htmlFor="integrations">Integration Data</Label>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Your data will be exported in JSON format and sent to {userEmail}. This process may take some time depending
            on the amount of data.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

