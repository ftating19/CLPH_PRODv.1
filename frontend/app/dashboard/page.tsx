"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/dashboard/layout"
import Dashboard from "@/components/dashboard/dashboard-content"
import { useUser } from "@/contexts/UserContext"

export default function DashboardPage() {
  const router = useRouter()
  const { currentUser, isLoading } = useUser()

  useEffect(() => {
    // Don't redirect while loading user data
    if (isLoading) return

    // Check if user is authenticated
    const user = localStorage.getItem("user")
    if (!user && !currentUser) {
      router.push("/login")
      return
    }

    // If we have user data, check their role for initial routing
    // This only applies when user first lands on /dashboard
    const userData = currentUser || JSON.parse(user || '{}')
    const userRole = userData.role?.toLowerCase()

    // Role-based initial routing - only redirect if coming from login
    const fromLogin = sessionStorage.getItem('fromLogin')
    if (fromLogin) {
      sessionStorage.removeItem('fromLogin')
      
      switch (userRole) {
        case 'admin':
          router.push('/admin-dashboard')
          return
        case 'faculty':
          router.push('/user-management')
          return
        case 'student':
          // Students stay on main dashboard
          break
        default:
          // Default to main dashboard for unknown roles
          break
      }
    }
  }, [router, currentUser, isLoading])

  // Show loading while checking authentication
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
      <Dashboard currentUser={currentUser} />
    </Layout>
  )
}
