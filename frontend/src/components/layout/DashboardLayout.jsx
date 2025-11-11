// import { useAuth } from "../../context/AuthContext"
import { Navigate } from "react-router-dom"
import { Navbar } from "@/components/shared/Navbar"

export const DashboardLayout = ({ children }) => {
  // const { user, isLoading } = useAuth()

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       Loading...
  //     </div>
  //   )
  // }

  // if (!user) {
  //   return <Navigate to="/login" replace />
  // }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
