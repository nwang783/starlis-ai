import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">AI Secretary</span>
          </Link>
          {!minimal && (
            <nav className="hidden md:flex gap-6 ml-6">
              <Link href="/#features" className="text-sm font-medium transition-colors hover:text-primary">
                Features
              </Link>
              <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
                Pricing
              </Link>
              <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
                About
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!minimal && (
            <>
              <Link href="/login">
                <Button variant="outline" className="rounded-3xl">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-3xl">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

