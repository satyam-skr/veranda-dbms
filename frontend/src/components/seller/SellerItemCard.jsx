import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Clock, DollarSign, User, Phone, Mail } from "lucide-react"
import { useState } from "react"
import { bidsApi } from "@/services/mockApi"

export const SellerItemCard = ({ item }) => {
  const [bids, setBids] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const loadBids = async () => {
    setIsLoading(true)
    try {
      const itemBids = await bidsApi.getByItemId(item.id)
      setBids(itemBids)
    } catch (error) {
      console.error("Failed to load bids:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const daysLeft = Math.ceil(
    (new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="object-cover w-full h-full"
        />
        <Badge className="absolute top-2 right-2 bg-background/90 backdrop-blur">
          {item.status}
        </Badge>
      </div>

      <CardHeader className="space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-1" />
            Starting Price
          </div>
          <span className="font-medium">${item.startingPrice}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-1" />
            Current Highest
          </div>
          <span className="font-bold text-success">
            ${item.currentHighestBid}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            Time Left
          </div>
          <span className="font-medium">{daysLeft} days</span>
        </div>
      </CardContent>

      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" onClick={loadBids}>
              View Bids ({bids.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bids for {item.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">
                  Loading bids...
                </p>
              ) : bids.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bids yet
                </p>
              ) : (
                bids.map(bid => (
                  <Card key={bid.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">${bid.amount}</h4>
                        <Badge
                          variant={
                            bid.amount === item.currentHighestBid
                              ? "default"
                              : "secondary"
                          }
                        >
                          {bid.amount === item.currentHighestBid
                            ? "Highest"
                            : "Outbid"}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{bid.bidderName}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{bid.bidderEmail}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{bid.bidderPhone}</span>
                        </div>
                        <p className="text-muted-foreground mt-2">
                          {new Date(bid.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
