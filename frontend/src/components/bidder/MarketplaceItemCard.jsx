import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, User, Package, Calendar, MapPin, Heart, Share2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export const MarketplaceItemCard = ({ listing, onActionComplete }) => {
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", message: "" })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return formatDate(dateString)
  }

  // Handle item purchase/contact
  const handleContactSeller = async () => {
    if (!contactInfo.name || !contactInfo.email) {
      toast.error("Please fill in your contact information")
      return
    }

    setIsLoading(true)
    try {
      // Here you would typically send the contact info to the backend
      toast.success("Contact information sent to seller!")
      setIsOpen(false)
      setContactInfo({ name: "", email: "", message: "" })
      
      if (onActionComplete) {
        onActionComplete()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send contact information"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Get condition badge styling
  const getConditionColor = (condition) => {
    const conditionLower = condition?.toLowerCase() || ''
    if (conditionLower.includes('new') || conditionLower.includes('excellent')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    }
    if (conditionLower.includes('good')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
    }
    if (conditionLower.includes('fair') || conditionLower.includes('used')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  }

  // Get status badge styling
  const getStatusColor = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      case 'sold':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/50 flex flex-col h-full">
      {/* Image Container */}
      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 group">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <Package className="h-16 w-16 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge 
            className={`${getStatusColor(listing.item_status)} shadow-md`}
          >
            {listing.item_status === 'active' ? '🟢 Active' : '✓ Sold'}
          </Badge>
          <Badge 
            variant="secondary"
            className="bg-white/90 dark:bg-slate-950/90 shadow-md backdrop-blur"
          >
            {getTimeAgo(listing.created_at)}
          </Badge>
        </div>

        {/* Action buttons on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="space-y-1">
          <h3 className="font-bold text-base line-clamp-2 hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Hostel</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3 flex-grow">
        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ₹{parseFloat(listing.price).toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-muted-foreground">per item</span>
          </div>
        </div>

        {/* Description */}
        {listing.item_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.item_description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="text-center py-2 rounded-md bg-muted/50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground mb-1">Condition</p>
            <Badge variant="outline" className={getConditionColor(listing.condition)}>
              {listing.condition}
            </Badge>
          </div>
          <div className="text-center py-2 rounded-md bg-muted/50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground mb-1">Posted</p>
            <p className="text-xs font-medium">{formatDate(listing.created_at)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/50">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full h-11 font-semibold"
              disabled={listing.item_status !== 'active'}
              variant={listing.item_status === 'active' ? 'default' : 'secondary'}
            >
              {listing.item_status === 'active' ? 'Contact Seller' : 'No Longer Available'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Contact Seller
              </DialogTitle>
              <DialogDescription>
                Share your contact info to inquire about "{listing.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Item Preview */}
              <div className="bg-muted/50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">{listing.title}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold text-primary">₹{parseFloat(listing.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Condition:</span>
                  <Badge variant="outline" className={getConditionColor(listing.condition)}>
                    {listing.condition}
                  </Badge>
                </div>
              </div>

              {/* Contact Form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Your Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={contactInfo.name}
                    onChange={e => setContactInfo({...contactInfo, name: e.target.value})}
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Your Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={contactInfo.email}
                    onChange={e => setContactInfo({...contactInfo, email: e.target.value})}
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
                  <Input
                    id="message"
                    type="text"
                    placeholder="Any specific questions..."
                    value={contactInfo.message}
                    onChange={e => setContactInfo({...contactInfo, message: e.target.value})}
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleContactSeller}
                disabled={isLoading || !contactInfo.name || !contactInfo.email}
                className="w-full h-11 font-semibold"
              >
                {isLoading ? "Sending..." : "Send Inquiry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
