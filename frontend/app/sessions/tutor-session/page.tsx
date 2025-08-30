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
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          className={`text-yellow-500 text-xl`}
          style={{ filter: star <= value ? "none" : "grayscale(80%) brightness(1.7)" }}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
        >
          <Star fill={star <= value ? "#eab308" : "#d1d5db"} stroke={star <= value ? "#eab308" : "#d1d5db"} />
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
                    <span className="font-semibold">Time:</span> {formatTimeRange(booking.preferred_time)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-semibold">Remarks:</span> {booking.remarks || "No remarks."}
                  </div>
                  {/* Tutor action buttons: only show if current user is the tutor and status is pending */}
                  {currentUser?.user_id === booking.tutor_id && (booking.status === "Pending" || booking.status === "pending") && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => handleStatusUpdate(booking.booking_id, "Accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => handleStatusUpdate(booking.booking_id, "Declined")}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {/* Tutor mark as complete: only show if current user is the tutor and status is accepted */}
                  {currentUser?.user_id === booking.tutor_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                    <div className="mt-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => handleComplete(booking.booking_id)}
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}
                  {/* Student mark as complete: only show if current user is the student and status is accepted */}
                  {currentUser?.user_id === booking.student_id && (booking.status === "Accepted" || booking.status === "accepted") && (
                    <div className="mt-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => handleStudentComplete(booking.booking_id)}
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}
                  {/* Student rating and remarks: only show if current user is the student, booking is completed, and not yet rated */}
                  {currentUser?.user_id === booking.student_id && (booking.status === "Completed" || booking.status === "completed") && (
                    <div className="mt-2">
                      <div className="mb-1 font-semibold">Rate your tutor:</div>
                      <StarRating
                        value={booking.rating || 0}
                        onChange={r => {
                          if (!booking.rating) handleRating(booking.booking_id, r, remarksInput[booking.booking_id] || "");
                        }}
                        disabled={!!booking.rating}
                      />
                      <div className="mt-2">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Add remarks (optional)"
                          value={remarksInput[booking.booking_id] || ""}
                          onChange={e => setRemarksInput(prev => ({ ...prev, [booking.booking_id]: e.target.value }))}
                          disabled={!!booking.rating}
                        />
                      </div>
                      {booking.rating && <div className="text-green-600 text-sm mt-1">Thank you for rating!</div>}
                    </div>
                  )}
                  {/* Show rating to tutor if exists */}
                  {currentUser?.user_id === booking.tutor_id && booking.rating && (
                    <div className="mt-2">
                      <span className="font-semibold">Your Rating:</span>
                      <span className="ml-2">
                        <StarRating value={booking.rating} onChange={() => {}} disabled={true} />
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
