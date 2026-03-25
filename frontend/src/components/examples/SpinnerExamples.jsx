import { Spinner } from "@/components/ui/spinner"

/**
 * Example: Using the Spinner Component
 * The spinner is perfect for showing loading states
 */

export function LoadingExample() {
  return (
    <div className="flex items-center gap-2">
      <Spinner />
      <span>Loading...</span>
    </div>
  )
}

/**
 * Example: Custom Spinner with Different Sizes
 */
export function CustomSpinnerSizes() {
  return (
    <div className="flex gap-4">
      {/* Small spinner (default) */}
      <Spinner className="size-4" />
      
      {/* Medium spinner */}
      <Spinner className="size-6" />
      
      {/* Large spinner */}
      <Spinner className="size-8" />
    </div>
  )
}

/**
 * Example: Spinner with Custom Colors
 */
export function ColoredSpinner() {
  return (
    <div className="flex gap-4">
      {/* Default color */}
      <Spinner />
      
      {/* Primary color */}
      <Spinner className="text-primary" />
      
      {/* Accent color */}
      <Spinner className="text-accent" />
      
      {/* Destructive color */}
      <Spinner className="text-destructive" />
    </div>
  )
}

/**
 * Example: Spinner in a Button
 */
export function LoadingButton() {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
    >
      {isLoading && <Spinner className="size-4" />}
      {isLoading ? "Loading..." : "Click Me"}
    </button>
  )
}

/**
 * Example: Spinner Overlay
 */
export function SpinnerOverlay() {
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <div className="relative w-full h-96 border border-gray-200 rounded">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Content Area</h2>
        <p>This content will be obscured when loading...</p>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
          <Spinner className="size-8 text-white" />
        </div>
      )}

      <button
        onClick={() => setIsLoading(!isLoading)}
        className="mt-4 px-4 py-2 bg-primary text-white rounded"
      >
        {isLoading ? "Stop Loading" : "Start Loading"}
      </button>
    </div>
  )
}
