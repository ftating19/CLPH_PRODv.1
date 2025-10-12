"use client"
import BookingForm from "@/components/modals/BookingForm"
import EnhancedBookingForm from "@/components/modals/EnhancedBookingForm"
import PreAssessmentTestModal from "@/components/modals/PreAssessmentTestModal"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Star, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap, Loader2 } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useSubjects } from "@/hooks/use-subjects"
import { CICT_PROGRAMS } from "@/lib/constants"

// TypeScript interface for tutor data
interface Tutor {
  application_id: number
  user_id: number
  name: string
  email?: string
  subject_id: number
  subject_name: string
  application_date: string
  status: string
  validated_by: string
  tutor_information: string
  program: string
  specialties: string
  ratings?: number | string
}

export default function TutorMatching() {
  // Subject filter state
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all")
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const userProgram = currentUser?.program || ""
  
  // Debug logging for user info
  if (process.env.NODE_ENV === 'development') {
    console.log('Tutor Matching - Current User Info:', {
      role: userRole,
      program: userProgram,
      fullUser: currentUser
    })
  }

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    subject_id: "",
    specialties: "",
    tutor_information: ""
  })

  // Fetch tutors from API
  const fetchTutors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:4000/api/tutors')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTutors(data.tutors || [])
      } else {
        throw new Error('Failed to fetch tutors')
      }
    } catch (err) {
      console.error('Error fetching tutors:', err)
      setError('Failed to load tutors. Please try again later.')
      setTutors([])
    } finally {
      setLoading(false)
    }
  }

  // Load tutors on component mount
  useEffect(() => {
    fetchTutors()
  }, [])

  // Available programs (using constants)
  const programs = CICT_PROGRAMS

  const handleApplicationSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to apply as a tutor",
        variant: "destructive"
      })
      return
    }

    if (!applicationForm.subject_id || !applicationForm.specialties.trim() || !applicationForm.tutor_information.trim()) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const selectedSubject = subjects.find(s => s.subject_id.toString() === applicationForm.subject_id)
    
    const applicationData = {
      user_id: currentUser.user_id,
      name: `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`,
      subject_id: parseInt(applicationForm.subject_id),
      subject_name: selectedSubject?.subject_name || "",
      tutor_information: applicationForm.tutor_information,
      program: currentUser.program,
      specialties: applicationForm.specialties
    }

    console.log('Submitting tutor application:', applicationData)

    try {
      const response = await fetch('http://localhost:4000/api/tutor-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Application Submitted",
          description: "Your tutor application has been submitted successfully. You will be notified once it's reviewed.",
          variant: "default"
        })

        // Reset form and close modal
        setApplicationForm({
          subject_id: "",
          specialties: "",
          tutor_information: ""
        })
        setShowApplyModal(false)
      } else {
        throw new Error(result.message || 'Failed to submit application')
      }

    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    }
  }

  const TutorCard = ({ tutor }: { tutor: Tutor }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="/placeholder.svg" alt={tutor.name || 'Tutor'} />
            <AvatarFallback className="text-lg font-semibold">
              {tutor.name
                ? tutor.name.split(" ").map((n) => n[0]).join("")
                : 'T'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{tutor.name || 'Name not provided'}</CardTitle>
              <Badge variant={tutor.status === "approved" ? "default" : "secondary"} className="ml-2">
                {tutor.status === "approved" ? "Available" : "Unavailable"}
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">
              {tutor.program || 'Program not specified'}
            </CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              {/* <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                ID: {tutor.user_id || 'N/A'}
              </div> */}
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Since: {tutor.application_date ? new Date(tutor.application_date).toLocaleDateString() : 'Date not available'}
              </div>
              {/* Tutor Rating Display - Modern, Animated, Partial Stars, Tooltip */}
              <div
                className="flex items-center text-sm font-semibold group relative"
                title={tutor.ratings ? `Rated ${tutor.ratings} out of 5` : 'No ratings yet'}
              >
                <span className="mr-1 text-yellow-700">Rating:</span>
                <div className="flex items-center">
                  {(() => {
                    const ratingValue = typeof tutor.ratings === 'string' ? parseFloat(tutor.ratings) : tutor.ratings || 0;
                    const fullStars = Math.floor(ratingValue);
                    const hasHalfStar = ratingValue - fullStars >= 0.25 && ratingValue - fullStars < 0.75;
                    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                    const stars = [];
                    for (let i = 0; i < fullStars; i++) {
                      stars.push(
                        <span key={"full"+i} className="w-5 h-5 mr-0.5 text-yellow-500 group-hover:scale-110 transition-transform duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.049 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z"/>
                          </svg>
                        </span>
                      );
                    }
                    if (hasHalfStar) {
                      stars.push(
                        <span key="half" className="w-5 h-5 mr-0.5 text-yellow-500 group-hover:scale-110 transition-transform duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-full h-full">
                            <defs>
                              <linearGradient id="halfStar" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="50%" stopColor="#facc15" />
                                <stop offset="50%" stopColor="#e5e7eb" />
                              </linearGradient>
                            </defs>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.049 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" fill="url(#halfStar)" stroke="#facc15" strokeWidth="1.5"/>
                          </svg>
                        </span>
                      );
                    }
                    for (let i = 0; i < emptyStars; i++) {
                      stars.push(
                        <span key={"empty"+i} className="w-5 h-5 mr-0.5 text-gray-300 group-hover:scale-110 transition-transform duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.049 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z"/>
                          </svg>
                        </span>
                      );
                    }
                    return stars;
                  })()}
                  <span className="ml-2 text-xs text-gray-500">
                    {tutor.ratings ? tutor.ratings : 'No ratings yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Subject Expertise</Label>
          <Badge variant="outline" className="text-sm">
            {tutor.subject_name || 'Subject not specified'}
          </Badge>
        </div>

        {/* Program */}
        {tutor.program && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Program</Label>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{tutor.program}</span>
            </div>
          </div>
        )}

        {/* Specialties */}
        {tutor.specialties && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Specialties</Label>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tutor.specialties}
            </p>
          </div>
        )}

        {/* Additional Information */}
        {tutor.tutor_information && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Additional Information</Label>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tutor.tutor_information}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end pt-4 border-t">
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
              setSelectedTutor(tutor);
              setShowProfileModal(true);
            }}>
              View Profile
            </Button>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (currentUser?.user_id === tutor.user_id) {
                  toast({
                    title: "Booking Not Allowed",
                    description: "You cannot book yourself as a tutor.",
                    variant: "destructive"
                  });
                  return;
                }
                setSelectedTutor(tutor);
                setShowBookingModal(true);
              }}
              disabled={tutor.status !== 'approved'}
              title={currentUser?.user_id === tutor.user_id ? 'You cannot book yourself as a tutor.' : ''}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Tutor Matching</h1>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowTestModal(true)}>
            Take our test
          </Button>
        </div>
        <PreAssessmentTestModal 
          open={showTestModal} 
          onOpenChange={setShowTestModal}
          currentUser={currentUser}
        />
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <User className="w-4 h-4 mr-2" />
              Apply as Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Apply to Become a Tutor</DialogTitle>
              <DialogDescription>
                Share your expertise and help fellow students succeed in their academic journey.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* User Information Display */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">
                      {currentUser ? `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}` : 'Not logged in'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{currentUser?.email || 'Not logged in'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Program</Label>
                    <p className="font-medium">{currentUser?.program || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Application Date</Label>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Expertise *</Label>
                  <Select 
                    value={applicationForm.subject_id} 
                    onValueChange={(value) => setApplicationForm(prev => ({...prev, subject_id: value}))}
                    disabled={subjectsLoading || !!subjectsError}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={subjectsLoading ? "Loading subjects..." : subjectsError ? "Error loading subjects" : "Select the subject you want to tutor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!subjectsLoading && !subjectsError && subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                          {subject.subject_code} - {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Program selection hidden. Program is auto-filled from user profile and not shown in the modal. */}

                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties *</Label>
                  <Textarea 
                    id="specialties"
                    placeholder="List your specific skills and areas of expertise (e.g., Java Programming, Algorithm Design, Data Analysis, etc.)"
                    value={applicationForm.specialties}
                    onChange={(e) => setApplicationForm(prev => ({...prev, specialties: e.target.value}))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutor_information">Teaching Experience & Additional Information *</Label>
                  <Textarea 
                    id="tutor_information"
                    placeholder="Describe your teaching/tutoring experience, achievements, and any additional information that makes you a great tutor (e.g., tutoring experience, academic achievements, projects, etc.)"
                    value={applicationForm.tutor_information}
                    onChange={(e) => setApplicationForm(prev => ({...prev, tutor_information: e.target.value}))}
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Application Process</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your application will be reviewed by administrators. You will be notified via email once your application is approved or if additional information is needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApplicationSubmit}
                  disabled={!currentUser}
                >
                  Submit Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tutors by name, subject, or specialty..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {/* Program Filter - Only show for admins */}
          {userRole === "admin" && (
            <Select value={selectedProgramFilter} onValueChange={setSelectedProgramFilter}>
              <SelectTrigger className="w-[200px]">
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
          <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                  {subject.subject_code} - {subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading tutors...</span>
            </div>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTutors} variant="outline">
              Try Again
            </Button>
          </div>
        ) : tutors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No tutors available at the moment.</p>
            <Button onClick={fetchTutors} variant="outline">
              Refresh
            </Button>
          </div>
        ) : (
          tutors
            .filter((tutor) => {
              // Subject filter
              const subjectMatch = selectedSubjectFilter === 'all' || tutor.subject_id.toString() === selectedSubjectFilter;
              
              // Program filter - for students, automatically filter by their program
              let programMatch = true
              if (userRole === "student") {
                // For students, only show tutors that exactly match their program
                programMatch = !!(tutor.program && tutor.program === userProgram)
                
                // Debug logging for program filtering
                if (process.env.NODE_ENV === 'development') {
                  console.log(`Tutor "${tutor.name}": program="${tutor.program}", userProgram="${userProgram}", matches=${programMatch}`)
                }
              } else if (userRole === "admin" && selectedProgramFilter !== "all") {
                // For admins, apply the selected program filter
                programMatch = tutor.program === selectedProgramFilter
              }
              
              // Search filter
              const term = searchTerm.trim().toLowerCase();
              let searchMatch = true;
              if (term) {
                const nameMatch = tutor.name?.toLowerCase().includes(term);
                const specialtyMatch = tutor.specialties?.toLowerCase().includes(term);
                const subjectNameMatch = tutor.subject_name?.toLowerCase().includes(term);
                searchMatch = nameMatch || specialtyMatch || subjectNameMatch;
              }
              
              return subjectMatch && programMatch && searchMatch;
            })
            .sort((a, b) => {
              const ratingA = typeof a.ratings === 'string' ? parseFloat(a.ratings) : a.ratings || 0;
              const ratingB = typeof b.ratings === 'string' ? parseFloat(b.ratings) : b.ratings || 0;
              return ratingB - ratingA;
            })
            .map((tutor) => (
              <TutorCard key={tutor.application_id} tutor={tutor} />
            ))
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="px-8 pt-8 pb-4">
            <DialogTitle className="text-2xl font-bold">Professional Tutoring Session</DialogTitle>
            <DialogDescription className="text-lg text-gray-600">
              Schedule your personalized learning session with an expert tutor
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8">
            <EnhancedBookingForm 
              tutor={selectedTutor} 
              currentUser={currentUser} 
              onClose={() => setShowBookingModal(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src="/placeholder.svg" alt={selectedTutor?.name || 'Tutor'} />
                <AvatarFallback className="text-lg font-semibold">
                  {selectedTutor?.name
                    ? selectedTutor.name.split(" ").map((n) => n[0]).join("")
                    : 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{selectedTutor?.name || 'Tutor Profile'}</h2>
                <p className="text-muted-foreground">{selectedTutor?.program}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTutor && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedTutor.status === "approved" ? "default" : "secondary"}>
                      {selectedTutor.status === "approved" ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                  <p className="mt-1 text-sm">
                    {selectedTutor.application_date ? new Date(selectedTutor.application_date).toLocaleDateString() : 'Date not available'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject Expertise</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {selectedTutor.subject_name || 'Subject not specified'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rating</Label>
                  <div className="flex items-center mt-1">
                    {(() => {
                      const ratingValue = typeof selectedTutor.ratings === 'string' ? parseFloat(selectedTutor.ratings) : selectedTutor.ratings || 0;
                      const fullStars = Math.floor(ratingValue);
                      const hasHalfStar = ratingValue - fullStars >= 0.25 && ratingValue - fullStars < 0.75;
                      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                      const stars = [];
                      for (let i = 0; i < fullStars; i++) {
                        stars.push(
                          <Star key={"full"+i} className="w-4 h-4 text-yellow-500 fill-current" />
                        );
                      }
                      if (hasHalfStar) {
                        stars.push(
                          <Star key="half" className="w-4 h-4 text-yellow-500 fill-current opacity-50" />
                        );
                      }
                      for (let i = 0; i < emptyStars; i++) {
                        stars.push(
                          <Star key={"empty"+i} className="w-4 h-4 text-gray-300" />
                        );
                      }
                      return stars;
                    })()}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {selectedTutor.ratings ? `${selectedTutor.ratings}/5.0` : 'No ratings yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Program */}
              {selectedTutor.program && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Academic Program</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedTutor.program}</span>
                  </div>
                </div>
              )}

              {/* Specialties */}
              {selectedTutor.specialties && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Specialties</Label>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {selectedTutor.specialties}
                  </p>
                </div>
              )}

              {/* Additional Information */}
              {selectedTutor.tutor_information && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Teaching Experience & Additional Information</Label>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {selectedTutor.tutor_information}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (currentUser?.user_id === selectedTutor.user_id) {
                      toast({
                        title: "Booking Not Allowed",
                        description: "You cannot book yourself as a tutor.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setShowProfileModal(false);
                    setShowBookingModal(true);
                  }}
                  disabled={selectedTutor.status !== 'approved'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
