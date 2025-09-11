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

  // Check if session time has passed and should be marked as expired
  const isSessionExpired = (booking: Booking): boolean => {
    if (!booking.start_date || !booking.preferred_time) return false
    
    try {
      const sessionDate = new Date(booking.start_date)
      const [timeRange] = booking.preferred_time.split(' - ')
      const [hours, minutes] = timeRange.split(':').map(Number)
      
      // Set the session time
      sessionDate.setHours(hours, minutes, 0, 0)
      
      // Add 1 hour for session duration
      const sessionEndTime = new Date(sessionDate.getTime() + (60 * 60 * 1000))
      
      // Check if current time is past session end time
      return new Date() > sessionEndTime
    } catch (error) {
      console.error('Error parsing session time:', error)
      return false
    }
  }

  // Auto-expire sessions that have passed their scheduled time
  const autoCompleteExpiredSessions = async (sessions: Booking[]) => {
    const expiredSessions = sessions.filter(booking => 
      booking.status === 'accepted' && isSessionExpired(booking)
    )
    
    if (expiredSessions.length > 0) {
      console.log(`Auto-expiring ${expiredSessions.length} expired sessions`)
      
      // Update each expired session to completed (but will show as expired in UI)
      const updatePromises = expiredSessions.map(async (session) => {
        try {
          const response = await fetch(`http://localhost:4000/api/sessions/${session.booking_id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Completed" })
          })
          return await response.json()
        } catch (error) {
          console.error(`Failed to auto-expire session ${session.booking_id}:`, error)
          return null
        }
      })
      
      await Promise.all(updatePromises)
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        expiredSessions.some(expired => expired.booking_id === booking.booking_id)
          ? { ...booking, status: "Completed" }
          : booking
      ))
    }
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
        // Auto-expire sessions that have passed their scheduled time before setting the state
        await autoCompleteExpiredSessions(data.sessions)
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
  const StatusBadge = ({ status, isExpired }: { status?: string; isExpired?: boolean }) => {
    const getStatusConfig = (status?: string, isExpired?: boolean) => {
      if (isExpired && status?.toLowerCase() !== 'completed') {
        return { variant: 'secondary' as const, bg: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Expired' }
      }
      
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

    const config = getStatusConfig(status, isExpired)
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
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Sessions Found</h3>
              <p className="text-gray-500 dark:text-gray-400">No tutor sessions found. Book a session to get started!</p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isCompleted = booking.status?.toLowerCase() === 'completed' || isSessionExpired(booking)
              const cardClassName = isCompleted 
                ? "transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/50 opacity-75 cursor-not-allowed"
                : "hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 dark:hover:border-blue-400"
              
              return (
              <Card key={booking.booking_id} className={cardClassName}>
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
                        <StatusBadge status={booking.status} isExpired={isSessionExpired(booking)} />
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

                  {/* Completion Status for Expired Sessions */}
                  {isSessionExpired(booking) && booking.status?.toLowerCase() !== 'completed' && (
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-400">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Session automatically marked as expired</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This session has passed its scheduled time and was marked as expired.
                      </p>
                    </div>
                  )}

                  {/* Completed Status for Manually Completed Sessions */}
                  {booking.status?.toLowerCase() === 'completed' && !isSessionExpired(booking) && (
                    <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-center space-x-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Session completed successfully</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        This session was manually marked as completed by the participant.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-4 border-t">
                    <div className="flex space-x-2">
                      {/* Tutor Accept/Reject Buttons - Only for pending sessions */}
                      {currentUser?.user_id === booking.tutor_id && 
                       (booking.status === "Pending" || booking.status === "pending") && 
                       !isSessionExpired(booking) && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.booking_id, "Accepted")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleStatusUpdate(booking.booking_id, "Declined")}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Tutor Mark Complete Button - Only for accepted sessions that haven't expired */}
                      {currentUser?.user_id === booking.tutor_id && 
                       (booking.status === "Accepted" || booking.status === "accepted") && 
                       !isSessionExpired(booking) && (
                        <Button 
                          size="sm"
                          onClick={() => handleComplete(booking.booking_id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}

                      {/* Student Mark Complete Button - Only for accepted sessions that haven't expired */}
                      {currentUser?.user_id === booking.student_id && 
                       (booking.status === "Accepted" || booking.status === "accepted") && 
                       !isSessionExpired(booking) && (
                        <Button 
                          size="sm"
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
            )})
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
                  className="flex-1"
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
