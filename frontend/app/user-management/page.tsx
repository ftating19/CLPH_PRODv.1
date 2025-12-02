"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/dashboard/layout"
import UserManagement from "@/components/pages/user-management"
import { useUser } from "@/contexts/UserContext"
import { toast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const router = useRouter()
  const { currentUser, isLoading } = useUser()

  useEffect(() => {
    // Don't check while loading
    if (isLoading) return

    // Check if user is authenticated (client-side only)
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem("user")
      if (!user && !currentUser) {
        router.push("/login")
        return
      }

      // Check if user is admin
      const userData = currentUser || JSON.parse(user || '{}')
      const userRole = userData.role?.toLowerCase()
      
      if (userRole !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access User Management. This page is restricted to administrators only.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }
    }
  }, [router, currentUser, isLoading])

  // Show loading while checking authentication and authorization
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <UserManagement />
    </Layout>
  )
}
