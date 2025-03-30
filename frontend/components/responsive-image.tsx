import type React from "react"

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ src, alt, className = "", width = 800, height = 600 }) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="w-full h-auto object-cover"
        style={{ maxWidth: "100%" }}
        width={width}
        height={height}
      />
    </div>
  )
}

export default ResponsiveImage

