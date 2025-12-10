"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiUrl } from "@/lib/api-config"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Calendar, Mail, Search, Filter, GraduationCap, Loader2, MessageSquare, Clock, CheckCircle2, AlertCircle, MapPin, BookOpen, Star, Calendar as CalendarIcon, XCircle } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { CICT_PROGRAMS } from "@/lib/constants"
import { format, addDays, startOfDay, endOfDay } from "date-fns"

// Student Booking Form Component
interface StudentBookingFormProps {
  student: Student
  currentUser: any
  onClose: () => void
}

interface TimeSlot {
  slot: string
  available: boolean
  label: string
  startTime: string
  endTime: string
}

interface AvailabilityData {
  date: string
  slots: string[]
  dayName: string
}

function StudentBookingForm({ student, currentUser, onClose }: StudentBookingFormProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [availability, setAvailability] = useState<AvailabilityData[]>([])
  const [expiredBookings, setExpiredBookings] = useState<Map<string, Set<string>>>(new Map())
  const [ongoingBookings, setOngoingBookings] = useState<Map<string, Set<string>>>(new Map())
  const [bookingDetails, setBookingDetails] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(false)
  const [navigatingMonth, setNavigatingMonth] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [dateRange, setDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(addDays(new Date(), 60))
  })
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date())
  
  // Define time slots with enhanced structure
  const timeSlots: TimeSlot[] = [
    { slot: '09:00-10:00', available: false, label: '9:00 AM - 10:00 AM', startTime: '09:00', endTime: '10:00' },
    { slot: '10:00-11:00', available: false, label: '10:00 AM - 11:00 AM', startTime: '10:00', endTime: '11:00' },
    { slot: '11:00-12:00', available: false, label: '11:00 AM - 12:00 PM', startTime: '11:00', endTime: '12:00' },
    { slot: '12:00-13:00', available: false, label: '12:00 PM - 1:00 PM', startTime: '12:00', endTime: '13:00' },
    { slot: '13:00-14:00', available: false, label: '1:00 PM - 2:00 PM', startTime: '13:00', endTime: '14:00' },
    { slot: '14:00-15:00', available: false, label: '2:00 PM - 3:00 PM', startTime: '14:00', endTime: '15:00' },
    { slot: '15:00-16:00', available: false, label: '3:00 PM - 4:00 PM', startTime: '15:00', endTime: '16:00' },
    { slot: '16:00-17:00', available: false, label: '4:00 PM - 5:00 PM', startTime: '16:00', endTime: '17:00' },
  ]

  // Handle month navigation - fetch availability for new month
  const handleMonthChange = async (month: Date) => {
    console.log(`📅 Calendar navigated to: ${format(month, 'MMMM yyyy')}`)
    setCurrentCalendarMonth(month)
    setNavigatingMonth(true)
    
    if (!student?.user_id) {
      setNavigatingMonth(false)
      return
    }

    // Calculate the date range for the new month (and a buffer around it)
    const bufferStart = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    const bufferEnd = new Date(month.getFullYear(), month.getMonth() + 2, 0)
    
    // Only expand dateRange if the new month is outside our current range
    const needsExpansion = bufferStart < dateRange.start || bufferEnd > dateRange.end
    
    if (needsExpansion) {
      const newStart = bufferStart < dateRange.start ? bufferStart : dateRange.start
      const newEnd = bufferEnd > dateRange.end ? bufferEnd : dateRange.end
      
      console.log(`📅 Expanding date range for month navigation: ${format(newStart, 'yyyy-MM-dd')} to ${format(newEnd, 'yyyy-MM-dd')}`)
      
      // Use a timeout to prevent interfering with calendar navigation
      setTimeout(() => {
        setDateRange({ start: newStart, end: newEnd })
        setTimeout(() => setNavigatingMonth(false), 500)
      }, 100)
    } else {
      setTimeout(() => setNavigatingMonth(false), 100)
    }
  }

  // Fetch student availability (check existing bookings to prevent conflicts)
  const fetchAvailability = async () => {
    if (!student?.user_id) return

    try {
      setLoading(true)
      const startDate = format(dateRange.start, 'yyyy-MM-dd')
      const endDate = format(dateRange.end, 'yyyy-MM-dd')
      
      // Check ALL existing bookings for both the current tutor AND the target student to prevent conflicts
      const tutorId = currentUser?.user_id
      const studentId = student?.user_id
      
      console.log('=== FETCHING AVAILABILITY FOR BOTH TUTOR AND STUDENT ===')
      console.log('Tutor ID:', tutorId)
      console.log('Student ID:', studentId) 
      console.log('Checking availability for student:', student.first_name, student.last_name)
      console.log('Date Range:', startDate, 'to', endDate)
      
      // Fetch both tutor's existing bookings and student's existing bookings
      const [tutorResponse, studentResponse] = await Promise.all([
        fetch(apiUrl(`/api/sessions?tutor_id=${tutorId}`)),
        fetch(apiUrl(`/api/sessions?user_id=${studentId}`))
      ])
      
      if (!tutorResponse.ok || !studentResponse.ok) {
        throw new Error(`HTTP ${tutorResponse.status} or ${studentResponse.status}`)
      }
      
      const [tutorData, studentData] = await Promise.all([
        tutorResponse.json(),
        studentResponse.json()
      ])
      
      // Combine both datasets for comprehensive conflict checking
      const combinedBookings = [
        ...(tutorData.success ? tutorData.sessions || [] : []),
        ...(studentData.success ? studentData.sessions || [] : [])
      ]
      
      // Remove duplicates (same booking might appear in both datasets)
      const uniqueBookings = combinedBookings.reduce((acc: any[], current: any) => {
        const exists = acc.find(booking => booking.booking_id === current.booking_id)
        if (!exists) {
          acc.push(current)
        }
        return acc
      }, [])
      
      const data = { success: true, sessions: uniqueBookings }
      console.log('Combined bookings data received:', data)
      
      if (data.success) {
        // Process existing bookings to determine availability
        const existingBookings = data.sessions || []
        const unavailableDates = new Set<string>()
        const unavailableSlots = new Map<string, Set<string>>()
        const expiredSlots = new Map<string, Set<string>>() // Track expired bookings
        const ongoingSlots = new Map<string, Set<string>>() // Track ongoing (accepted) sessions
        const bookingDetails = new Map<string, any>() // Track booking details (student/tutor names)

        existingBookings.forEach((booking: any) => {
          if (booking.start_date) {
            const bookingDate = format(new Date(booking.start_date), 'yyyy-MM-dd')
            const timeSlot = booking.preferred_time
            const status = booking.status?.toLowerCase()
            
            if (timeSlot) {
              const normalizedSlot = timeSlot.replace(' - ', '-')
              
              // Check if booking is expired (pending but past end time)
              if (['pending', 'pending_student_approval'].includes(status)) {
                try {
                  const [startTime, endTime] = normalizedSlot.split('-')
                  const [endHours, endMinutes] = endTime.split(':').map(Number)
                  const slotEndTime = new Date(booking.start_date)
                  slotEndTime.setHours(endHours, endMinutes, 0, 0)
                  
                  const today = new Date()
                  if (today > slotEndTime) {
                    // This is an expired booking (pending but past end time)
                    if (!expiredSlots.has(bookingDate)) {
                      expiredSlots.set(bookingDate, new Set())
                    }
                    expiredSlots.get(bookingDate)?.add(normalizedSlot)
                  }
                } catch (error) {
                  console.error('Error checking expired booking:', error)
                }
              }
              
              // Track ongoing (accepted) sessions separately
              if (status === 'accepted') {
                if (!ongoingSlots.has(bookingDate)) {
                  ongoingSlots.set(bookingDate, new Set())
                }
                ongoingSlots.get(bookingDate)?.add(normalizedSlot)
                
                // Store booking details for display
                const slotKey = `${bookingDate}_${normalizedSlot}`
                bookingDetails.set(slotKey, {
                  studentName: booking.student_name,
                  tutorName: booking.tutor_name,
                  studentId: booking.student_id,
                  tutorId: booking.tutor_id,
                  status: booking.status
                })
              }
              
              // Mark as unavailable if active, accepted, pending, or pending approval
              if (['active', 'accepted', 'pending', 'pending_student_approval'].includes(status)) {
                if (!unavailableSlots.has(bookingDate)) {
                  unavailableSlots.set(bookingDate, new Set())
                }
                unavailableSlots.get(bookingDate)?.add(normalizedSlot)
              }
            }
          }
        })

        // Store expired, ongoing slots, and booking details for later use
        setExpiredBookings(expiredSlots)
        setOngoingBookings(ongoingSlots)
        setBookingDetails(bookingDetails)

        // Create availability data for the date range
        const availabilityData: AvailabilityData[] = []
        const current = new Date(dateRange.start)
        const end = new Date(dateRange.end)

        while (current <= end) {
          const dateStr = format(current, 'yyyy-MM-dd')
          const dayName = format(current, 'EEEE')
          const unavailableForDay = unavailableSlots.get(dateStr) || new Set()
          
          // All time slots are available except those already booked
          const availableSlots = timeSlots
            .map(slot => slot.slot)
            .filter(slot => !unavailableForDay.has(slot))
          
          availabilityData.push({
            date: dateStr,
            slots: availableSlots,
            dayName
          })
          
          current.setDate(current.getDate() + 1)
        }

        setAvailability(availabilityData)
        console.log('Available days:', availabilityData.filter(day => day.slots.length > 0).length)
      } else {
        console.error('Failed to fetch bookings: No sessions data')
        // Provide default availability if API fails
        const defaultAvailability: AvailabilityData[] = []
        const current = new Date(dateRange.start)
        const end = new Date(dateRange.end)

        while (current <= end) {
          const dateStr = format(current, 'yyyy-MM-dd')
          const dayName = format(current, 'EEEE')
          
          defaultAvailability.push({
            date: dateStr,
            slots: timeSlots.map(slot => slot.slot),
            dayName
          })
          
          current.setDate(current.getDate() + 1)
        }
        
        setAvailability(defaultAvailability)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast({
        title: "Connection Error",
        description: "Unable to load availability. Please check your connection.",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Load availability when component mounts or when student changes
  useEffect(() => {
    fetchAvailability()
  }, [student?.user_id])
  
  // Load availability when dateRange changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAvailability()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [dateRange])

  // Check if a time slot is in the past for today's date
  const isTimeSlotInPast = (date: Date, timeSlot: string): boolean => {
    const today = new Date()
    const selectedDate = new Date(date)
    
    // Only check for past time if the selected date is today
    if (selectedDate.toDateString() !== today.toDateString()) {
      return false
    }
    
    try {
      // Parse time slot (e.g., "09:00-10:00")
      const [startTime] = timeSlot.split('-')
      const [hours, minutes] = startTime.split(':').map(Number)
      
      // Create a date object for the time slot
      const slotTime = new Date(selectedDate)
      slotTime.setHours(hours, minutes, 0, 0)
      
      // Add a 30-minute buffer to allow booking slightly in advance
      const bufferTime = new Date(today.getTime() + (30 * 60 * 1000))
      
      return slotTime < bufferTime
    } catch (error) {
      console.error('Error parsing time slot:', error)
      return false
    }
  }

  // Check if a time slot is expired (booked but not accepted and past end time)
  const isTimeSlotExpired = (date: Date, timeSlot: string): boolean => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const normalizedSlot = timeSlot.replace(' - ', '-')
      
      // Check if this specific date/time slot is in our expired bookings
      const expiredSlotsForDate = expiredBookings.get(dateStr)
      return expiredSlotsForDate ? expiredSlotsForDate.has(normalizedSlot) : false
      
    } catch (error) {
      console.error('Error checking expired time slot:', error)
      return false
    }
  }

  // Check if a time slot is booked (accepted session)
  const isTimeSlotBooked = (date: Date, timeSlot: string): boolean => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const normalizedSlot = timeSlot.replace(' - ', '-')
      
      // Check if this specific date/time slot is in our booked sessions
      const bookedSlotsForDate = ongoingBookings.get(dateStr)
      return bookedSlotsForDate ? bookedSlotsForDate.has(normalizedSlot) : false
      
    } catch (error) {
      console.error('Error checking booked time slot:', error)
      return false
    }
  }

  // Get booking details for a specific slot
  const getSlotBookingDetails = (date: Date, timeSlot: string): any => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const normalizedSlot = timeSlot.replace(' - ', '-')
      const slotKey = `${dateStr}_${normalizedSlot}`
      
      return bookingDetails.get(slotKey) || null
      
    } catch (error) {
      console.error('Error getting booking details:', error)
      return null
    }
  }

  // Get available slots for selected date
  const getAvailableSlotsForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAvailability = availability.find(a => a.date === dateStr)
    
    if (dayAvailability) {
      // If we have explicit data for this date, use it
      const slots = dayAvailability.slots
      return slots.filter(slot => !isTimeSlotInPast(date, slot) && !isTimeSlotExpired(date, slot))
    } else {
      // For dates without explicit data, provide default slots
      const isPastDate = date < startOfDay(new Date())
      
      if (isPastDate) {
        return [] // No slots for past dates
      }
      
      // Provide default time slots for any future date
      const defaultSlots = timeSlots.map(slot => slot.slot)
      
      // Filter out past time and expired slots for today's date
      return defaultSlots.filter(slot => !isTimeSlotInPast(date, slot) && !isTimeSlotExpired(date, slot))
    }
  }

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date): boolean => {
    const availableSlots = getAvailableSlotsForDate(date)
    return availableSlots.length > 0
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTimeSlots([]) // Reset time slot selections
  }

  const handleBooking = async () => {
    if (!selectedDate || selectedTimeSlots.length === 0) {
      setStatus("Please select a date and time slot.")
      return
    }

    setBookingLoading(true)
    setStatus("")
    
    try {
      const bookingDate = format(selectedDate, 'yyyy-MM-dd')
      
      // Create multiple bookings for each selected time slot
      const bookingPromises = selectedTimeSlots.map(async (timeSlot) => {
        const [startTime, endTime] = timeSlot.split('-')
        
        const response = await fetch(apiUrl("/api/sessions/tutor-booking"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutor_id: currentUser.user_id,
            student_id: student.user_id,
            preferred_dates: [bookingDate, bookingDate],
            preferred_time: `${startTime} - ${endTime}`
          })
        })
        
        return await response.json()
      })
      
      const results = await Promise.all(bookingPromises)
      const successfulBookings = results.filter(result => result.success)
      
      if (successfulBookings.length > 0) {
        const timeSlotLabels = selectedTimeSlots.map(slot => 
          timeSlots.find(s => s.slot === slot)?.label || slot
        ).join(', ')
        
        toast({
          title: "Booking Request Sent! 🎉",
          description: `Your session request${selectedTimeSlots.length > 1 ? 's have' : ' has'} been sent to ${student.first_name} for ${format(selectedDate, 'MMMM dd')} at ${timeSlotLabels}. They will receive a notification to approve or decline.`,
          duration: 5000,
        })
        setTimeout(() => { onClose() }, 1500)
      } else {
        setStatus("Booking request failed. Please try again.")
      }
    } catch (error) {
      console.error('Booking error:', error)
      setStatus("Booking request failed. Please try again.")
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Professional Header Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Book a Student</h2>
              <p className="text-green-100">Send a tutoring session request to a student</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">Session with</div>
            <div className="text-xl font-semibold">{student.first_name} {student.last_name}</div>
            <div className="text-sm text-green-200">{student.program}</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10"></div>
      </div>

      {/* Student Information Card */}
      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Student Name</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{student.first_name} {student.last_name}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Program</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{student.program}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{student.email}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{student.status} Student</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Booking Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Calendar Section */}
        <div className="xl:col-span-2">
          <Card className="h-full border-2 border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Select Date</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose your preferred session date</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading || navigatingMonth ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-400 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    {navigatingMonth ? 'Loading calendar...' : 'Loading availability...'}
                  </p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < startOfDay(new Date())}
                    modifiers={{
                      available: (date: Date) => hasAvailableSlots(date) && date >= dateRange.start,
                      unavailable: (date: Date) => !hasAvailableSlots(date) && date >= dateRange.start,
                    }}
                    modifiersStyles={{
                      available: {
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontWeight: 'bold'
                      },
                      unavailable: {
                        backgroundColor: '#fecaca',
                        color: '#dc2626',
                        opacity: 0.6,
                        textDecoration: 'line-through'
                      }
                    }}
                    onMonthChange={handleMonthChange}
                    className="rounded-lg border-2 border-gray-200 shadow-inner bg-white"
                    initialFocus
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Time Slots Section */}
        <div className="xl:col-span-1">
          <Card className="h-full border-2 border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Available Times</CardTitle>
                  {selectedDate ? (
                    <div className="mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(selectedDate, 'EEEE, MMMM dd')} - Click to select multiple slots
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-500"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <span>Booked</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-300"></div>
                          <span>Past time</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Expired</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">Select a date first</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedDate ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Choose a Date</p>
                  <p className="text-sm text-gray-500">Select a date from the calendar to see available time slots</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const availableSlots = getAvailableSlotsForDate(selectedDate)
                    
                    if (availableSlots.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                          </div>
                          <p className="text-gray-600 font-medium mb-2">No Available Slots</p>
                          <p className="text-sm text-gray-500">This student is fully booked for this date. Please choose another date.</p>
                        </div>
                      )
                    }

                    return timeSlots.map((slot) => {
                      const isAvailable = availableSlots.includes(slot.slot)
                      const isSelected = selectedTimeSlots.includes(slot.slot)
                      const isPastTime = selectedDate ? isTimeSlotInPast(selectedDate, slot.slot) : false
                      const isExpired = selectedDate ? isTimeSlotExpired(selectedDate, slot.slot) : false
                      const isBooked = selectedDate ? isTimeSlotBooked(selectedDate, slot.slot) : false

                      const handleTimeSlotClick = () => {
                        if (!isAvailable || isPastTime || isExpired || isBooked) return
                        
                        setSelectedTimeSlots(prev => {
                          if (prev.includes(slot.slot)) {
                            // Remove if already selected
                            return prev.filter(s => s !== slot.slot)
                          } else {
                            // Add to selection
                            return [...prev, slot.slot]
                          }
                        })
                      }

                      return (
                        <Button
                          key={slot.slot}
                          variant={isSelected ? "default" : "outline"}
                          disabled={!isAvailable || isPastTime || isExpired || isBooked}
                          className={`w-full justify-start text-left p-4 h-auto transition-all duration-200 ${
                            !isAvailable || isPastTime || isExpired || isBooked
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                              : isSelected 
                                ? 'bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-md transform scale-105' 
                                : 'hover:border-green-300 hover:bg-green-50'
                          }`}
                          onClick={handleTimeSlotClick}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              <div className="font-medium">{slot.label}</div>
                              <div className={`text-sm ${
                                !isAvailable || isPastTime || isExpired || isBooked
                                  ? 'text-gray-400'
                                  : isSelected ? 'text-green-100' : 'text-gray-500'
                              }`}>
                                {isBooked ? (() => {
                                  const details = selectedDate ? getSlotBookingDetails(selectedDate, slot.slot) : null
                                  if (details) {
                                    return (
                                      <div className="text-xs">
                                        <div className="font-medium text-blue-600">Booked</div>
                                        <div className="text-gray-500">Student: {details.studentName}</div>
                                        <div className="text-gray-500">Tutor: {details.tutorName}</div>
                                      </div>
                                    )
                                  }
                                  return 'Booked'
                                })() : isExpired ? 'Expired' : isPastTime ? 'Past time' : !isAvailable ? 'Already booked' : '1 hour session'}
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5" />}
                            {(!isAvailable && !isPastTime && !isExpired && !isBooked) && <XCircle className="w-5 h-5 text-gray-400" />}
                            {isExpired && <XCircle className="w-5 h-5 text-red-400" />}
                            {isBooked && <Clock className="w-5 h-5 text-blue-500" />}
                          </div>
                        </Button>
                      )
                    })
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Summary */}
      {selectedDate && selectedTimeSlots.length > 0 && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Session Details</h3>
                  <p className="text-green-700">Review your booking request ({selectedTimeSlots.length} session{selectedTimeSlots.length > 1 ? 's' : ''})</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4 bg-green-200" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-green-900 mb-1">Student</div>
                <div className="text-green-800">{student.first_name} {student.last_name}</div>
                <div className="text-green-600 text-xs mt-1">{student.program}</div>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-green-900 mb-1">Date</div>
                <div className="text-green-800">{selectedDate ? format(selectedDate, 'EEEE') : ''}</div>
                <div className="text-green-600 text-xs mt-1">{selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : ''}</div>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-green-900 mb-1">Time Slots</div>
                <div className="text-green-800 space-y-1">
                  {selectedTimeSlots.map(slot => (
                    <div key={slot} className="text-sm">
                      {timeSlots.find(s => s.slot === slot)?.label}
                    </div>
                  ))}
                </div>
                <div className="text-green-600 text-xs mt-1">{selectedTimeSlots.length} × 60 minutes</div>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-green-900 mb-1">Status</div>
                <div className="text-green-800">Request Pending</div>
                <div className="text-green-600 text-xs mt-1">Awaits student approval</div>
              </div>
            </div>
            
            <div className="mt-6 bg-white/70 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Important Notes:</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>• This will send a booking request to {student.first_name} {student.last_name}</p>
                <p>• The student will receive a notification to accept or decline your request</p>
                <p>• You will be notified once the student responds to your request</p>
                <p>• Multiple time slots will create separate session requests</p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={bookingLoading}
                className="px-8 py-3 border-2 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBooking} 
                disabled={!selectedDate || selectedTimeSlots.length === 0 || bookingLoading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {bookingLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Request...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Send {selectedTimeSlots.length > 0 ? `${selectedTimeSlots.length} ` : ''}Booking Request{selectedTimeSlots.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      {status && (
        <Card className={`border-2 ${
          status.includes('successfully') || status.includes('sent')
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="p-4">
            <div className={`flex items-center space-x-3 ${
              status.includes('successfully') || status.includes('sent') ? 'text-green-800' : 'text-red-800'
            }`}>
              {status.includes('successfully') || status.includes('sent') ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <div className="font-medium">{status}</div>
                {(status.includes('successfully') || status.includes('sent')) && (
                  <div className="text-sm text-green-600 mt-1">
                    The student will be notified and can accept or decline your request.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// TypeScript interface for student data
interface Student {
  user_id: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  program: string
  role: string
  status: string
  created_at: string
}

export default function StudentMatching() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  // Map of studentId -> assessment info for subjects
  // subjectPercentages: subject_id -> { percentage: number | null, name: string }
  const [studentAssessmentMap, setStudentAssessmentMap] = useState<Record<number, {
    subjectPercentages: Record<number, { percentage: number | null; name: string }>
  }>>({})
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [tutorSubjectId, setTutorSubjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedStudentForBooking, setSelectedStudentForBooking] = useState<Student | null>(null)

  // Fix z-index for all modals to appear above sidebar (sidebar has z-70)
  useEffect(() => {
    const isAnyModalOpen = showBookingModal || showProfileModal || showContactModal
    
    if (isAnyModalOpen) {
      // Use a timer to ensure the dialog elements are rendered
      const timer = setTimeout(() => {
        const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement
        const content = document.querySelector('[data-radix-dialog-content]') as HTMLElement
        
        if (overlay) overlay.style.zIndex = '75'
        if (content) content.style.zIndex = '80'
      }, 10)

      return () => {
        clearTimeout(timer)
        // Reset z-index when modal closes
        const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement
        const content = document.querySelector('[data-radix-dialog-content]') as HTMLElement
        
        if (overlay) overlay.style.zIndex = ''
        if (content) content.style.zIndex = ''
      }
    }
  }, [showBookingModal, showProfileModal, showContactModal])
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9
  
  const { currentUser, isLoading: userLoading } = useUser()
  const { toast } = useToast()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const userProgram = currentUser?.program || ""
  
  // Use constants for programs
  const allPrograms = CICT_PROGRAMS

  // Debug logging for user info
  if (process.env.NODE_ENV === 'development') {
    console.log('Student Matching - Current User Info:', {
      role: userRole,
      program: userProgram,
      fullUser: currentUser
    })
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, programFilter])

  // Fetch students from API
  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('apiUrl/api/students')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.students || [])
        // Don't set filteredStudents here - let the filtering effect handle it
      } else {
        throw new Error('Failed to fetch students')
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students. Please try again later.')
      setStudents([])
      setFilteredStudents([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch tutor profile (to get subject) and then fetch assessments for students if current user is a tutor
  useEffect(() => {
    const loadTutorAndAssessments = async () => {
      if (userLoading || !currentUser || (currentUser.role || '').toLowerCase() !== 'tutor') return;

      try {
        // Get tutor record for current user
        const tutorsRes = await fetch('apiUrl/api/tutors')
        const tutorsData = await tutorsRes.json()
        const myTutor = Array.isArray(tutorsData.tutors) ? tutorsData.tutors.find((t: any) => t.user_id === currentUser.user_id) : null
        const foundTutorSubjectId = myTutor?.subject_id
        setTutorSubjectId(foundTutorSubjectId || null)

        if (!foundTutorSubjectId) {
          // No subject assigned - nothing to do
          return
        }

        // For each student fetch their most recent pre-assessment and compute per-subject percentages
        setLoadingAssessments(true)

        // Limit to students currently loaded to avoid overloading the backend
        const studentsToCheck = students.slice(0, 200) // safety cap

        const assessments = await Promise.all(studentsToCheck.map(async (s) => {
          try {
            const res = await fetch(apiUrl(`/api/pre-assessment-results/user/${s.user_id}?_t=${Date.now()}`))
            if (!res.ok) return { user_id: s.user_id, percentage: null }
            const data = await res.json()
            const latest = Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : null
            if (!latest || !Array.isArray(latest.answers) || latest.answers.length === 0) {
              return { user_id: s.user_id, subjects: {} }
            }

            // Compute per-subject percentages from answers
            const bySubject: Record<number, { correct: number; total: number; name: string }> = {}
            latest.answers.forEach((ans: any) => {
              const sid = Number(ans.subject_id) || 0
              if (!bySubject[sid]) bySubject[sid] = { correct: 0, total: 0, name: ans.subject_name || '' }
              bySubject[sid].total++
              if (ans.is_correct) bySubject[sid].correct++
            })

            const subjectsResult: Record<number, { percentage: number | null; name: string }> = {}
            Object.keys(bySubject).forEach((k) => {
              const sid = Number(k)
              const data = bySubject[sid]
              const pct = data.total > 0 ? (data.correct / data.total) * 100 : null
              subjectsResult[sid] = { percentage: pct, name: data.name }
            })

            return { user_id: s.user_id, subjects: subjectsResult }
          } catch (e) {
            return { user_id: s.user_id, subjects: {} }
          }
        }))
        const map: Record<number, { subjectPercentages: Record<number, { percentage: number | null; name: string }> }> = {}
        assessments.forEach((a: any) => {
          map[a.user_id] = { subjectPercentages: a.subjects || {} }
        })

        setStudentAssessmentMap(map)
      } catch (e) {
        console.error('Error loading tutor assessments:', e)
      } finally {
        setLoadingAssessments(false)
      }
    }

    loadTutorAndAssessments()
  }, [currentUser, students, userLoading])

  useEffect(() => {
    fetchStudents()
  }, [])

  // Initialize filteredStudents when students load and user data is ready
  useEffect(() => {
    if (!userLoading && students.length > 0 && filteredStudents.length === 0) {
      // Initial load - apply filtering immediately
      setFilteredStudents(students)
    }
  }, [students, userLoading, filteredStudents.length])

  // Filter students based on search and program filter
  useEffect(() => {
    // Don't filter while user data is still loading
    if (userLoading) {
      console.log('Filtering skipped - user still loading')
      return
    }
    
    console.log('Filtering students:', {
      students: students.length,
      userRole,
      userProgram,
      searchTerm,
      programFilter
    })
    
    let filtered = students

    // Program-based access control
    if (userRole === "student") {
      // For students, only show students from their own program
      filtered = filtered.filter(student => 
        student.program && student.program === userProgram
      )
      
      // Debug logging for program filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`Student filtering: userProgram="${userProgram}", filtered count=${filtered.length}`)
      }
    } else if (userRole === "admin" && programFilter !== "all") {
      // For admins, apply the selected program filter
      filtered = filtered.filter(student => student.program === programFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }, [searchTerm, programFilter, students, userRole, userProgram, userLoading])

  // Sort filteredStudents so that, for tutors, students who need help in the tutor's subject appear first
  useEffect(() => {
    if (userLoading || !currentUser || (currentUser.role || '').toLowerCase() !== 'tutor') return

    // Try to determine tutor's subject from tutors API
    const sortForTutor = async () => {
      try {
        const tutorsRes = await fetch('apiUrl/api/tutors')
        const tutorsData = await tutorsRes.json()
        const myTutor = Array.isArray(tutorsData.tutors) ? tutorsData.tutors.find((t: any) => t.user_id === currentUser.user_id) : null
        const tutorSubjectId = myTutor?.subject_id
        if (!tutorSubjectId) return

        const sorted = [...filteredStudents].sort((a, b) => {
          const aPctObj = studentAssessmentMap[a.user_id]?.subjectPercentages?.[tutorSubjectId]
          const bPctObj = studentAssessmentMap[b.user_id]?.subjectPercentages?.[tutorSubjectId]
          const aPct = aPctObj?.percentage
          const bPct = bPctObj?.percentage

          const aNeeds = typeof aPct === 'number' && aPct < 82.5 ? 1 : 0
          const bNeeds = typeof bPct === 'number' && bPct < 82.5 ? 1 : 0
          if (aNeeds !== bNeeds) return bNeeds - aNeeds
          // otherwise keep existing order
          return 0
        })

        setFilteredStudents(sorted)
      } catch (e) {
        console.error('Error sorting students for tutor view:', e)
      }
    }

    sortForTutor()
  }, [currentUser, studentAssessmentMap, userLoading])

  // Get unique programs for filter - only for admins
  const programs = userRole === "admin" ? allPrograms : []

  const handleContactStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowContactModal(true)
  }

  const handleBookStudent = (student: Student) => {
    setSelectedStudentForBooking(student)
    setShowBookingModal(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const StudentCard = ({ student }: { student: Student }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
            <AvatarFallback className="text-sm sm:text-lg font-semibold bg-blue-100 text-blue-600">
              {getInitials(student.first_name, student.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl break-words">
                  {student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1 flex-wrap flex-shrink-0">
                {/* Tutor view: show assessment-based badges */}
                {currentUser && (currentUser.role || '').toLowerCase() === 'tutor' && (() => {
                  const assessment = studentAssessmentMap[student.user_id]
                  const subjId = tutorSubjectId
                  const pct = subjId ? assessment?.subjectPercentages?.[subjId]?.percentage ?? null : null

                  if (subjId == null) {
                    return (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] sm:text-xs px-1 sm:px-2">
                        No Subject
                      </Badge>
                    )
                  }

                  if (pct === null || pct === undefined) {
                    return (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] sm:text-xs px-1 sm:px-2">
                        No Assessment
                      </Badge>
                    )
                  }

                  if (typeof pct === 'number' && pct < 82.5) {
                    return (
                      <Badge variant="default" className="bg-green-600 text-[10px] sm:text-xs px-1 sm:px-2">
                        Recommended
                      </Badge>
                    )
                  }

                  if (typeof pct === 'number' && pct < 90) {
                    return (
                      <Badge variant="outline" className="bg-amber-100 border-amber-300 text-amber-800 text-[10px] sm:text-xs px-1 sm:px-2">
                        Suggested
                      </Badge>
                    )
                  }

                  return null
                })()}

                <Badge variant="default" className="bg-green-600 text-[10px] sm:text-xs px-1 sm:px-2">
                  Active Student
                </Badge>
              </div>
            </div>
            <CardDescription className="text-base mt-1">
              {student.program}
            </CardDescription>
            {/* Tutor-only: show per-subject assessment breakdown */}
            {currentUser && (currentUser.role || '').toLowerCase() === 'tutor' && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-2">Assessment Results</div>
                {(() => {
                  const assessment = studentAssessmentMap[student.user_id]
                  if (!assessment || !assessment.subjectPercentages || Object.keys(assessment.subjectPercentages).length === 0) {
                    return <div className="text-xs text-muted-foreground">No assessment data</div>
                  }

                  return (
                    <div className="space-y-1">
                      {Object.entries(assessment.subjectPercentages).map(([sid, info]) => (
                        <div key={sid} className="flex items-center justify-between">
                          <div className="text-xs">{info.name || `Subject ${sid}`}</div>
                          <div className="text-xs font-semibold">
                            {typeof info.percentage === 'number' ? `${info.percentage.toFixed(1)}%` : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="break-all">ID: {student.user_id}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>Joined: {formatDate(student.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compact Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 min-w-0">
            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate min-w-0">{student.email}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {student.program}
            </Badge>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-2 py-1">
              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 lg:justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full lg:w-auto text-xs px-2 py-1"
              onClick={() => {
                setSelectedStudent(student)
                setShowProfileModal(true)
              }}
            >
              Profile
            </Button>
            {currentUser?.role?.toLowerCase() === 'tutor' && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 w-full lg:w-auto text-xs px-2 py-1" 
                onClick={() => handleBookStudent(student)}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Book
              </Button>
            )}
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
              onClick={() => handleContactStudent(student)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Student
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{userLoading ? "Loading user data..." : "Loading students..."}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <User className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error Loading Students</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStudents}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Matching</h1>
          <p className="text-muted-foreground">Connect with students who need your tutoring expertise</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Programs</p>
                <p className="text-2xl font-bold">{programs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students by name, email, or program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Program Filter - Only show for admins */}
          {userRole === "admin" && (
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={fetchStudents} className="w-full sm:w-auto">
            Refresh
          </Button>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 && !userLoading ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || programFilter !== "all" 
              ? "Try adjusting your search or filters." 
              : "No students are currently available."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
            {paginatedStudents.map((student) => (
              <StudentCard key={student.user_id} student={student} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex items-center space-x-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1 max-w-xs overflow-x-auto">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    if (totalPages <= 10) return i + 1;
                    if (currentPage <= 5) return i + 1;
                    if (currentPage > totalPages - 5) return totalPages - 9 + i;
                    return currentPage - 4 + i;
                  }).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[2.5rem] h-8 px-2 flex-shrink-0 ${
                        currentPage === page 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 80 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="text-lg font-semibold bg-green-100 text-green-600">
                  {getInitials(selectedStudent?.first_name || '', selectedStudent?.last_name || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{selectedStudent?.first_name} {selectedStudent?.last_name}</h2>
                <p className="text-muted-foreground">{selectedStudent?.program}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active Student
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                  <p className="mt-1 text-sm">{selectedStudent.user_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{selectedStudent.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Joined Date</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedStudent.created_at)}</p>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Program</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">{selectedStudent.program}</p>
                    </div>
                  </div>
                  {(selectedStudent as any).year_level && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Year Level</Label>
                      <p className="mt-1 text-sm">{(selectedStudent as any).year_level}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-Assessment Results - Only show to tutors */}
              {currentUser?.role?.toLowerCase() === 'tutor' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pre-Assessment Results</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {!studentAssessmentMap[selectedStudent.user_id] ? (
                      <p className="text-sm text-muted-foreground">No assessment data available</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(studentAssessmentMap[selectedStudent.user_id]).map(([sid, info]: [string, any]) => (
                          <div key={sid} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">{info.name || `Subject ${sid}`}</span>
                            </div>
                            <div className="text-sm font-semibold">
                              {info.score}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Email Address</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 ml-7">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  className="order-last sm:order-first w-full sm:w-auto"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  onClick={() => {
                    setShowProfileModal(false)
                    handleContactStudent(selectedStudent)
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                {currentUser?.role?.toLowerCase() === 'tutor' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    onClick={() => {
                      setShowProfileModal(false)
                      handleBookStudent(selectedStudent)
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Session
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Student Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-[425px]" style={{ zIndex: 80 }}>
          <DialogHeader>
            <DialogTitle>Contact Student</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Reach out to ${selectedStudent.first_name} ${selectedStudent.last_name} to offer tutoring services`}
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">
                    {selectedStudent.first_name} {selectedStudent.middle_name ? `${selectedStudent.middle_name} ` : ""}{selectedStudent.last_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStudent.program}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Student ID: {selectedStudent.user_id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input value={selectedStudent.email} readOnly className="flex-1" />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedStudent.email)
                        toast({
                          title: "Copied!",
                          description: "Email address copied to clipboard"
                        })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      const subject = `Tutoring Services Available - ${currentUser?.first_name} ${currentUser?.last_name}`
                      const body = `Hi ${selectedStudent.first_name},\n\nI hope this email finds you well. I am a tutor offering academic support in various subjects and would like to reach out to see if you might be interested in tutoring services.\n\nAs a fellow ${selectedStudent.program} student/graduate, I understand the challenges you might be facing and would be happy to help you succeed in your studies.\n\nPlease let me know if you would like to discuss this further.\n\nBest regards,\n${currentUser?.first_name} ${currentUser?.last_name}`
                      window.location.href = `mailto:${selectedStudent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => setShowContactModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent 
          className="max-w-7xl max-h-[95vh] overflow-y-auto p-0" 
          style={{ zIndex: 80 }}
        >
          <DialogHeader className="px-8 pt-8 pb-4">
            <DialogTitle className="text-2xl font-bold">Professional Tutoring Session Request</DialogTitle>
            <DialogDescription className="text-lg text-gray-600">
              Send a booking request to {selectedStudentForBooking?.first_name} {selectedStudentForBooking?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8">
            {selectedStudentForBooking && (
              <StudentBookingForm 
                student={selectedStudentForBooking}
                currentUser={currentUser}
                onClose={() => {
                  setShowBookingModal(false)
                  setSelectedStudentForBooking(null)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
