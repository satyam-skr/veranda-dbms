import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
// import { useAuth } from "@/contexts/AuthContext"
import { Store, TrendingUp, Package, Users } from "lucide-react"

const Dashboard = () => {
  // const { user } = useAuth()

  const stats = [
    {
      title: "Active Listings",
      value: "0",
      description: "Items you are selling",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Active Bids",
      value: "0",
      description: "Your current bids",
      icon: TrendingUp,
      color: "text-accent"
    },
    {
      title: "Total Sales",
      value: "$0",
      description: "All time earnings",
      icon: Store,
      color: "text-success"
    },
    {
      title: "Community",
      value: "1",
      description: "Active users",
      icon: Users,
      color: "text-muted-foreground"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back,  
          </h2>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your Veranda activity
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest transactions and bids
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity yet. Visit the marketplace to get started!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a
                  href="/marketplace"
                  className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="font-medium">Browse Marketplace</div>
                  <div className="text-sm text-muted-foreground">
                    Find items to bid on
                  </div>
                </a>
                <a
                  href="/marketplace"
                  className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="font-medium">List New Item</div>
                  <div className="text-sm text-muted-foreground">
                    Sell something from your hostel room
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
