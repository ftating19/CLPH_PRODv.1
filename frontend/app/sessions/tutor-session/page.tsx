"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import Layout from "@/components/dashboard/layout"
import { useUser } from "@/contexts/UserContext"

// Sample booking data structure
interface Booking {
  booking_id: number
  tutor_id: number
  name: string
  booking_schedule: string
  student_id: number
  rating: number | null
  remarks: string | null
}

export default function TutorSessionPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useUser()

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return
      setLoading(true)
      try {
        const response = await fetch(`/api/bookings?student_id=${currentUser.user_id}`)
        const data = await response.json()
        if (data.success) {
          setBookings(data.bookings)
        } else {
          setBookings([])
        }
      } catch {
        setBookings([])
      }
      setLoading(false)
    }
    fetchBookings()
  }, [currentUser])

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tutor Sessions</h1>
        <p className="text-muted-foreground">All your booked tutors and session details.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {loading ? (
            <div>Loading sessions...</div>
          ) : bookings.length === 0 ? (
            <div>No tutor sessions found.</div>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.booking_id} className="border-2 hover:border-blue-200">
                <CardHeader>
                  <CardTitle>{booking.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">Session: {booking.booking_schedule}</div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-2">
                    <span>Rating:</span>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={i < (booking.rating || 0) ? "text-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">Remarks: {booking.remarks || "No remarks."}</div>
                  <div className="text-xs text-muted-foreground">Student ID: {booking.student_id}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
