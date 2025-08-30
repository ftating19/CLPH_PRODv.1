"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import Layout from "@/components/dashboard/layout"
import { useUser } from "@/contexts/UserContext"

// Updated booking data structure
interface Booking {
  booking_id: number
  tutor_id: number
  tutor_name: string
  student_id: number
  student_name: string
  booking_schedule: string
  start_date?: string
  end_date?: string
  rating: number | null
  remarks: string | null
  status?: string // Added status property, optional
}

export default function TutorSessionPage() {
  // Helper to format date as yyyy-mm-dd
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toISOString().slice(0, 10);
  };
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useUser()

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        let url = `http://localhost:4000/api/sessions`;
        // For admin and faculty, show all transactions
        const role = currentUser?.role?.toLowerCase();
        if (role !== "admin" && role !== "faculty") {
          url += `?user_id=${currentUser.user_id}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        if (data.success && Array.isArray(data.sessions)) {
          setBookings(data.sessions);
        } else {
          setBookings([]);
        }
      } catch {
        setBookings([]);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [currentUser]);

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
                  <CardTitle className="text-lg font-bold">{booking.tutor_name}</CardTitle>

                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">Requester:</span> {booking.student_name}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">Tutor:</span> {booking.tutor_name}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">Status:</span> {booking.status || "Pending"}
                  </div>
                  {/* Rating hidden for now */}
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">Start Date:</span> {formatDate(booking.start_date)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">End Date:</span> {formatDate(booking.end_date)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">Remarks:</span> {booking.remarks || "No remarks."}
                  </div>
                  {/* Student ID hidden for now */}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
