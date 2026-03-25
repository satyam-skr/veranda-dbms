import { useState } from "react"
import { ArrowLeft, User, DollarSign, Clock, Mail, Phone, MessageSquare, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const ListingMessageDetail = ({ listing, onBack }) => {
  const [selectedBidder, setSelectedBidder] = useState(null)

  const bidders = listing.bidders || []
  const sortedBidders = [...bidders].sort(
    (a, b) => new Date(b.bid_time) - new Date(a.bid_time)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{listing.title}</h2>
          <p className="text-muted-foreground">
            {bidders.length} {bidders.length !== 1 ? 'interested buyers' : 'interested buyer'}
          </p>
        </div>
      </div>

      {/* Listing Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Listing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-2xl font-bold text-primary">
                ₹{parseFloat(listing.price).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Condition</p>
              <Badge variant="secondary">{listing.condition || 'Not specified'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={listing.item_status === 'active' ? 'default' : 'outline'}>
                {listing.item_status || 'active'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Posted</p>
              <p className="font-medium">
                {new Date(listing.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {bidders.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="bg-muted rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No enquiries yet</h3>
            <p className="text-muted-foreground">
              Share this listing to get interested buyers
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bidders List Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-2">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-4">
                Interested Buyers ({bidders.length})
              </h3>
              {sortedBidders.map((bidder) => (
                <button
                  key={bidder.bid_id}
                  onClick={() => setSelectedBidder(bidder)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedBidder?.bid_id === bidder.bid_id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{bidder.bidder_name}</p>
                  <p className={`text-xs truncate ${
                    selectedBidder?.bid_id === bidder.bid_id
                      ? 'text-primary-foreground/80'
                      : 'text-muted-foreground'
                  }`}>
                    ₹{parseFloat(bidder.bid_amount).toLocaleString('en-IN')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Bidder Detail */}
          <div className="lg:col-span-2">
            {selectedBidder ? (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{selectedBidder.bidder_name}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        Interested in your {listing.title}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  {/* Offer Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Offer Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-muted-foreground">Offered Price</span>
                        </div>
                        <p className="text-2xl font-bold">
                          ₹{parseFloat(selectedBidder.bid_amount).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-muted-foreground">Enquiry Time</span>
                        </div>
                        <p className="font-semibold">
                          {new Date(selectedBidder.bid_time).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {selectedBidder.bid_amount && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Offer:</strong> {(((parseFloat(selectedBidder.bid_amount) / parseFloat(listing.price)) - 1) * 100).toFixed(1)}% of asking price
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                    
                    {selectedBidder.bidder_email && (
                      <div className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                            <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Email</p>
                            <a
                              href={`mailto:${selectedBidder.bidder_email}`}
                              className="text-primary hover:underline font-medium break-all"
                            >
                              {selectedBidder.bidder_email}
                            </a>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={`mailto:${selectedBidder.bidder_email}`}>
                              Contact
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {!selectedBidder.bidder_email && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No contact information available for this buyer
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3 border-t pt-6">
                    <h3 className="font-semibold text-lg">Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedBidder.bidder_email && (
                        <Button
                          className="w-full"
                          asChild
                        >
                          <a href={`mailto:${selectedBidder.bidder_email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Reply via Email
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Save Enquiry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a buyer to view their details and enquiry
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
