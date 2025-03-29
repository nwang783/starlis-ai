import Link from "next/link"
import { CalendarIcon, InboxIcon, PhoneIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroScreen } from "@/components/hero-screen"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className=" flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 mr-8">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">STAR</span>
            </div>
            <span className="inline-block font-bold text-xl">Starlis</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 flex-1">
            <Link
              href="/features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              About
            </Link>
          </nav>
          <div className="flex items-center ml-auto space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hidden md:inline-block"
            >
              Login
            </Link>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your Starlis for Effortless Productivity
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Let our AI assistant handle your meetings, emails, and calls so you can focus on what matters most.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full">
                    <Link href="/features">Learn More</Link>
                  </Button>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="size-4" />
                    <span>Schedule meetings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <InboxIcon className="size-4" />
                    <span>Manage emails</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="size-4" />
                    <span>Make calls</span>
                  </div>
                </div>
              </div>
              <HeroScreen />
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-muted">
          <div className="px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Features</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Our Starlis handles a variety of tasks to keep your day running smoothly.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:max-w-none lg:grid-cols-3 mt-16">
              <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
                <div>
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CalendarIcon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Meeting Scheduling</h3>
                  <p className="text-muted-foreground">
                    Automatically schedule, reschedule, and cancel meetings based on your availability.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
                <div>
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <InboxIcon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Email Management</h3>
                  <p className="text-muted-foreground">
                    Send and receive emails, organize your inbox, and draft responses on your behalf.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
                <div>
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <PhoneIcon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Voice Calling</h3>
                  <p className="text-muted-foreground">
                    Make calls to book appointments, order food, or handle other tasks requiring voice communication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32">
          <div className="px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Pricing</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Choose the plan that's right for you.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3 mt-16">
              <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Basic</h3>
                  <p className="text-4xl font-bold">
                    $9<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-muted-foreground">Essential features for personal productivity.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Email management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Calendar scheduling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>10 AI calls per month</span>
                    </li>
                  </ul>
                </div>
                <Button className="mt-8 rounded-full">Get Started</Button>
              </div>
              <div className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 top-4 rotate-45 bg-primary px-10 py-1 text-primary-foreground text-xs font-medium">
                  Popular
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Professional</h3>
                  <p className="text-4xl font-bold">
                    $29<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-muted-foreground">Advanced features for busy professionals.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Everything in Basic</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Email drafting & responses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>50 AI calls per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Meeting summaries</span>
                    </li>
                  </ul>
                </div>
                <Button className="mt-8 rounded-full">Get Started</Button>
              </div>
              <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Enterprise</h3>
                  <p className="text-4xl font-bold">
                    $99<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-muted-foreground">Complete solution for teams and businesses.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Everything in Professional</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Unlimited AI calls</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Team management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <PlusIcon className="size-4 text-primary" />
                      <span>Custom integrations</span>
                    </li>
                  </ul>
                </div>
                <Button className="mt-8 rounded-full">Contact Sales</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted/40">
        <div className="py-12 px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="size-8 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">STAR</span>
                </div>
                <span className="font-bold">Starlis</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your intelligent AI assistant for effortless productivity.
              </p>
            </div>
            <div className="md:col-span-2 md:flex md:justify-end">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Product</p>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/features"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/pricing"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Pricing
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Company</p>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/about"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        About
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Blog
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Legal</p>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/privacy"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Privacy
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terms"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Terms
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Starlis. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
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
                  className="lucide lucide-twitter"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
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
                  className="lucide lucide-linkedin"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
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
                  className="lucide lucide-github"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

