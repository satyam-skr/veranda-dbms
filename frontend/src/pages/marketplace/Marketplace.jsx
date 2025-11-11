import { useState } from "react"
import Header from "@/components/Header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMarketplaceListings } from "@/hooks/useMarketplace"
import { Plus, Store, Search, RefreshCw, ShoppingBag, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MarketplaceItemCard } from "@/components/bidder/MarketplaceItemCard"
import { CreateItemForm } from "@/components/seller/CreateItemForm"

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState("browse")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [sortBy, setSortBy] = useState("newest")
  
  // Fetch marketplace listings with filters
  const { 
    data: listingsResponse, 
    isLoading: isLoadingListings, 
    error: listingsError,
    refetch: refetchListings 
  } = useMarketplaceListings({ 
    status: statusFilter,
    search: searchQuery || undefined,
    limit: 50 
  })

  const allListings = listingsResponse?.data || []

  const handleRefresh = () => {
    refetchListings()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    refetchListings()
  }

  // Sort listings
  const sortedListings = [...allListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price)
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price)
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Marketplace</h1>
            <p className="text-lg text-muted-foreground">Buy, sell, and trade items within the campus community</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Browse Items
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                List Item
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-border p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search items, brands, or categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-base"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="all">All Listings</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit"
                      className="flex-1 md:flex-none h-11"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={isLoadingListings}
                      className="h-11"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingListings ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Stats Bar */}
              {sortedListings.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white dark:bg-slate-950 rounded-lg p-4 border border-border flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{sortedListings.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {listingsError && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertDescription className="text-destructive">
                    Failed to load listings: {listingsError?.message || "Please try again"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Loading State */}
              {isLoadingListings ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Spinner className="h-12 w-12 mb-4" />
                  <p className="text-lg text-muted-foreground">Fetching amazing deals...</p>
                </div>
              ) : sortedListings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-muted rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                    <Store className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {searchQuery || statusFilter !== 'active' ? 'No listings found' : 'No items available yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchQuery || statusFilter !== 'active' 
                      ? 'Try adjusting your search or filters to find what you are looking for' 
                      : 'Be the first to list an item! Start selling now and reach the community'
                    }
                  </p>
                  <Button size="lg" onClick={() => setActiveTab("create")}>
                    <Plus className="h-5 w-5 mr-2" />
                    List Your Item
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                      {searchQuery ? `Search Results` : 'Featured Items'}
                    </h2>
                    <p className="text-muted-foreground">
                      Showing {sortedListings.length} {sortedListings.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedListings.map(listing => (
                      <MarketplaceItemCard
                        key={listing.listing_id}
                        listing={listing}
                        onActionComplete={refetchListings}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create">
              <div className="max-w-2xl mx-auto">
                <CreateItemForm onSuccess={() => {
                  refetchListings()
                  setActiveTab("browse")
                }} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default Marketplace
