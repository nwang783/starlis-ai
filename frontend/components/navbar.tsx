import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo section - updated */}
          <Link href="/" className="flex items-center space-x-2" aria-label="Logo">
            <img
              src="/starlis_cutout.svg"
              alt="Starlis Logo"
              className="h-8 w-8"
              style={{ filter: 'invert(1)' }}
            />
            <span className="text-xl font-bold">Starlis</span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">{/* Profile dropdown */}</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

