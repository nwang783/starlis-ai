import Link from "next/link"
import { ArrowRight, Bot, Calendar, Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8" />
            <span className="text-xl font-bold">AI Secretary</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/login" className="hidden md:block">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 md:py-32 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Your AI-Powered Personal Secretary</h1>
            <p className="text-xl text-muted-foreground max-w-[800px]">
              Manage meetings, emails, and calls with an intelligent AI assistant that works for you 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border shadow-xl">
            <img src="/placeholder.svg?height=600&width=1200" alt="AI Secretary Dashboard" className="w-full h-auto" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-24">
          <div className="container space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
                Everything you need to manage your schedule and communications efficiently.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background rounded-3xl p-8 shadow-sm border space-y-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Meeting Management</h3>
                <p className="text-muted-foreground">
                  Schedule, reschedule, and cancel meetings with natural language commands.
                </p>
              </div>

              <div className="bg-background rounded-3xl p-8 shadow-sm border space-y-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Email Handling</h3>
                <p className="text-muted-foreground">
                  Send, receive, and organize emails based on priority and content.
                </p>
              </div>

              <div className="bg-background rounded-3xl p-8 shadow-sm border space-y-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Voice Calls</h3>
                <p className="text-muted-foreground">
                  Make calls on your behalf and provide detailed summaries afterward.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24 md:py-32">
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-16 shadow-xl">
            <div className="max-w-[800px] mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Ready to boost your productivity?</h2>
              <p className="text-xl opacity-90">
                Join thousands of professionals who save hours every week with AI Secretary.
              </p>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="mt-4">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 md:py-16">
        <div className="container space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-[300px]">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <span className="text-lg font-bold">AI Secretary</span>
              </div>
              <p className="text-muted-foreground">
                Your intelligent AI assistant that manages your meetings, emails, and calls.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="font-medium">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Browser Extension
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Cookie Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AI Secretary. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

