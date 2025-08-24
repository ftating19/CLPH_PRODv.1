"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/dashboard/layout"
import AdminDashboard from "@/components/pages/admin-dashboard"

export default function AdminDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
      return
    }
  }, [router])

  return (
    <Layout>
      <AdminDashboard />
    </Layout>
  )
}
