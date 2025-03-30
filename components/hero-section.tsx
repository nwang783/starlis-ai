import type React from "react"

const HeroSection: React.FC = () => {
  return (
    <section className="container mx-auto py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6 w-full">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-gray-900">
          Welcome to Our Amazing Platform
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Discover a world of possibilities with our innovative solutions. We are here to help you achieve your goals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <a
            href="#"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Get Started
          </a>
          <a
            href="#"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

