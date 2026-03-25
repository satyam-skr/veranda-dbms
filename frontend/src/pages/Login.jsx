import { LoginForm } from "@/components/auth/LoginForm"
// import { useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"
import { Package } from "lucide-react"

const Login = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Veranda
          </h1>
          <p className="text-muted-foreground">
            Your complete hostel management platform
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

export default Login
