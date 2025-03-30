import { NoiseTexture } from "@/components/noise-texture"

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-background">
      <NoiseTexture className="w-full h-full">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold">Page with Noise Texture</h1>
          <p className="mt-4">This page has a subtle noise texture overlay that adds depth and character.</p>
        </div>
      </NoiseTexture>
    </div>
  )
}

