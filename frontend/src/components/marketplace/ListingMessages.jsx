import { useState, useEffect } from "react"
import { useMyListings, useListingBidders } from "@/hooks/useMarketplace"
import { MessageCircle, AlertCircle, User, DollarSign, Clock, Mail, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ListingMessageDetail } from "./ListingMessageDetail"

export const ListingMessages = () => {
  const [selectedListing, setSelectedListing] = useState(null)
  const [expandedMessages, setExpandedMessages] = useState(new Set())
  const [biddersData, setBiddersData] = useState({})
  const [loadingBidders, setLoadingBidders] = useState({})

  // Fetch user's listings
  const {
    data: myListingsResponse,
    isLoading: isLoadingListings,
    error: listingsError,
    refetch: refetchListings
  } = useMyListings()

  const myListings = myListingsResponse?.data || []

  // Fetch bidders for each listing
  useEffect(() => {
    const fetchAllBidders = async () => {
      for (const listing of myListings) {
        if (!biddersData[listing.listing_id]) {
          setLoadingBidders(prev => ({ ...prev, [listing.listing_id]: true }))
          try {
            const response = await fetch(
              `/api/marketplace/listings/${listing.listing_id}/bidders`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
            if (response.ok) {
              const data = await response.json()
              // Handle both array response and wrapped response
              const bidders = Array.isArray(data) ? data : data.data || []
              setBiddersData(prev => ({
                ...prev,
                [listing.listing_id]: bidders
              }))
            }
          } catch (error) {
            console.error(`Error fetching bidders for listing ${listing.listing_id}:`, error)
          } finally {
            setLoadingBidders(prev => ({ ...prev, [listing.listing_id]: false }))
          }
        }
      }
    }

    if (myListings.length > 0) {
      fetchAllBidders()
    }
  }, [myListings])

  // Get listings with messages (those that have bids/enquiries)
  const listingsWithMessages = myListings.filter(listing => {
    const bidders = biddersData[listing.listing_id]
    return bidders && bidders.length > 0
  })

  const toggleExpandMessage = (messageId) => {
    const newSet = new Set(expandedMessages)
    if (newSet.has(messageId)) {
      newSet.delete(messageId)
    } else {
      newSet.add(messageId)
    }
    setExpandedMessages(newSet)
  }

  if (selectedListing) {
    const listing = {
      ...selectedListing,
      bidders: biddersData[selectedListing.listing_id] || []
    }
    return (
      <ListingMessageDetail
        listing={listing}
        onBack={() => setSelectedListing(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 rounded-lg p-3">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Messages & Enquiries</h2>
          <p className="text-muted-foreground">See who's interested in your listings</p>
        </div>
      </div>

      {/* Error State */}
      {listingsError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-destructive">
            Failed to load your listings: {listingsError?.message || "Please try again"}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoadingListings ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-lg text-muted-foreground">Loading your listings...</p>
        </div>
      ) : myListings.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="bg-muted rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground">
              Create your first listing to start receiving enquiries from interested buyers
            </p>
          </CardContent>
        </Card>
      ) : listingsWithMessages.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="bg-muted rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">
              You have {myListings.length} listing{myListings.length !== 1 ? 's' : ''}, but haven't received any enquiries yet.
              Share your listings to get interested buyers!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Listings with Enquiries
              </h3>
              <p className="text-sm text-muted-foreground">
                {listingsWithMessages.length} of {myListings.length} listings have enquiries
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchListings}
            >
              Refresh
            </Button>
          </div>

          {listingsWithMessages.map((listing) => {
            const bidders = biddersData[listing.listing_id] || []
            const isLoading = loadingBidders[listing.listing_id]
            
            return (
              <Card key={listing.listing_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{listing.title}</CardTitle>
                        <Badge variant="secondary">
                          {bidders?.length || 0} {(bidders?.length || 0) !== 1 ? 'enquiries' : 'enquiry'}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ₹{parseFloat(listing.price).toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(listing.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setSelectedListing(listing)}
                      className="whitespace-nowrap"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      View All Messages
                    </Button>
                  </div>
                </CardHeader>

                {bidders && bidders.length > 0 && (
                  <CardContent>
                    <div className="space-y-3">
                      {bidders.slice(0, 3).map((bidder) => (
                        <div
                          key={bidder.bid_id}
                          className="p-4 bg-muted rounded-lg border border-border hover:bg-muted/80 transition-colors cursor-pointer"
                          onClick={() => toggleExpandMessage(bidder.bid_id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{bidder.bidder_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{bidder.bidder_email}</p>
                                </div>
                              </div>

                              {expandedMessages.has(bidder.bid_id) && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span>Offered: <strong>₹{parseFloat(bidder.bid_amount).toLocaleString('en-IN')}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span>{new Date(bidder.bid_time).toLocaleString('en-IN')}</span>
                                  </div>
                                  {bidder.bidder_email && (
                                    <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-border">
                                      <Mail className="h-4 w-4 text-orange-600" />
                                      <a
                                        href={`mailto:${bidder.bidder_email}`}
                                        className="text-primary hover:underline"
                                      >
                                        {bidder.bidder_email}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                ₹{parseFloat(bidder.bid_amount).toLocaleString('en-IN')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(bidders?.length || 0) > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setSelectedListing(listing)}
                        >
                          View all {bidders.length} enquiries
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
