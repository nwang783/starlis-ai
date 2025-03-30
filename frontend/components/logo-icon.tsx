import Image from "next/image"

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/circle-with-irregular-shape-inside-svgrepo-com-krMECzHbCO4kkkJCa2jNlslczUaIzc.svg"
      alt="Starlis Logo"
      width={32}
      height={32}
      className={className}
    />
  )
}

