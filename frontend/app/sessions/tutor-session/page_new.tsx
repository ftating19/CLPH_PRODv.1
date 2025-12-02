"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Clock, Calendar, User, MessageCircle, CheckCircle, XCircle, Award } from "lucide-react"
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
      
      // Include headers for faculty filtering
      const headers: Record<string, string> = {}
      if (role === "faculty" || role === "admin") {
        headers['x-user-id'] = currentUser.user_id.toString()
        headers['x-user-role'] = currentUser.role || ''
      }
      
      const response = await fetch(url, { headers })
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
          return { bg: 'bg-gradient-to-r from-green-50 to-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completed' }
        case 'accepted':
          return { bg: 'bg-gradient-to-r from-blue-50 to-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Accepted' }
        case 'declined':
          return { bg: 'bg-gradient-to-r from-red-50 to-red-100', text: 'text-red-800', icon: XCircle, label: 'Declined' }
        default:
          return { bg: 'bg-gradient-to-r from-yellow-50 to-orange-100', text: 'text-orange-800', icon: Clock, label: 'Pending' }
      }
    }

    const config = getStatusConfig(status)
    const IconComponent = config.icon

    return (
      <div className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold shadow-sm border border-opacity-20`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </div>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Tutor Sessions</h1>
                <p className="text-blue-100 text-lg mt-1">Manage your tutoring sessions and bookings</p>
              </div>
            </div>
          </div>

          {/* Session Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading sessions...</p>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sessions Found</h3>
                <p className="text-gray-500">No tutor sessions found. Book a session to get started!</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {bookings.map((booking) => (
                <Card key={booking.booking_id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden">
                  {/* Card Header with Gradient */}
                  <CardHeader className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-full p-2">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold">{booking.tutor_name}</CardTitle>
                          <p className="text-blue-100 text-sm">Tutor Session</p>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    {/* Session Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">Student</span>
                        </div>
                        <p className="text-gray-800 font-medium text-sm">{booking.student_name}</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">Start Date</span>
                        </div>
                        <p className="text-gray-800 font-medium text-sm">{formatDate(booking.start_date)}</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-gray-700">End Date</span>
                        </div>
                        <p className="text-gray-800 font-medium text-sm">{formatDate(booking.end_date)}</p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-gray-700">Time</span>
                        </div>
                        <p className="text-gray-800 font-medium text-sm">{formatTimeRange(booking.preferred_time)}</p>
                      </div>
                    </div>

                    {/* Remarks Section */}
                    {booking.remarks && (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">Remarks</span>
                        </div>
                        <p className="text-gray-600 text-sm italic">{booking.remarks}</p>
                      </div>
                    )}

                    {/* Rating Display */}
                    {booking.rating && (
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-semibold text-gray-700">Rating</span>
                          </div>
                          <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Section */}
                    <div className="pt-4 border-t border-gray-100">
                      {/* Tutor Accept/Reject Buttons */}
                      {currentUser?.user_id === booking.tutor_id && (booking.status === "Pending" || booking.status === "pending") && (
                        <div className="flex gap-3">
                          <button
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-4 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                            onClick={() => handleStatusUpdate(booking.booking_id, "Accepted")}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl px-4 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                            onClick={() => handleStatusUpdate(booking.booking_id, "Declined")}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Tutor Mark Complete Button */}
                      {currentUser?.user_id === booking.tutor_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                        <button
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-4 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                          onClick={() => handleComplete(booking.booking_id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Complete
                        </button>
                      )}

                      {/* Student Mark Complete Button */}
                      {currentUser?.user_id === booking.student_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                        <button
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-4 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                          onClick={() => handleStudentComplete(booking.booking_id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Complete
                        </button>
                      )}

                      {/* Student Rating Success Message */}
                      {currentUser?.user_id === booking.student_id && (booking.status === "Completed" || booking.status === "completed") && booking.rating && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-green-800 font-semibold">Thank you for rating!</span>
                            </div>
                            <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                          </div>
                        </div>
                      )}

                      {/* Tutor Rating Display */}
                      {currentUser?.user_id === booking.tutor_id && booking.rating && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Award className="w-5 h-5 text-blue-600" />
                              <span className="text-blue-800 font-semibold">Your Rating</span>
                            </div>
                            <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rating Modal */}
          {showRatingModal.open && showRatingModal.bookingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in duration-200">
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                    <Star className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Tutor</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Share your experience with this tutor..."
                    value={remarksInput[showRatingModal.bookingId] || ""}
                    onChange={e => setRemarksInput(prev => ({ ...prev, [showRatingModal.bookingId!]: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-4 py-3 font-semibold transition-colors"
                    onClick={() => setShowRatingModal({open: false})}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={pendingRating === 0}
                    onClick={async () => {
                      await handleRating(showRatingModal.bookingId!, pendingRating, remarksInput[showRatingModal.bookingId!] || "")
                      setShowRatingModal({open: false})
                      fetchBookings()
                    }}
                  >
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
