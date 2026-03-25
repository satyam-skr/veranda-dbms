/**
 * Updated Marketplace Component with Real Spinner
 * Shows how to integrate the spinner component with your actual page
 */

import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Example: Marketplace with loading spinner
export function MarketplaceWithSpinner() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [items, setItems] = React.useState([])

  React.useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      // Your API call here
      // const items = await auctionService.getActiveAuctions()
      // setItems(items)
      
      // For demo, simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      setItems([
        { id: 1, title: "Item 1", price: 100 },
        { id: 2, title: "Item 2", price: 200 },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>

      {isLoading ? (
        // Loading state
        <div className="flex flex-col items-center justify-center min-h-96">
          <Spinner className="size-8 mb-4" />
          <p className="text-lg text-muted-foreground">Loading auctions...</p>
        </div>
      ) : items.length === 0 ? (
        // Empty state
        <Card className="text-center p-8">
          <p className="text-muted-foreground">No items available</p>
        </Card>
      ) : (
        // Items grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  ${item.price}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <button
        onClick={loadItems}
        disabled={isLoading}
        className="mt-6 px-4 py-2 bg-primary text-white rounded disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading && <Spinner className="size-4" />}
        Refresh
      </button>
    </div>
  )
}

// Example: Tab content with loading state
export function TabsWithSpinner() {
  const [activeTab, setActiveTab] = React.useState("active")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleTabChange = async (tab) => {
    setIsLoading(true)
    try {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      setActiveTab(tab)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="active" onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Spinner className="size-6 mr-2" />
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <TabsContent value="active">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold">Active Auctions</h3>
                {/* Active items here */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold">Upcoming Auctions</h3>
                {/* Upcoming items here */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold">Completed Auctions</h3>
                {/* Completed items here */}
              </CardContent>
            </Card>
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}

// Example: Dialog with spinner
export function DialogWithSpinner() {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Your API call here
      await new Promise(resolve => setTimeout(resolve, 2000))
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Open Dialog
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Confirm Action</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">Are you sure you want to proceed?</p>

              <div className="flex gap-4">
                <button
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border rounded disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <Spinner className="size-4" />}
                  {isLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
