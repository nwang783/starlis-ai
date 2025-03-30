"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle, ChevronRight, ExternalLink, Moon, Sparkles, Sun, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BillingToggle } from "@/components/billing-toggle"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

// Add these styles for the blob animations
const animationStyles = `
  @keyframes blob {
    0% {
      transform: translate(0px, 0px) scale(1);
    }
    33% {
      transform: translate(30px, -50px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
      transform: translate(0px, 0px) scale(1);
    }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
`

export function LandingPageContent() {
  return (
    <>
      <style jsx global>
        {animationStyles}
      </style>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="fixed w-full top-4 left-0 right-0 z-50">
          <div className="container mx-auto max-w-5xl">
            <div className="flex h-20 items-center justify-between rounded-full border border-border/40 bg-zinc-900/60 backdrop-blur-lg relative px-4 text-white">
              <Link href="/" className="flex items-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/circle-with-irregular-shape-inside-svgrepo-com-krMECzHbCO4kkkJCa2jNlslczUaIzc.svg"
                  alt="Starlis Logo"
                  className="h-10 brightness-0 invert"
                />
              </Link>
              <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-10">
                <Link href="/features" className="text-sm font-medium text-white transition-colors hover:text-white/80">
                  Product
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-white transition-colors hover:text-white/80">
                  Pricing
                </Link>
                <Link href="/about" className="text-sm font-medium text-white transition-colors hover:text-white/80">
                  About
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-white transition-colors hover:text-white/80 hidden md:inline-block"
                >
                  Log in
                </Link>
                <Button asChild className="rounded-full bg-white text-zinc-900 hover:bg-white/90">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {/* Hero Section */}
          <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
            {/* Vercel-inspired gradient background */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-to-br from-pink-500/20 via-red-500/10 to-purple-600/20 opacity-50">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-600 to-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-16 sm:mt-20 md:mt-24">
              <div className="max-w3xl mx-auto text-center space-y-6 w-full">
                <div className="inline-flex items-center rounded-full border border-border bg-background/80 backdrop-blur-sm px-3 py-1 text-sm mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  <span className="font-medium">Now in public beta</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
                  Your AI assistant that actually gets things done
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Starlis handles your calls, emails, and meetings so you can focus on what matters most.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mx-auto justify-center pt-4 max-w-md">
                  <Button asChild size="lg" className="rounded-md">
                    <Link href="/signup">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-md">
                    <Link href="/demo">
                      See Demo <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-16 rounded-xl border border-border bg-background/80 backdrop-blur-sm p-4 sm:p-8 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 size-80 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 blur-3xl opacity-50"></div>
                <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-gradient-to-tr from-red-500/20 to-pink-500/20 blur-3xl opacity-50"></div>
                <div className="relative">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                          <User className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                          <p className="text-sm">Schedule a meeting with Sarah about the Q3 marketing plan</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                          <p className="text-sm font-medium">I'll schedule that meeting for you</p>
                          <div className="mt-3 p-3 bg-secondary rounded-md border border-border text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Meeting with Sarah</span>
                              <span className="text-muted-foreground">Tomorrow, 2:00 PM</span>
                            </div>
                            <p className="mt-1 text-muted-foreground">Topic: Q3 Marketing Plan Discussion</p>
                            <div className="mt-2 flex items-center text-pink-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>Added to your calendar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                          <User className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                          <p className="text-sm">Call my dentist to reschedule my appointment</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                          <p className="text-sm font-medium">I'll call your dentist to reschedule</p>
                          <div className="mt-3 p-3 bg-secondary rounded-md border border-border text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Call completed</span>
                              <span className="text-muted-foreground">2 mins ago</span>
                            </div>
                            <p className="mt-1 text-muted-foreground">Rescheduled for Friday, June 12 at 10:00 AM</p>
                            <div className="mt-2 flex items-center text-pink-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>Appointment confirmed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof */}
          <section className="border-y border-border bg-secondary/10">
            <div className="container py-12">
              <p className="text-center text-sm font-medium text-muted-foreground mb-8">BUILT BY STUDENTS FROM</p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
                {/* University of Virginia Logo */}
                <div className="h-28 flex items-center">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/University-of-Virginia-Logo-5-iNVVusjQVETwkAXz5NqANE9eAOuy9L.svg"
                    alt="University of Virginia"
                    className="h-full w-auto object-contain opacity-70"
                  />
                </div>

                {/* George Mason University Logo */}
                <div className="h-16 flex items-center">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/George%20Mason%20University%204C%20H-APT4CtqyuKYfUG46Rq8HqWxYh4xhlk.png"
                    alt="George Mason University"
                    className="h-full w-auto object-contain opacity-70"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="container py-20">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 w-full">
              <div className="inline-flex items-center rounded-full border border-border bg-background/80 backdrop-blur-sm px-3 py-1 text-sm mb-4">
                <span className="font-medium">FEATURES</span>
              </div>
              <h2 className="text-3xl font-bold">How Starlis works for you</h2>
              <p className="text-xl text-muted-foreground">Our AI assistant handles the tasks that slow you down</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              <div className="rounded-lg border border-border bg-background/80 backdrop-blur-sm p-6 hover:shadow-md transition-shadow relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="size-12 rounded-lg bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center mb-4 relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-pink-500"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 18h.01" />
                    <path d="M12 18h.01" />
                    <path d="M16 18h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Meeting Scheduler</h3>
                <p className="text-muted-foreground mb-4 relative">
                  Automatically schedules, reschedules, and cancels meetings based on your availability.
                </p>
                <Link
                  href="/features/meetings"
                  className="inline-flex items-center text-sm font-medium text-pink-500 relative"
                >
                  Learn more <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-lg border border-border bg-background/80 backdrop-blur-sm p-6 hover:shadow-md transition-shadow relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="size-12 rounded-lg bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center mb-4 relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-500"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Email Assistant</h3>
                <p className="text-muted-foreground mb-4 relative">
                  Manages your inbox, drafts responses, and ensures important emails never slip through the cracks.
                </p>
                <Link
                  href="/features/email"
                  className="inline-flex items-center text-sm font-medium text-pink-500 relative"
                >
                  Learn more <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-lg border border-border bg-background/80 backdrop-blur-sm p-6 hover:shadow-md transition-shadow relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="size-12 rounded-lg bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center mb-4 relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-600"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Voice Calling</h3>
                <p className="text-muted-foreground mb-4 relative">
                  Makes calls on your behalf to book appointments, follow up on orders, or handle customer service issues.
                </p>
                <Link
                  href="/features/calls"
                  className="inline-flex items-center text-sm font-medium text-pink-500 relative"
                >
                  Learn more <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Voice Integration */}
          <section className="container py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-sm">
                  <span className="text-blue-500 mr-2">✦</span>
                  <span className="font-medium">Advanced Voice Technology</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Human-like voice capabilities powered by Twilio and ElevenLabs
                </h2>
                <p className="text-xl text-muted-foreground">
                  Starlis leverages cutting-edge voice technology to make calls that sound natural and human-like, creating
                  seamless interactions.
                </p>

                <div className="space-y-4 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-500"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Twilio Integration</h3>
                      <p className="text-muted-foreground">
                        Seamlessly make and receive calls through Twilio's reliable global infrastructure, ensuring
                        crystal-clear communication.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-purple-500"
                      >
                        <path d="M12 18v-6" />
                        <path d="M8 18v-1" />
                        <path d="M16 18v-3" />
                        <path d="M2 22h20" />
                        <path d="M12 2a7 7 0 0 1 7 7v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a7 7 0 0 1 7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">ElevenLabs Voice AI</h3>
                      <p className="text-muted-foreground">
                        Powered by ElevenLabs' state-of-the-art voice synthesis, Starlis speaks with natural intonation,
                        emotion, and clarity.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-500"
                      >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Customizable Voice Profiles</h3>
                      <p className="text-muted-foreground">
                        Choose from multiple voice profiles or create a custom voice that represents your brand perfectly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button asChild className="rounded-md">
                    <Link href="/voice-demo">
                      Try Voice Demo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -z-10 size-full rounded-full bg-blue-500/5 blur-3xl"></div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold">Outbound Call</h4>
                          <p className="text-sm text-muted-foreground">via Twilio + ElevenLabs</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">2:34</div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                          <span className="text-xs font-medium">AI</span>
                        </div>
                        <div className="bg-secondary rounded-lg p-3 text-sm">
                          <p>
                            Hello, this is Starlis calling on behalf of John Smith. I'd like to reschedule his dental
                            appointment for next week. Do you have any availability on Tuesday or Wednesday?
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-primary/10 rounded-lg p-3 text-sm">
                          <p>
                            Yes, we have an opening on Tuesday at 2:00 PM or Wednesday at 10:00 AM. Which would work
                            better?
                          </p>
                        </div>
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                          <span className="text-xs font-medium">RC</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                          <span className="text-xs font-medium">AI</span>
                        </div>
                        <div className="bg-secondary rounded-lg p-3 text-sm">
                          <p>
                            Wednesday at 10:00 AM would be perfect. Could you please confirm this appointment for John
                            Smith?
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-red-500"
                        >
                          <path d="M10.5 16.5 7.5 19.5 4.5 16.5" />
                          <path d="M7.5 4.5v15" />
                          <path d="M13.5 7.5 16.5 4.5l3 3" />
                          <path d="M16.5 19.5v-15" />
                        </svg>
                      </div>
                      <div className="size-12 rounded-full bg-red-500 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </div>
                      <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-blue-500"
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-secondary/30 border-y border-border py-12 sm:py-20 overflow-hidden">
            <div className="container px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-16 w-full">
                <h2 className="text-3xl font-bold">How Starlis's Voice Technology Works</h2>
                <p className="text-xl text-muted-foreground">A seamless process from text to natural speech</p>
              </div>

              <div className="relative">
                <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border"></div>

                <div className="grid gap-12">
                  <div className="relative grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
                    <div className="md:text-right space-y-4">
                      <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm">
                        <span className="font-medium">Step 1</span>
                      </div>
                      <h3 className="text-2xl font-semibold">Natural Language Processing</h3>
                      <p className="text-muted-foreground">
                        Our advanced AI understands the context and intent of your requests, determining what needs to be
                        communicated.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-4 top-1/2 size-8 -translate-y-1/2 rounded-full border-4 border-background bg-primary"></div>
                      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-500"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4" />
                              <path d="M12 8h.01" />
                            </svg>
                          </div>
                          <h4 className="font-semibold">Intent Analysis</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "Call my dentist to reschedule my appointment for next week"
                        </p>
                        <div className="mt-3 p-3 bg-secondary rounded-md text-xs">
                          <p className="font-medium">Identified Intent:</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>• Action: Reschedule appointment</li>
                            <li>• Contact: Dentist</li>
                            <li>• Timeframe: Next week</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
                    <div className="order-2 md:order-1 relative">
                      <div className="absolute -right-4 top-1/2 size-8 -translate-y-1/2 rounded-full border-4 border-background bg-primary"></div>
                      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-purple-500"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <h4 className="font-semibold">Response Generation</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          AI generates natural, contextually appropriate responses for the conversation
                        </p>
                        <div className="mt-3 p-3 bg-secondary rounded-md text-xs">
                          <p className="font-medium">Generated Script:</p>
                          <p className="mt-1 text-muted-foreground">
                            "Hello, this is calling on behalf of [Name]. I'd like to reschedule their dental appointment
                            for next week. Do you have any availability on Tuesday or Wednesday?"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="order-1 md:order-2 md:text-left space-y-4">
                      <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm">
                        <span className="font-medium">Step 2</span>
                      </div>
                      <h3 className="text-2xl font-semibold">Conversational AI</h3>
                      <p className="text-muted-foreground">
                        Our system crafts natural-sounding responses and can handle complex, multi-turn conversations with
                        ease.
                      </p>
                    </div>
                  </div>

                  <div className="relative grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
                    <div className="md:text-right space-y-4">
                      <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm">
                        <span className="font-medium">Step 3</span>
                      </div>
                      <h3 className="text-2xl font-semibold">Voice Synthesis with ElevenLabs</h3>
                      <p className="text-muted-foreground">
                        ElevenLabs' cutting-edge voice technology converts text to incredibly natural speech with proper
                        emotion and intonation.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-4 top-1/2 size-8 -translate-y-1/2 rounded-full border-4 border-background bg-primary"></div>
                      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-500"
                            >
                              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                              <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                          </div>
                          <h4 className="font-semibold">Voice Rendering</h4>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs">AI</span>
                            </div>
                            <span className="text-sm font-medium">Rachel Voice</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="size-8 rounded-full bg-secondary flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </button>
                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="w-3/4 h-full bg-blue-500"></div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-secondary rounded-md text-xs">
                          <p className="font-medium">Voice Features:</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>• Natural pauses and emphasis</li>
                            <li>• Emotional inflection</li>
                            <li>• Human-like pronunciation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
                    <div className="order-2 md:order-1 relative">
                      <div className="absolute -right-4 top-1/2 size-8 -translate-y-1/2 rounded-full border-4 border-background bg-primary"></div>
                      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-orange-500"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                          </div>
                          <h4 className="font-semibold">Twilio Call Delivery</h4>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-green-500 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white"
                              >
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                          <span className="text-xs text-muted-foreground">2:34</span>
                        </div>
                        <div className="mt-3 p-3 bg-secondary rounded-md text-xs">
                          <p className="font-medium">Call Details:</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>• Global reach via Twilio network</li>
                            <li>• Real-time audio processing</li>
                            <li>• Call recording and transcription</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="order-1 md:order-2 md:text-left space-y-4">
                      <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm">
                        <span className="font-medium">Step 4</span>
                      </div>
                      <h3 className="text-2xl font-semibold">Twilio Call Delivery</h3>
                      <p className="text-muted-foreground">
                        Twilio's reliable infrastructure connects the call to the recipient with crystal-clear audio
                        quality and global reach.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="bg-secondary/50 border-y border-border">
            <div className="container py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-8 sm:mb-16 w-full">
                <h2 className="text-3xl font-bold">What our users say</h2>
                <p className="text-xl text-muted-foreground">Join thousands of professionals saving time with Starlis</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center mb-4">
                    <div className="size-10 rounded-full bg-secondary mr-3"></div>
                    <div>
                      <h4 className="font-semibold">Sarah Johnson</h4>
                      <p className="text-sm text-muted-foreground">Marketing Director</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "Starlis has completely transformed how I manage my day. I save at least 10 hours every week on
                    administrative tasks that used to eat up my schedule."
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center mb-4">
                    <div className="size-10 rounded-full bg-secondary mr-3"></div>
                    <div>
                      <h4 className="font-semibold">Michael Chen</h4>
                      <p className="text-sm text-muted-foreground">Startup Founder</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "As a founder, my time is incredibly valuable. Starlis handles all my scheduling and follow-ups, which
                    lets me focus on growing my business instead of managing my calendar."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="container py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-8 sm:mb-16 w-full">
              <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
              <p className="text-xl text-muted-foreground">Start for free, upgrade when you're ready</p>

              {/* Billing Toggle */}
              <BillingToggle />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto h-full">
              <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Free</h3>
                  <p className="text-muted-foreground mb-4">For individuals just getting started</p>
                  <p className="text-4xl font-bold mb-1">$0</p>
                  <p className="text-sm text-muted-foreground mb-6">Forever free</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>5 AI calls per month</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Basic email management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Calendar scheduling</span>
                    </li>
                  </ul>
                </div>
                <Button asChild variant="outline" className="w-full rounded-md">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>

              <div className="rounded-lg border-2 border-primary p-6 relative flex flex-col h-full">
                <div className="flex-1">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 transform translate-y-[-50%]">
                    MOST POPULAR
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Pro</h3>
                  <p className="text-muted-foreground mb-4">For professionals and small teams</p>
                  <div className="monthly-price">
                    <p className="text-4xl font-bold mb-1">
                      $20<span className="text-base font-normal text-muted-foreground">/mo</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">Billed monthly</p>
                  </div>
                  <div className="yearly-price hidden">
                    <p className="text-4xl font-bold mb-1">
                      $17<span className="text-base font-normal text-muted-foreground">/mo</span>
                    </p>
                    <p className="text-sm text-green-500 mb-6">Billed annually ($200/year) - 2 months free!</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>50 AI calls per month</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Advanced email management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Priority scheduling</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Meeting summaries</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>API access</span>
                    </li>
                  </ul>
                </div>
                <Button asChild className="w-full rounded-md">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                  <p className="text-muted-foreground mb-4">For larger organizations</p>
                  <p className="text-4xl font-bold mb-1">Custom</p>
                  <p className="text-sm text-muted-foreground mb-6">Contact us for pricing</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Unlimited AI calls</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Full email suite</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Team management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>SSO/LDAP integration</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>All integrations included</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                </div>
                <Button asChild variant="outline" className="w-full rounded-md">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="relative overflow-hidden bg-primary/5 dark:bg-primary/10">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-500/20 via-red-500/10 to-purple-600/20 opacity-50">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-600 to-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-4xl mx-auto text-center space-y-6 w-full">
                <div className="inline-flex items-center rounded-full border border-primary/20 dark:border-white/20 bg-primary/5 dark:bg-white/10 backdrop-blur-sm px-3 py-1 text-sm mb-4">
                  <span className="text-primary dark:text-white font-medium">JOIN THE REVOLUTION</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white">Ready to give your AI assistant a voice?</h2>
                <p className="text-xl text-primary/90 dark:text-white/90">
                  Join thousands of professionals who trust Starlis to handle their daily tasks with human-like voice
                  capabilities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mx-auto justify-center pt-4 max-w-md">
                  <Button asChild size="lg" className="rounded-full bg-white text-pink-600 hover:bg-white/90">
                    <Link href="/signup">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <Link href="/voice-demo">Try Voice Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border bg-background">
          <div className="container py-12 px-4 sm:px-6 lg:px-8 rounded-t-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2">
                <div className="flex items-center mb-4">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/circle-with-irregular-shape-inside-svgrepo-com-krMECzHbCO4kkkJCa2jNlslczUaIzc.svg"
                    alt="Starlis Logo"
                    className="h-8 mr-2 dark:brightness-0 dark:invert"
                  />
                  <span className="text-lg font-semibold">starlis.ai</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your AI assistant for effortless productivity that handles your daily tasks so you can focus on what
                  matters most.
                </p>
                <div className="flex space-x-4">
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-4">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/integrations" className="text-sm text-muted-foreground hover:text-foreground">
                      Integrations
                    </Link>
                  </li>
                  <li>
                    <Link href="/voice" className="text-sm text-muted-foreground hover:text-foreground">
                      Voice AI
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-4">Integrations</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/integrations/twilio" className="text-sm text-muted-foreground hover:text-foreground">
                      Twilio
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/integrations/elevenlabs"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ElevenLabs
                    </Link>
                  </li>
                  <li>
                    <Link href="/integrations/google" className="text-sm text-muted-foreground hover:text-foreground">
                      Google Calendar
                    </Link>
                  </li>
                  <li>
                    <Link href="/integrations/outlook" className="text-sm text-muted-foreground hover:text-foreground">
                      Microsoft Outlook
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground">
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Starlis. All rights reserved.</p>

              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <p className="text-sm text-muted-foreground">Made with ❤️ in Virginia</p>

                {/* Theme Toggle */}
                <div className="flex items-center space-x-2">
                  <ThemeToggleButton />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
} 