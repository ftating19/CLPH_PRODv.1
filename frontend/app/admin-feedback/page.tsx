"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/dashboard/layout"
import AdminFeedbackManagement from "@/components/pages/admin-feedback-management"
import { useUser } from "@/contexts/UserContext"

export default function AdminFeedbackPage() {
  const router = useRouter()
  const { currentUser } = useUser()

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem("user")
      if (!user) {
        router.push("/login")
        return
      }
    }
  }, [router])

  useEffect(() => {
    // Redirect non-admin users
    if (currentUser && currentUser.role !== 'Admin') {
      router.push("/dashboard")
    }
  }, [currentUser, router])

  return (
    <Layout>
      <AdminFeedbackManagement />
    </Layout>
  )
}