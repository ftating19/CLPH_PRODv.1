"use client"

import React, { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  Calendar as CalendarIcon, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  GraduationCap,
  BookOpen,
  Star
} from "lucide-react"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { useToast } from "@/hooks/use-toast"

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

interface EnhancedBookingFormProps {
  tutor: any
  currentUser: any
  onClose: () => void
}

export default function EnhancedBookingForm({ tutor, currentUser, onClose }: EnhancedBookingFormProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]) // Changed to array for multiple selection
  const [availability, setAvailability] = useState<AvailabilityData[]>([]) 
  const [bookingDetails, setBookingDetails] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(false)
  const [navigatingMonth, setNavigatingMonth] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [dateRange, setDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(addDays(new Date(), 60)) // Initial load: next 60 days, but will expand dynamically
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
    
    if (!tutor?.user_id) {
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

  // Fetch tutor availability
  const fetchAvailability = async () => {
    if (!tutor?.user_id) return

    try {
      setLoading(true)
      const startDate = format(dateRange.start, 'yyyy-MM-dd')
      const endDate = format(dateRange.end, 'yyyy-MM-dd')
      
      console.log('=== FETCHING AVAILABILITY ===')
      console.log('Tutor ID:', tutor.user_id)
      console.log('Current User ID:', currentUser?.user_id)
      console.log('Date Range:', startDate, 'to', endDate)
      
      const studentId = currentUser?.user_id
      const requesterId = currentUser?.user_id // Include requester ID for conflict checking
      const url = `https://api.cictpeerlearninghub.com/api/tutors/${tutor.user_id}/availability?startDate=${startDate}&endDate=${endDate}&studentId=${studentId}&requesterId=${requesterId}`
      console.log('Request URL:', url)
      
      const response = await fetch(url)
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Availability data received:', data)

      if (data.success) {
        setAvailability(data.availability)
        
        // Process booking details for display
        const bookingDetailsMap = new Map<string, any>()
        if (data.existingBookings && Array.isArray(data.existingBookings)) {
          console.log('=== PROCESSING EXISTING BOOKINGS ===')
          console.log('Total bookings found:', data.existingBookings.length)
          
          data.existingBookings.forEach((booking: any) => {
            console.log('Booking details:', {
              id: booking.booking_id,
              status: booking.status,
              conflict_type: booking.conflict_type,
              student_id: booking.student_id,
              tutor_id: booking.tutor_id,
              current_user_id: currentUser?.user_id,
              time: booking.preferred_time
            })
            
            // Include both 'accepted' and 'booked' status for conflicts
            if (booking.status?.toLowerCase() === 'accepted' || booking.status?.toLowerCase() === 'booked') {
              const bookingDate = new Date(booking.start_date)
              const dateStr = bookingDate.toISOString().split('T')[0]
              const timeSlot = booking.preferred_time
              
              if (timeSlot) {
                const normalizedSlot = timeSlot.replace(' - ', '-')
                const slotKey = `${dateStr}_${normalizedSlot}`
                
                console.log('Processing booking slot:', {
                  original_time: timeSlot,
                  normalized_slot: normalizedSlot,
                  slot_key: slotKey,
                  conflict_type: booking.conflict_type
                })
                
                // Determine conflict type and appropriate messaging
                let conflictInfo = {
                  studentName: booking.student_name,
                  tutorName: booking.tutor_name, 
                  studentId: booking.student_id,
                  tutorId: booking.tutor_id,
                  status: booking.status,
                  conflictType: booking.conflict_type || 'tutor_conflict'
                }
                
                // Add specific messaging based on conflict type
                if (booking.conflict_type === 'requester_conflict') {
                  console.log('Found requester conflict for current user:', currentUser?.user_id)
                  // The requester (current user) has a booking at this time
                  if (booking.tutor_id === currentUser?.user_id) {
                    conflictInfo.message = 'You are tutoring at this time'
                    conflictInfo.isRequesterTutor = true
                  } else if (booking.student_id === currentUser?.user_id) {
                    conflictInfo.message = 'You have a session at this time'
                    conflictInfo.isRequesterStudent = true
                  }
                } else if (booking.conflict_type === 'tutor_conflict') {
                  conflictInfo.message = 'Tutor is booked'
                } else if (booking.conflict_type === 'student_conflict') {
                  conflictInfo.message = 'Student is booked'
                }
                
                console.log('Adding conflict info to map:', conflictInfo)
                bookingDetailsMap.set(slotKey, conflictInfo)
              }
            }
          })
        }
        setBookingDetails(bookingDetailsMap)
        
        console.log('Available days:', data.availability.filter((day: any) => day.slots.length > 0).length)
        console.log('Existing bookings:', data.existingBookings)
      } else {
        console.error('Failed to fetch availability:', data.error)
        toast({
          title: "Availability Error",
          description: data.error || "Unable to load tutor availability. Please try again.",
          variant: "destructive",
          duration: 4000,
        })
        setStatus(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Connection Error",
        description: "Unable to load tutor availability. Please check your connection.",
        variant: "destructive",
        duration: 4000,
      })
      setStatus(`Failed to load availability: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Load availability when component mounts or when tutor changes
  useEffect(() => {
    fetchAvailability()
  }, [tutor?.user_id])
  
  // Load availability when dateRange changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAvailability()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [dateRange])

  // Helper function to get booking details for a specific slot
  const getSlotBookingDetails = (date: Date, slot: string) => {
    const dateStr = date.toISOString().split('T')[0]
    const normalizedSlot = slot.replace(' - ', '-')
    const slotKey = `${dateStr}_${normalizedSlot}`
    return bookingDetails.get(slotKey)
  }

  // Helper function to check if a time slot is booked
  const isTimeSlotBooked = (date: Date, slot: string): boolean => {
    const details = getSlotBookingDetails(date, slot)
    const isBooked = details !== undefined
    
    if (isBooked) {
      console.log('Time slot is booked:', {
        date: date.toISOString().split('T')[0],
        slot: slot,
        conflict_type: details?.conflictType,
        is_requester_conflict: details?.conflictType === 'requester_conflict'
      })
    }
    
    return isBooked
  }

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

  // Get available slots for selected date
  const getAvailableSlotsForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAvailability = availability.find(a => a.date === dateStr)
    
    if (dayAvailability) {
      // If we have explicit data for this date, use it
      const slots = dayAvailability.slots
      return slots.filter(slot => !isTimeSlotInPast(date, slot))
    } else {
      // For dates without explicit data (like weekends), provide default slots
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      const isPastDate = date < startOfDay(new Date())
      
      if (isPastDate) {
        return [] // No slots for past dates
      }
      
      // Provide default time slots for any future date (including weekends)
      const defaultSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ]
      
      if (isWeekend) {
        console.log(`🗓️ Providing default weekend slots for ${format(date, 'yyyy-MM-dd')}:`, defaultSlots)
      }
      
      // Filter out past time slots for today's date
      return defaultSlots.filter(slot => !isTimeSlotInPast(date, slot))
    }
  }

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date): boolean => {
    const availableSlots = getAvailableSlotsForDate(date)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Debug logging for weekends
    if (isWeekend) {
      console.log(`🗓️ Weekend check for ${format(date, 'yyyy-MM-dd')} (${date.toLocaleDateString('en-US', { weekday: 'long' })}):`, {
        availableSlots: availableSlots.length,
        slots: availableSlots
      })
    }
    
    return availableSlots.length > 0
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTimeSlots([]) // Reset time slot selections
  }

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedDate || selectedTimeSlots.length === 0 || !tutor || !currentUser) {
      setStatus("Please select date and at least one time slot.")
      return
    }

    // Prevent tutors from booking themselves (only restriction)
    // Note: Students can book the same tutor multiple times for different time slots
    if (tutor.user_id === currentUser.user_id) {
      setStatus("You cannot book yourself as a tutor.")
      return
    }

    // Check for requester conflicts on selected time slots
    const conflictedSlots = selectedTimeSlots.filter(slot => {
      const details = getSlotBookingDetails(selectedDate, slot)
      return details && details.conflictType === 'requester_conflict'
    })

    if (conflictedSlots.length > 0) {
      const conflictedTimes = conflictedSlots.map(slot => 
        timeSlots.find(s => s.slot === slot)?.label || slot
      ).join(', ')
      
      setStatus(`You cannot book these time slots because you already have sessions scheduled: ${conflictedTimes}`)
      return
    }

    try {
      setBookingLoading(true)
      setStatus("")

      const bookingDate = format(selectedDate, 'yyyy-MM-dd')
      
      // Create multiple bookings for each selected time slot
      const bookingPromises = selectedTimeSlots.map(async (timeSlot) => {
        const [startTime, endTime] = timeSlot.split('-')
        
        const response = await fetch("https://api.cictpeerlearninghub.com/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutor_id: tutor.user_id,
            student_id: currentUser.user_id,
            preferred_dates: [bookingDate, bookingDate], // Same day booking
            preferred_time: `${startTime} - ${endTime}`,
            subject_id: tutor?.subject_id,
            subject_name: tutor?.subject_name
          })
        })

        return await response.json()
      })

      // Wait for all bookings to complete
      const results = await Promise.all(bookingPromises)
      
      // Check if all bookings were successful
      const successfulBookings = results.filter(result => result.success)
      const failedBookings = results.filter(result => !result.success)

      if (successfulBookings.length > 0) {
        // Get tutor name - handle different object structures
        const tutorName = tutor.first_name && tutor.last_name 
          ? `${tutor.first_name} ${tutor.last_name}`
          : (tutor as any).name || 'your tutor'
        
        const timeSlotLabels = selectedTimeSlots.map(slot => 
          timeSlots.find(s => s.slot === slot)?.label || slot
        ).join(', ')
        
        // Show success toast notification
        toast({
          title: "Booking Confirmed! 🎉",
          description: `${successfulBookings.length} session${successfulBookings.length > 1 ? 's' : ''} with ${tutorName} booked for ${format(selectedDate, 'yyyy-MM-dd')} at ${timeSlotLabels}.`,
          duration: 6000,
        })
        
        setStatus(`✅ ${successfulBookings.length} booking${successfulBookings.length > 1 ? 's' : ''} successful! Updating calendar...`)
        
        // Force refresh availability data to immediately reflect the new bookings
        console.log('🔄 Refreshing availability after booking...')
        await fetchAvailability()
        
        // Reset form after calendar is updated
        setSelectedDate(undefined)
        setSelectedTimeSlots([])
        
        // Update status to show booking success
        setStatus(`✅ ${successfulBookings.length} booking${successfulBookings.length > 1 ? 's' : ''} confirmed! Closing...`)
        
        // Show warning if some bookings failed
        if (failedBookings.length > 0) {
          toast({
            title: "Partial Success",
            description: `${failedBookings.length} booking${failedBookings.length > 1 ? 's' : ''} failed. ${successfulBookings.length} booking${successfulBookings.length > 1 ? 's' : ''} confirmed.`,
            variant: "destructive",
            duration: 4000,
          })
        }
        
        // Auto-close the modal after showing success message briefly
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        // All bookings failed
        toast({
          title: "Booking Failed",
          description: "All selected time slots failed to book. Please try again later.",
          variant: "destructive",
          duration: 4000,
        })
        setStatus("All bookings failed. Please try again.")
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: "Connection Error",
        description: "Unable to process your booking. Please check your connection and try again.",
        variant: "destructive",
        duration: 4000,
      })
      setStatus("Booking failed. Please try again.")
    } finally {
      setBookingLoading(false)
    }
  }

  // Custom day renderer for calendar
  const modifiers = {
    available: (date: Date) => hasAvailableSlots(date) && date >= dateRange.start,
    unavailable: (date: Date) => !hasAvailableSlots(date) && date >= dateRange.start,
  }

  const modifiersStyles = {
    available: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      fontWeight: 'bold'
    },
    unavailable: {
      backgroundColor: '#fecaca',
      color: '#dc2626',
      opacity: 0.6
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Professional Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Book a Session</h2>
              <p className="text-blue-100">Schedule your learning session with a professional tutor</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Session with</div>
            <div className="text-xl font-semibold">{tutor?.name || 'Tutor'}</div>
            <div className="text-sm text-blue-200">{tutor?.subject_name}</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10"></div>
      </div>

      {/* Tutor Information Card */}
      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Program</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{tutor?.program || 'Not specified'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Expertise</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{tutor?.subject_name || 'General'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rating</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {tutor?.ratings ? `${tutor.ratings}/5.0` : 'New Tutor'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Mode</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">As per Tutor's Preference</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Booking Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Calendar Section - Enhanced */}
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
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-200 dark:bg-emerald-900/50 border border-emerald-400 dark:border-emerald-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-200 dark:bg-red-900/50 border border-red-400 dark:border-red-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Unavailable</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading || navigatingMonth ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    {navigatingMonth ? 'Navigating calendar...' : 'Loading availability...'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {navigatingMonth ? 'Please wait while we update the calendar view' : 'Please wait while we check the tutor\'s schedule'}
                  </p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    month={currentCalendarMonth}
                    defaultMonth={currentCalendarMonth}
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    onMonthChange={handleMonthChange}
                    fromDate={new Date()} // Allow from today onwards
                    toYear={2030} // Allow up to year 2030
                    weekStartsOn={1} // Start week on Monday
                    showWeekNumber={false}
                    disabled={(date) => {
                      const isPastDate = date < dateRange.start
                      const hasNoSlots = !hasAvailableSlots(date)
                      
                      // Explicitly allow weekends - only disable if past date or no available slots
                      const shouldDisable = isPastDate || hasNoSlots
                      
                      // Debug logging for weekends
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6
                      if (isWeekend) {
                        console.log(`🗓️ Weekend date ${format(date, 'yyyy-MM-dd')}:`, {
                          isPastDate,
                          hasNoSlots,
                          shouldDisable,
                          dayName: date.toLocaleDateString('en-US', { weekday: 'long' })
                        })
                      }
                      
                      return shouldDisable
                    }}
                    modifiers={modifiers}
                    modifiersStyles={{
                      available: {
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        fontWeight: '600',
                        border: '2px solid #34d399'
                      },
                      unavailable: {
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        opacity: 0.6,
                        textDecoration: 'line-through'
                      }
                    }}
                    className="rounded-lg border-2 border-gray-200 shadow-inner bg-white"
                    initialFocus
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Time Slots Section - Enhanced */}
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
                          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
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
                          <p className="text-sm text-gray-500">This date is fully booked. Please choose another date.</p>
                        </div>
                      )
                    }

                    return timeSlots.map((slot) => {
                      const isAvailable = availableSlots.includes(slot.slot)
                      const isSelected = selectedTimeSlots.includes(slot.slot)
                      const isPastTime = selectedDate ? isTimeSlotInPast(selectedDate, slot.slot) : false
                      const isBooked = selectedDate ? isTimeSlotBooked(selectedDate, slot.slot) : false
                      const bookingDetails = selectedDate ? getSlotBookingDetails(selectedDate, slot.slot) : null
                      const isRequesterConflict = bookingDetails?.conflictType === 'requester_conflict'

                      const handleTimeSlotClick = () => {
                        if (!isAvailable || isBooked) return
                        
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
                          className={`w-full h-14 justify-between text-left transition-all duration-200 ${
                            !isAvailable || isBooked
                              ? isPastTime
                                ? "opacity-40 cursor-not-allowed bg-red-50 border-red-200 text-red-400" 
                                : isBooked && isRequesterConflict
                                ? "opacity-50 cursor-not-allowed bg-orange-50 border-orange-200 text-orange-500"
                                : isBooked
                                ? "opacity-50 cursor-not-allowed bg-blue-50 border-blue-200 text-blue-400"
                                : "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                              : isSelected 
                              ? "bg-blue-600 text-white shadow-lg transform scale-[1.02] border-blue-600" 
                              : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-md border-gray-300"
                          }`}
                          disabled={!isAvailable || isBooked}
                          onClick={handleTimeSlotClick}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              isSelected 
                                ? "bg-white" 
                                : isAvailable 
                                ? "bg-green-400" 
                                : isPastTime
                                ? "bg-red-300"
                                : isBooked && isRequesterConflict
                                ? "bg-orange-400"
                                : isBooked
                                ? "bg-blue-300"
                                : "bg-gray-300"
                            }`}></div>
                            <div className="flex-1">
                              <div className="font-medium">{slot.label}</div>
                              <div className={`text-xs ${
                                isSelected 
                                  ? "text-blue-100" 
                                  : isAvailable 
                                  ? "text-gray-500" 
                                  : isPastTime 
                                  ? "text-red-400"
                                  : isBooked && isRequesterConflict
                                  ? "text-orange-400"
                                  : isBooked
                                  ? "text-blue-400" 
                                  : "text-gray-400"
                              }`}>
                                {isBooked ? (() => {
                                  const details = selectedDate ? getSlotBookingDetails(selectedDate, slot.slot) : null
                                  if (details) {
                                    return (
                                      <div className="text-xs">
                                        {details.conflictType === 'requester_conflict' ? (
                                          <div>
                                            <div className="font-medium text-orange-600">
                                              {details.message || 'You are busy'}
                                            </div>
                                            {details.isRequesterTutor ? (
                                              <div className="text-gray-500">Student: {details.studentName}</div>
                                            ) : (
                                              <div className="text-gray-500">Tutor: {details.tutorName}</div>
                                            )}
                                          </div>
                                        ) : (
                                          <div>
                                            <div className="font-medium text-blue-600">
                                              {details.message || 'Booked'}
                                            </div>
                                            <div className="text-gray-500">Student: {details.studentName}</div>
                                            <div className="text-gray-500">Tutor: {details.tutorName}</div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                  return 'Booked'
                                })() : isPastTime ? "Past time" : "60 minute session"}
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5" />}
                          {isBooked && <Clock className={`w-5 h-5 ${isRequesterConflict ? 'text-orange-500' : 'text-blue-500'}`} />}
                          {!isAvailable && (
                            <span className={`text-xs font-medium ${isPastTime ? "text-red-400" : "text-gray-400"}`}>
                              {isPastTime ? "Expired" : "Booked"}
                            </span>
                          )}
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

      {/* Booking Summary - Enhanced */}
      {selectedDate && selectedTimeSlots.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Session Details</h3>
                  <p className="text-blue-700">Review your booking information ({selectedTimeSlots.length} session{selectedTimeSlots.length > 1 ? 's' : ''})</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4 bg-blue-200" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Tutor</div>
                <div className="text-blue-800">{tutor?.name}</div>
                <div className="text-blue-600 text-xs mt-1">{tutor?.subject_name}</div>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Date</div>
                <div className="text-blue-800">{format(selectedDate, 'EEEE')}</div>
                <div className="text-blue-600 text-xs mt-1">{format(selectedDate, 'MMMM dd, yyyy')}</div>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Time Slots</div>
                <div className="text-blue-800 space-y-1">
                  {selectedTimeSlots.map(slot => (
                    <div key={slot} className="text-sm">
                      {timeSlots.find(s => s.slot === slot)?.label}
                    </div>
                  ))}
                </div>
                <div className="text-blue-600 text-xs mt-1">{selectedTimeSlots.length} × 60 minutes</div>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Mode</div>
                <div className="text-blue-800">Tutor's Choice</div>
                <div className="text-blue-600 text-xs mt-1">Online or Face-to-face</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - Enhanced */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-600">
          <p>• Select multiple time slots to book separate sessions for each slot</p>
          <p>• Session format (online/face-to-face) will be determined by your tutor</p>
          <p>• You will receive confirmation and meeting details via email</p>
        </div>
        <div className="flex space-x-4">
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
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            {bookingLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm {selectedTimeSlots.length > 0 ? `${selectedTimeSlots.length} ` : ''}Booking{selectedTimeSlots.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Status Message - Enhanced */}
      {status && (
        <Card className={`border-2 ${
          status.includes('successful') 
            ? 'border-green-200 bg-green-50' 
            : 'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <div className={`flex items-center space-x-3 ${
              status.includes('successful') ? 'text-green-800' : 'text-blue-800'
            }`}>
              {status.includes('successful') ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-blue-600" />
              )}
              <div>
                <div className="font-medium">{status}</div>
                {status.includes('successful') && (
                  <div className="text-sm text-green-600 mt-1">
                    Check your email for session details and meeting link.
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
