"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Clock, Calendar, User, MessageCircle, CheckCircle, XCircle, Award, Loader2, BookOpen, Search, Filter } from "lucide-react"
import Layout from "@/components/dashboard/layout"
import { useUser } from "@/contexts/UserContext"
import ChatModal from "@/components/modals/ChatModal"
import TakePostTestModal from "@/components/modals/TakePostTestModal"
import PostTestResultsModal from "@/components/modals/PostTestResultsModal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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
  subject_id?: number
  subject_name?: string
  subject_code?: string
}

export default function TutorSessionPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useUser()

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // State for rating modal
  const [showRatingModal, setShowRatingModal] = useState<{open: boolean, bookingId?: number}>({open: false})
  const [pendingRating, setPendingRating] = useState<number>(0)
  const [remarksInput, setRemarksInput] = useState<{[key:number]: string}>({})

  // State for chat modal
  const [showChatModal, setShowChatModal] = useState<{open: boolean, bookingId?: number, bookingDetails?: Booking}>({open: false})

  // State for template selector modal
  const [showSelectTemplateModal, setShowSelectTemplateModal] = useState<{open: boolean, bookingId?: number, bookingDetails?: Booking}>({open: false})
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [assigningTemplate, setAssigningTemplate] = useState(false)
  const { toast } = useToast()
  
  // State for take post-test modal  
  const [showTakePostTestModal, setShowTakePostTestModal] = useState<{
    open: boolean, 
    postTestId?: number, 
    bookingDetails?: Booking,
    isTemplate?: boolean,
    assignmentId?: number
  }>({open: false})
  
  // State for post-test results modal
  const [showResultsModal, setShowResultsModal] = useState<{open: boolean, bookingId?: number, bookingDetails?: Booking}>({open: false})
  
  // State for available post-tests
  const [availablePostTests, setAvailablePostTests] = useState<{[bookingId: number]: any[]}>({})
  const [postTestsLoading, setPostTestsLoading] = useState<{[bookingId: number]: boolean}>({})
  const [postTestResults, setPostTestResults] = useState<{[bookingId: number]: any[]}>({})
  const [resultsLoading, setResultsLoading] = useState<{[bookingId: number]: boolean}>({})

  // Fetch tutor's templates
  const fetchTemplates = async () => {
    if (!currentUser?.user_id) return
    
    try {
      setLoadingTemplates(true)
      const response = await fetch(`http://localhost:4000/api/post-test-templates/tutor/${currentUser.user_id}`)
      
      if (!response.ok) throw new Error('Failed to fetch templates')
      
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }
  
  // Assign template to student
  const handleAssignTemplate = async (templateId: number, bookingDetails: Booking) => {
    try {
      setAssigningTemplate(true)
      
      const response = await fetch(`http://localhost:4000/api/post-test-templates/${templateId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: [bookingDetails.student_id],
          booking_ids: [bookingDetails.booking_id],
          assigned_by: currentUser?.user_id,
          due_date: null
        })
      })
      
      if (!response.ok) throw new Error('Failed to assign template')
      
      toast({
        title: "Success",
        description: "Post-test assigned to student!"
      })
      
      setShowSelectTemplateModal({open: false})
      
      // Refresh bookings to show the new assignment
      fetchBookings()
      
    } catch (error) {
      console.error('Error assigning template:', error)
      toast({
        title: "Error",
        description: "Failed to assign post-test",
        variant: "destructive"
      })
    } finally {
      setAssigningTemplate(false)
    }
  }

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
    if (!booking.start_date) return false
    
    try {
      const sessionDate = new Date(booking.start_date)
      
      // Set to end of the session date (11:59:59 PM)
      sessionDate.setHours(23, 59, 59, 999)
      
      // Check if current time is past the end of the session date (after a full day)
      return new Date() > sessionDate
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

  // Fetch available post-tests for a booking
  const fetchPostTestsForBooking = async (bookingId: number) => {
    console.log('Fetching post-tests for booking:', bookingId);
    setPostTestsLoading(prev => ({...prev, [bookingId]: true}))
    try {
      // First try to get post-tests by student ID if current user is student
      if (currentUser?.user_id) {
        let response;
        let assignedTemplates = [];
        
        // Check for assigned templates
        try {
          const templatesResponse = await fetch(`http://localhost:4000/api/post-test-assignments/student/${currentUser.user_id}?booking_id=${bookingId}`)
          const templatesData = await templatesResponse.json()
          if (templatesData.success && templatesData.assignments) {
            // Map template assignments to post-test format
            assignedTemplates = templatesData.assignments
              .filter((a: any) => a.status === 'assigned' && a.booking_id === bookingId)
              .map((a: any) => ({
                id: a.template_id,
                post_test_id: a.template_id,
                assignment_id: a.assignment_id,
                title: a.template_title,
                description: a.template_description,
                subject_id: a.subject_id,
                subject_name: a.subject_name,
                time_limit: a.time_limit,
                passing_score: a.passing_score,
                booking_id: a.booking_id,
                test_status: 'available',
                is_template: true // Flag to identify template-based tests
              }))
          }
        } catch (err) {
          console.error('Error fetching template assignments:', err)
        }
        
        if (currentUser.role?.toLowerCase() === 'student') {
          // Use student-specific endpoint for students
          response = await fetch(`http://localhost:4000/api/post-tests/student/${currentUser.user_id}`)
        } else {
          // Use booking-based query for tutors or other roles
          response = await fetch(`http://localhost:4000/api/post-tests?booking_id=${bookingId}&status=published`)
        }
        
        const data = await response.json()
        console.log('Post-tests response for booking', bookingId, ':', data);
        
        if (data.success) {
          let postTests = data.postTests || [];
          
          // Filter by booking_id if using student endpoint
          if (currentUser.role?.toLowerCase() === 'student') {
            postTests = postTests.filter((pt: any) => pt.booking_id === bookingId && pt.test_status === 'available');
          }
          
          // Map post_test_id to id for compatibility
          const mappedPostTests = postTests.map((postTest: any) => ({
            ...postTest,
            id: postTest.post_test_id || postTest.id
          }));
          
          // Combine regular post-tests with assigned templates
          const allTests = [...mappedPostTests, ...assignedTemplates]
          
          setAvailablePostTests(prev => ({...prev, [bookingId]: allTests}))
          console.log('Set available post-tests for booking', bookingId, ':', allTests);
        } else {
          // Even if no regular post-tests, show assigned templates
          setAvailablePostTests(prev => ({...prev, [bookingId]: assignedTemplates}))
          console.log('No regular post-tests, but have template assignments:', assignedTemplates);
        }
      }
    } catch (error) {
      console.error('Error fetching post-tests:', error)
      setAvailablePostTests(prev => ({...prev, [bookingId]: []}))
    }
    setPostTestsLoading(prev => ({...prev, [bookingId]: false}))
  }

  // Fetch post-test results for a booking
  const fetchPostTestResults = async (bookingId: number) => {
    if (!currentUser?.user_id) return
    
    console.log('Fetching post-test results for booking:', bookingId);
    setResultsLoading(prev => ({...prev, [bookingId]: true}))
    
    try {
      const response = await fetch(`http://localhost:4000/api/post-test-results?booking_id=${bookingId}`)
      const data = await response.json()
      console.log('Post-test results response for booking', bookingId, ':', data);
      
      if (data.success) {
        setPostTestResults(prev => ({...prev, [bookingId]: data.results || []}))
        console.log('Set post-test results for booking', bookingId, ':', data.results);
      } else {
        setPostTestResults(prev => ({...prev, [bookingId]: []}))
      }
    } catch (error) {
      console.error('Error fetching post-test results:', error)
      setPostTestResults(prev => ({...prev, [bookingId]: []}))
    }
    
    setResultsLoading(prev => ({...prev, [bookingId]: false}))
  }

  // Filter bookings based on search and filter criteria
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    const searchMatch = searchQuery === "" || 
      booking.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.tutor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const statusMatch = statusFilter === "all" || 
      booking.status?.toLowerCase() === statusFilter.toLowerCase()

    // Date filter
    let dateMatch = true
    if (dateFilter !== "all" && booking.start_date) {
      const bookingDate = new Date(booking.start_date)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case "today":
          dateMatch = daysDiff === 0
          break
        case "week":
          dateMatch = daysDiff >= 0 && daysDiff <= 7
          break
        case "month":
          dateMatch = daysDiff >= 0 && daysDiff <= 30
          break
        case "upcoming":
          dateMatch = daysDiff < 0
          break
      }
    }

    return searchMatch && statusMatch && dateMatch
  })

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
        
        // Fetch post-tests for each booking for students
        if (currentUser?.role?.toLowerCase() === 'student') {
          data.sessions.forEach((booking: Booking) => {
            if ((booking.status === 'Accepted' || booking.status === 'accepted') && 
                currentUser.user_id === booking.student_id) {
              fetchPostTestsForBooking(booking.booking_id)
              fetchPostTestResults(booking.booking_id) // Also fetch results for students
            }
          })
        }
        
        // Fetch post-test results for tutors
        if (currentUser?.role?.toLowerCase() === 'tutor') {
          data.sessions.forEach((booking: Booking) => {
            if (currentUser.user_id === booking.tutor_id) {
              fetchPostTestResults(booking.booking_id)
            }
          })
        }
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

        {/* Filter Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              Filter Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by student, tutor, or subject..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="sm:w-48">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || statusFilter !== "all" || dateFilter !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setDateFilter("all")
                  }}
                  className="sm:w-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            {/* Results Count */}
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredBookings.length} of {bookings.length} sessions
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading sessions...</span>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {bookings.length === 0 ? "No Sessions Found" : "No Matching Sessions"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {bookings.length === 0 
                  ? "No tutor sessions found. Book a session to get started!" 
                  : "Try adjusting your filters to see more sessions."}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
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
                        This session has passed its scheduled date and was marked as expired.
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

                  <div className="flex flex-col items-end pt-4 border-t">
                    <div className="flex flex-wrap gap-2 justify-end w-full">
                      {/* Chat Button - Only for accepted sessions for tutor and student */}
                      {((currentUser?.user_id === booking.tutor_id) || (currentUser?.user_id === booking.student_id)) && 
                       (booking.status === "Accepted" || booking.status === "accepted") && 
                       !isSessionExpired(booking) && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChatModal({open: true, bookingId: booking.booking_id, bookingDetails: booking})}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      )}

                      {/* Select Post-test Template Button - Only for tutors in accepted sessions without completed post-tests */}
                      {currentUser?.user_id === booking.tutor_id && 
                       (booking.status === "Accepted" || booking.status === "accepted") && 
                       !isSessionExpired(booking) && 
                       (!postTestResults[booking.booking_id] || postTestResults[booking.booking_id].length === 0) && (
                        <Button 
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setShowSelectTemplateModal({open: true, bookingId: booking.booking_id, bookingDetails: booking})
                            fetchTemplates()
                          }}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Select Post-test
                        </Button>
                      )}

                      {/* Show Results Button - For tutors to view student results */}
                      {currentUser?.user_id === booking.tutor_id && 
                       postTestResults[booking.booking_id] && 
                       postTestResults[booking.booking_id].length > 0 && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setShowResultsModal({open: true, bookingId: booking.booking_id, bookingDetails: booking})}
                          disabled={resultsLoading[booking.booking_id]}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          {resultsLoading[booking.booking_id] ? 'Loading...' : 'Show Results'}
                        </Button>
                      )}

                      {/* Take Post-test Button - Only for students in accepted sessions with available post-tests */}
                      {currentUser?.user_id === booking.student_id && 
                       (booking.status === "Accepted" || booking.status === "accepted") && 
                       !isSessionExpired(booking) && 
                       availablePostTests[booking.booking_id] && 
                       availablePostTests[booking.booking_id].length > 0 && (
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const postTest = availablePostTests[booking.booking_id][0];
                            console.log('Take Post-test clicked', {
                              bookingId: booking.booking_id,
                              postTest: postTest,
                              booking: booking,
                              isTemplate: postTest.is_template
                            });
                            setShowTakePostTestModal({
                              open: true, 
                              postTestId: postTest.id, 
                              bookingDetails: booking,
                              isTemplate: postTest.is_template,
                              assignmentId: postTest.assignment_id
                            });
                          }}
                          disabled={postTestsLoading[booking.booking_id]}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {postTestsLoading[booking.booking_id] ? 'Loading...' : 'Take Post-test'}
                        </Button>
                      )}

                      {/* View Results Button - For students to view their completed test results */}
                      {currentUser?.user_id === booking.student_id && 
                       postTestResults[booking.booking_id] && 
                       postTestResults[booking.booking_id].length > 0 && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setShowResultsModal({open: true, bookingId: booking.booking_id, bookingDetails: booking})}
                          disabled={resultsLoading[booking.booking_id]}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {resultsLoading[booking.booking_id] ? 'Loading...' : 'View Results'}
                        </Button>
                      )}

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

        {/* Chat Modal */}
        {showChatModal.bookingDetails && (
          <ChatModal
            isOpen={showChatModal.open}
            onClose={() => setShowChatModal({open: false})}
            booking={showChatModal.bookingDetails}
          />
        )}

        {/* Template Selector Modal */}
        <Dialog open={showSelectTemplateModal.open} onOpenChange={(open) => setShowSelectTemplateModal({open})}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Select Post-Test Template</DialogTitle>
              <DialogDescription>
                Choose a post-test template to assign to {showSelectTemplateModal.bookingDetails?.student_name}
              </DialogDescription>
            </DialogHeader>
            
            {loadingTemplates ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-4 text-muted-foreground">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
                <p className="text-muted-foreground">
                  You haven't created any post-test templates yet. Please go to the Manage Post-Tests page to create templates.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {templates
                  .filter(t => !showSelectTemplateModal.bookingDetails?.subject_id || 
                    t.subject_id === showSelectTemplateModal.bookingDetails.subject_id)
                  .map((template) => (
                    <Card key={template.template_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{template.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description || 'No description'}
                            </p>
                            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {template.subject_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {template.time_limit} minutes
                              </span>
                              <span>{template.total_questions} questions</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAssignTemplate(template.template_id, showSelectTemplateModal.bookingDetails!)}
                            disabled={assigningTemplate}
                            size="sm"
                          >
                            {assigningTemplate ? 'Assigning...' : 'Assign'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Take Post-Test Modal */}
        <TakePostTestModal
          isOpen={showTakePostTestModal.open}
          onClose={() => setShowTakePostTestModal({open: false})}
          postTestId={showTakePostTestModal.postTestId || 0}
          booking={showTakePostTestModal.bookingDetails || { booking_id: 0, tutor_id: 0, tutor_name: '', student_id: 0, student_name: '' }}
          isTemplate={showTakePostTestModal.isTemplate}
          assignmentId={showTakePostTestModal.assignmentId}
        />

        {/* Post-Test Results Modal */}
        {showResultsModal.bookingDetails && (
          <PostTestResultsModal
            isOpen={showResultsModal.open}
            onClose={() => setShowResultsModal({open: false})}
            bookingId={showResultsModal.bookingId || 0}
            booking={showResultsModal.bookingDetails}
            currentUserId={currentUser?.user_id || 0}
          />
        )}
      </div>
    </Layout>
  )
}
