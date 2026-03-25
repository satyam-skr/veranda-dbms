import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
// import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Package, ShoppingBag, TrendingUp, Shield } from "lucide-react"

const Index = () => {
  const navigate = useNavigate()
  // const { user, isLoading } = useAuth()

  // useEffect(() => {
  //   if (!isLoading && user) {
  //     navigate("/dashboard")
  //   }
  // }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 mb-16">
          <div className="flex justify-center">
            <Package className="h-20 w-20 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
              Veranda
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Complete hostel management platform for buying, selling, and
              community living
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              className="text-lg px-8"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg shadow-md border space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Easy Listing</h3>
            <p className="text-muted-foreground">
              List your items in minutes with detailed descriptions and images.
              Reach buyers in your hostel community instantly.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md border space-y-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Competitive Bidding</h3>
            <p className="text-muted-foreground">
              Place bids on items you want and get the best deals. Track your
              bids in real-time and never miss an opportunity.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md border space-y-4">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold">Secure & Trusted</h3>
            <p className="text-muted-foreground">
              Connect directly with verified hostel members. Share contact
              information only when needed for a safe transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index
