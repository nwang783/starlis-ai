import Image from "next/image"

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="/starlis_cutout.svg"
      alt="Starlis Logo"
      width={32}
      height={32}
      className={className}
    />
  )
}

