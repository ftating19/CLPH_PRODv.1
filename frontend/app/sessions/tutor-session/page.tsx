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
  preferred_time?: string
  status?: string // Added status property, optional
}

export default function TutorSessionPage() {
  // State for rating modal
  const [showRatingModal, setShowRatingModal] = useState<{open: boolean, bookingId?: number}>({open: false});
  const [pendingRating, setPendingRating] = useState<number>(0);

  // State for remarks input
  const [remarksInput, setRemarksInput] = useState<{[key:number]: string}>({});

  // Mark session as complete handler for student
  const handleStudentComplete = async (booking_id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: "Completed" } : b));
        // Show rating modal after marking as complete
        setShowRatingModal({open: true, bookingId: booking_id});
        setPendingRating(0);
      }
    } catch {
      // Optionally show error toast
    }
  };
  // Mark session as complete handler
  const handleComplete = async (booking_id: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: "Completed" } : b));
      }
    } catch {
      // Optionally show error toast
    }
  };
  // Rating handler
  const handleRating = async (booking_id: number, rating: number, remarks: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, remarks })
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, rating, remarks } : b));
      }
    } catch {
      // Optionally show error toast
    }
  };
  // Star rating UI
  const StarRating = ({ value, onChange, disabled }: { value: number, onChange: (v: number) => void, disabled?: boolean }) => (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          className={`transition-all duration-150 ease-in-out rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${disabled ? 'cursor-not-allowed' : 'hover:scale-110 cursor-pointer'}`}
          style={{ background: 'transparent', padding: '4px', border: 'none' }}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            fill={star <= value ? "#fbbf24" : "#e5e7eb"}
            stroke={star <= value ? "#f59e42" : "#d1d5db"}
            className={`w-7 h-7 drop-shadow ${star <= value ? '' : 'opacity-60'}`}
            style={{ transition: 'fill 0.2s, stroke 0.2s' }}
          />
        </button>
      ))}
    </div>
  );
  // Update booking status handler
  const handleStatusUpdate = async (booking_id: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/sessions/${booking_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status } : b));
      }
    } catch {
      // Optionally show error toast
    }
  };
  // Helper to format time range with AM/PM
  const formatTimeRange = (range?: string) => {
    if (!range) return "N/A";
    // Expecting format: "HH:mm - HH:mm"
    const [from, to] = range.split(" - ");
    const format = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      let hour = parseInt(h, 10);
      const minute = m || "00";
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${ampm}`;
    };
    return `${format(from)} - ${format(to)}`;
  };
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

  // Refetch bookings helper
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
  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">Tutor Sessions</h1>
        <p className="text-lg text-gray-500 mb-6">All your booked tutors and session details.</p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {loading ? (
            <div className="text-center text-lg text-gray-400">Loading sessions...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center text-lg text-gray-400">No tutor sessions found.</div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 p-6 flex flex-col justify-between min-h-[350px]">
                {/* Card header: tutor name, status, rating */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-blue-800">{booking.tutor_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'Completed' ? 'bg-green-100 text-green-700' : booking.status === 'Accepted' ? 'bg-blue-100 text-blue-700' : booking.status === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{booking.status || "Pending"}</span>
                </div>
                {/* Tutor star rating visible to all roles */}
                {booking.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-700 text-sm font-semibold">Tutor Rating:</span>
                    <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                  </div>
                )}
                {/* Card details */}
                <div className="text-sm text-gray-600 mb-1"><span className="font-semibold">Requester:</span> {booking.student_name}</div>
                <div className="text-sm text-gray-600 mb-1"><span className="font-semibold">Tutor:</span> {booking.tutor_name}</div>
                <div className="text-sm text-gray-600 mb-1"><span className="font-semibold">Start Date:</span> {formatDate(booking.start_date)}</div>
                <div className="text-sm text-gray-600 mb-1"><span className="font-semibold">End Date:</span> {formatDate(booking.end_date)}</div>
                <div className="text-sm text-gray-600 mb-1"><span className="font-semibold">Time:</span> {formatTimeRange(booking.preferred_time)}</div>
                <div className="text-sm text-gray-600 mb-1"><span className="font-semibold">Remarks:</span> {booking.remarks || "No remarks."}</div>
                <div className="mt-4">
                  {/* Tutor action buttons: only show if current user is the tutor and status is pending */}
                  {currentUser?.user_id === booking.tutor_id && (booking.status === "Pending" || booking.status === "pending") && (
                    <div className="flex gap-2 mb-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors"
                        onClick={() => handleStatusUpdate(booking.booking_id, "Accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition-colors"
                        onClick={() => handleStatusUpdate(booking.booking_id, "Declined")}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {/* Tutor mark as complete: only show if current user is the tutor and status is accepted */}
                  {currentUser?.user_id === booking.tutor_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                    <div className="mb-2">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
                        onClick={() => handleComplete(booking.booking_id)}
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}
                  {/* Student mark as complete: only show if current user is the student and status is accepted */}
                  {currentUser?.user_id === booking.student_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                    <div className="mb-2">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
                        onClick={() => handleStudentComplete(booking.booking_id)}
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}
                  {/* Student rating and remarks: only show if current user is the student, booking is completed, and not yet rated, and not in modal */}
                  {currentUser?.user_id === booking.student_id && (booking.status === "Completed" || booking.status === "completed") && !booking.rating && showRatingModal.open && showRatingModal.bookingId === booking.booking_id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <div className="mb-2 font-semibold text-gray-700 text-lg">Rate your tutor</div>
                        <StarRating
                          value={pendingRating}
                          onChange={r => setPendingRating(r)}
                          disabled={false}
                        />
                        <div className="mt-4">
                          <input
                            type="text"
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Add remarks (optional)"
                            value={remarksInput[booking.booking_id] || ""}
                            onChange={e => setRemarksInput(prev => ({ ...prev, [booking.booking_id]: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                            onClick={() => setShowRatingModal({open: false})}
                          >Cancel</button>
                          <button
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            disabled={pendingRating === 0}
                            onClick={async () => {
                              await handleRating(booking.booking_id, pendingRating, remarksInput[booking.booking_id] || "");
                              setShowRatingModal({open: false});
                              // Auto reload bookings after rating
                              fetchBookings();
                            }}
                          >Submit Rating</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Show thank you and stars after rating is submitted (student view) */}
                  {currentUser?.user_id === booking.student_id && (booking.status === "Completed" || booking.status === "completed") && booking.rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-green-600 text-sm">Thank you for rating!</span>
                      <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                    </div>
                  )}
                  {/* Show rating to tutor if exists */}
                  {currentUser?.user_id === booking.tutor_id && booking.rating && (
                    <div className="mb-2">
                      <span className="font-semibold text-gray-700">Your Rating:</span>
                      <span className="ml-2">
                        <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
