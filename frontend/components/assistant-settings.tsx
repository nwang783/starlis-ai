"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"

export function AssistantSettings() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const fetchAssistantSettings = async () => {
      if (!user?.uid) return

      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setName(userData.assistantName || "")
          setDescription(userData.assistantDescription || "")
          setInstructions(userData.assistantInstructions || "")
          setVoiceEnabled(userData.voiceEnabled || false)
        }
      } catch (error) {
        console.error("Error fetching assistant settings:", error)
        toast({
          title: "Error",
          description: "Failed to load assistant settings",
          variant: "destructive",
        })
      } finally {
        setInitializing(false)
      }
    }

    fetchAssistantSettings()
  }, [user, toast])

  const handleSaveChanges = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        assistantName: name,
        assistantDescription: description,
        assistantInstructions: instructions,
        voiceEnabled: voiceEnabled,
        updatedAt: new Date(),
      })

      toast({
        title: "Success",
        description: "Assistant settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving assistant settings:", error)
      toast({
        title: "Error",
        description: "Failed to save assistant settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return <div className="p-4">Loading assistant settings...</div>
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Assistant name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="A short description of your assistant"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Detailed instructions for your assistant"
          className="min-h-32"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="voice" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
        <Label htmlFor="voice">Enable voice</Label>
      </div>
      <Button className="w-full" onClick={handleSaveChanges} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}

