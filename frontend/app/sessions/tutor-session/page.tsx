"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Star, Clock, Calendar, User, MessageCircle, CheckCircle, XCircle, Award, Loader2 } from "lucide-react"
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
  preferred_time?: string
  status?: string
}

export default function TutorSessionPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useUser()

  // State for rating modal
  const [showRatingModal, setShowRatingModal] = useState<{open: boolean, bookingId?: number}>({open: false})
  const [pendingRating, setPendingRating] = useState<number>(0)
  const [remarksInput, setRemarksInput] = useState<{[key:number]: string}>({})

  // Mark session as complete handler for student
  const handleStudentComplete = async (booking_id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      })
      const data = await res.json()
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: "Completed" } : b))
        // Show rating modal after marking as complete
        setShowRatingModal({open: true, bookingId: booking_id})
        setPendingRating(0)
      }
    } catch {
      // Optionally show error toast
    }
  }

  // Mark session as complete handler
  const handleComplete = async (booking_id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      })
      const data = await res.json()
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: "Completed" } : b))
      }
    } catch {
      // Optionally show error toast
    }
  }

  // Rating handler
  const handleRating = async (booking_id: number, rating: number, remarks: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, remarks })
      })
      const data = await res.json()
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, rating, remarks } : b))
      }
    } catch {
      // Optionally show error toast
    }
  }

  // Star rating UI
  const StarRating = ({ value, onChange, disabled }: { value: number, onChange: (v: number) => void, disabled?: boolean }) => (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          className={`transition-all duration-150 ease-in-out rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${disabled ? 'cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
          style={{ background: 'transparent', padding: '2px', border: 'none' }}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            fill={star <= value ? "#fbbf24" : "#e5e7eb"}
            stroke={star <= value ? "#f59e42" : "#d1d5db"}
            className={`w-5 h-5 drop-shadow ${star <= value ? '' : 'opacity-60'}`}
            style={{ transition: 'fill 0.2s, stroke 0.2s' }}
          />
        </button>
      ))}
    </div>
  )

  // Update booking status handler
  const handleStatusUpdate = async (booking_id: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status } : b))
      }
    } catch {
      // Optionally show error toast
    }
  }

  // Helper to format time range with AM/PM
  const formatTimeRange = (range?: string) => {
    if (!range) return "N/A"
    // Expecting format: "HH:mm - HH:mm"
    const [from, to] = range.split(" - ")
    const format = (t: string) => {
      if (!t) return ""
      const [h, m] = t.split(":")
      let hour = parseInt(h, 10)
      const minute = m || "00"
      const ampm = hour >= 12 ? "PM" : "AM"
      hour = hour % 12 || 12
      return `${hour}:${minute} ${ampm}`
    }
    return `${format(from)} - ${format(to)}`
  }

  // Helper to format date as yyyy-mm-dd
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "N/A"
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Refetch bookings helper
  const fetchBookings = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      let url = `http://localhost:4000/api/sessions`
      // For admin and faculty, show all transactions
      const role = currentUser?.role?.toLowerCase()
      if (role !== "admin" && role !== "faculty") {
        url += `?user_id=${currentUser.user_id}`
      }
      const response = await fetch(url)
      const data = await response.json()
      if (data.success && Array.isArray(data.sessions)) {
        setBookings(data.sessions)
      } else {
        setBookings([])
      }
    } catch {
      setBookings([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [currentUser])

  // Status badge component
  const StatusBadge = ({ status }: { status?: string }) => {
    const getStatusConfig = (status?: string) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return { variant: 'default' as const, bg: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' }
        case 'accepted':
          return { variant: 'secondary' as const, bg: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Accepted' }
        case 'declined':
          return { variant: 'destructive' as const, bg: 'bg-red-100 text-red-800', icon: XCircle, label: 'Declined' }
        default:
          return { variant: 'outline' as const, bg: 'bg-yellow-100 text-orange-800', icon: Clock, label: 'Pending' }
      }
    }

    const config = getStatusConfig(status)
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="ml-2">
        {config.label}
      </Badge>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tutor Sessions</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading sessions...</span>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sessions Found</h3>
              <p className="text-gray-500">No tutor sessions found. Book a session to get started!</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.booking_id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                {/* Card Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg font-semibold">
                        {booking.tutor_name
                          ? booking.tutor_name.split(" ").map((n) => n[0]).join("")
                          : 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{booking.tutor_name}</CardTitle>
                          <CardDescription className="text-base mt-1">
                            Session with {booking.student_name}
                          </CardDescription>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(booking.start_date)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTimeRange(booking.preferred_time)}
                        </div>
                      </div>
                      {/* Rating Display */}
                      {booking.rating && (
                        <div className="flex items-center text-sm font-semibold group relative mt-2" title={`Rated ${booking.rating} out of 5`}>
                          <span className="mr-1 text-yellow-700">Rating:</span>
                          <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                          <span className="ml-2 text-xs text-gray-500">{booking.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Session Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Student: {booking.student_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>End: {formatDate(booking.end_date)}</span>
                    </div>
                  </div>

                  {/* Remarks Section */}
                  {booking.remarks && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Remarks</Label>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {booking.remarks}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-4 border-t">
                    <div className="flex space-x-2">
                      {/* Tutor Accept/Reject Buttons */}
                      {currentUser?.user_id === booking.tutor_id && (booking.status === "Pending" || booking.status === "pending") && (
                        <>
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusUpdate(booking.booking_id, "Accepted")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleStatusUpdate(booking.booking_id, "Declined")}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Tutor Mark Complete Button */}
                      {currentUser?.user_id === booking.tutor_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                        <Button 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleComplete(booking.booking_id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}

                      {/* Student Mark Complete Button */}
                      {currentUser?.user_id === booking.student_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                        <Button 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleStudentComplete(booking.booking_id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}

                      {/* Student Rating Success Message */}
                      {currentUser?.user_id === booking.student_id && (booking.status === "Completed" || booking.status === "completed") && booking.rating && (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Thank you for rating!
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Rating Modal */}
        {showRatingModal.open && showRatingModal.bookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <Star className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Your Tutor</h3>
                <p className="text-gray-600">How was your tutoring session?</p>
              </div>

              <div className="flex justify-center mb-6">
                <StarRating
                  value={pendingRating}
                  onChange={r => setPendingRating(r)}
                  disabled={false}
                />
              </div>

              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </Label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mt-2"
                  rows={3}
                  placeholder="Share your experience with this tutor..."
                  value={remarksInput[showRatingModal.bookingId] || ""}
                  onChange={e => setRemarksInput(prev => ({ ...prev, [showRatingModal.bookingId!]: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowRatingModal({open: false})}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={pendingRating === 0}
                  onClick={async () => {
                    await handleRating(showRatingModal.bookingId!, pendingRating, remarksInput[showRatingModal.bookingId!] || "")
                    setShowRatingModal({open: false})
                    fetchBookings()
                  }}
                >
                  Submit Rating
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
