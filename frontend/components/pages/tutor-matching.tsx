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
import { Star, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap, Loader2, AlertCircle } from "lucide-react"
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

// Interface for pre-assessment results
interface PreAssessmentResult {
  result_id: number
  user_id: number
  pre_assessment_id: number
  subject_id?: number
  subject_name?: string
  score: number
  total_points: number
  percentage: number
  correct_answers: number
  total_questions: number
  completed_at: string
  subjects_covered?: any
  answers?: any // User's answers to questions
  id?: number // Result ID for fetching detailed data
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
  const [preAssessmentResults, setPreAssessmentResults] = useState<PreAssessmentResult[]>([])
  const [recommendedSubjects, setRecommendedSubjects] = useState<number[]>([])
  const [avgLowScore, setAvgLowScore] = useState<string>('70')
  const [avgOverallScore, setAvgOverallScore] = useState<string>('70')
  const [loadingResults, setLoadingResults] = useState(false)
  const [hasSkippedPreAssessment, setHasSkippedPreAssessment] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
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

  // Filter subjects based on user's program and year level
  const filteredSubjects = subjects.filter(subject => {
    if (!currentUser?.program || !currentUser?.year_level) {
      return false; // Don't show any subjects if user info is incomplete
    }

    // Check if subject program matches user's program
    let programMatch = false;
    if (Array.isArray(subject.program)) {
      programMatch = subject.program.includes(currentUser.program);
    } else if (typeof subject.program === 'string') {
      try {
        const programArray = JSON.parse(subject.program);
        programMatch = Array.isArray(programArray) && programArray.includes(currentUser.program);
      } catch {
        programMatch = subject.program === currentUser.program;
      }
    }

    // Check if subject year level matches user's year level
    const yearLevelMatch = !subject.year_level || subject.year_level === currentUser.year_level;

    return programMatch && yearLevelMatch;
  });

  // Fetch pre-assessment results and determine recommended subjects
  const fetchPreAssessmentResults = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      setLoadingResults(true)
      
      const response = await fetch(`http://localhost:4000/api/pre-assessment-results/user/${currentUser.user_id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.results) {
        setPreAssessmentResults(data.results)
        
        // Determine subjects where student needs help (scored below 70%)
        const needHelpSubjects: number[] = []
        const lowScores: number[] = []
        const allScores: number[] = []
        
        data.results.forEach((result: any) => {
          // Track all scores for overall average
          allScores.push(result.percentage)
          
          if (result.percentage < 70 && result.subjects_covered) {
            lowScores.push(result.percentage)
            try {
              // subjects_covered is already an array from the backend
              const subjects = Array.isArray(result.subjects_covered) 
                ? result.subjects_covered 
                : JSON.parse(result.subjects_covered);
              
              subjects.forEach((subject: any) => {
                if (subject.subject_id && !needHelpSubjects.includes(subject.subject_id)) {
                  needHelpSubjects.push(subject.subject_id)
                }
              })
            } catch (e) {
              console.error('Error parsing subjects_covered:', e, result.subjects_covered)
            }
          }
        })
        
        // Calculate the average of low scores for display
        const calculatedAvgScore = lowScores.length > 0 ? (lowScores.reduce((a, b) => a + b, 0) / lowScores.length).toFixed(1) : '70'
        // Calculate overall average score
        const calculatedOverallAvg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '70'
        setRecommendedSubjects(needHelpSubjects)
        setAvgLowScore(calculatedAvgScore)
        setAvgOverallScore(calculatedOverallAvg)
        
        console.log('Pre-assessment results:', data.results)
        console.log('Recommended subjects (scored < 70%):', needHelpSubjects)
      }
    } catch (err) {
      console.error('Error fetching pre-assessment results:', err)
    } finally {
      setLoadingResults(false)
    }
  }

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

  // Load tutors and pre-assessment results on component mount
  useEffect(() => {
    fetchTutors()
    fetchPreAssessmentResults()
  }, [currentUser?.user_id])

  // Check if user has skipped pre-assessment
  useEffect(() => {
    if (currentUser?.user_id) {
      const skipped = localStorage.getItem(`preAssessmentSkipped_${currentUser.user_id}`)
      setHasSkippedPreAssessment(skipped === 'true')
    }
  }, [currentUser?.user_id])

  // Listen for skip events
  useEffect(() => {
    const handleSkipEvent = (event: CustomEvent) => {
      if (event.detail.userId === currentUser?.user_id) {
        setHasSkippedPreAssessment(true)
      }
    }

    window.addEventListener('preAssessmentSkipped', handleSkipEvent as EventListener)
    
    return () => {
      window.removeEventListener('preAssessmentSkipped', handleSkipEvent as EventListener)
    }
  }, [currentUser?.user_id])

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

    const selectedSubject = filteredSubjects.find(s => s.subject_id.toString() === applicationForm.subject_id)
    
    const applicationData = {
      user_id: currentUser.user_id,
      name: `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`,
      subject_id: parseInt(applicationForm.subject_id),
      subject_name: selectedSubject?.subject_name || "",
      tutor_information: applicationForm.tutor_information,
      program: currentUser.program,
      year_level: currentUser.year_level,
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

  const TutorCard = ({ tutor }: { tutor: Tutor }) => {
    const isRecommended = recommendedSubjects.includes(tutor.subject_id);
    
    return (
      <Card className={`hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 ${isRecommended ? 'ring-2 ring-green-400 border-green-300' : ''}`}>
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-xl">{tutor.name || 'Name not provided'}</CardTitle>
                <div className="flex gap-2">
                  {isRecommended && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Recommended
                    </Badge>
                  )}
                  <Badge variant={tutor.status === "approved" ? "default" : "secondary"}>
                    {tutor.status === "approved" ? "Available" : "Unavailable"}
                  </Badge>
                </div>
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
  }

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
                    <Label className="text-muted-foreground">Year Level</Label>
                    <p className="font-medium">{currentUser?.year_level || 'Not specified'}</p>
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
                    disabled={subjectsLoading || !!subjectsError || !currentUser?.program || !currentUser?.year_level}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        subjectsLoading 
                          ? "Loading subjects..." 
                          : subjectsError 
                            ? "Error loading subjects" 
                            : !currentUser?.program || !currentUser?.year_level
                              ? "Please ensure your profile has program and year level information"
                              : filteredSubjects.length === 0
                                ? "No subjects available for your program and year level"
                                : "Select the subject you want to tutor"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {!subjectsLoading && !subjectsError && filteredSubjects
                        .sort((a, b) => (a.subject_code || '').localeCompare(b.subject_code || ''))
                        .map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                            {subject.subject_code} - {subject.subject_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {currentUser?.program && currentUser?.year_level && filteredSubjects.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No subjects found for {currentUser.program} - {currentUser.year_level}. Please contact admin if this seems incorrect.
                    </p>
                  )}
                  {(!currentUser?.program || !currentUser?.year_level) && (
                    <p className="text-xs text-red-600">
                      Please update your profile with program and year level information to see available subjects.
                    </p>
                  )}
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
              {subjects
                .sort((a, b) => (a.subject_code || '').localeCompare(b.subject_code || ''))
                .map((subject) => (
                  <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                    {subject.subject_code} - {subject.subject_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Check if user has skipped pre-assessment */}
      {hasSkippedPreAssessment ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Pre-Assessment Required for Tutor Matching
              </h3>
              <p className="text-amber-800 dark:text-amber-200 mb-4">
                You have skipped the pre-assessment. To access tutor matching and get personalized tutor recommendations, 
                you need to complete the pre-assessment test.
              </p>
              <div className="flex gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={() => setShowTestModal(true)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Take Pre-Assessment Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (currentUser?.user_id) {
                      localStorage.removeItem(`preAssessmentSkipped_${currentUser.user_id}`)
                      localStorage.removeItem(`preAssessmentSkippedDate_${currentUser.user_id}`)
                      setHasSkippedPreAssessment(false)
                      toast({
                        title: "Preference Updated",
                        description: "You can now access tutor matching. We recommend taking the pre-assessment for personalized recommendations.",
                      })
                    }
                  }}
                >
                  Continue Without Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Recommendations Info */}
          {loadingResults ? (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Analyzing your pre-assessment results to provide personalized tutor recommendations...
            </p>
          </div>
        </div>
      ) : recommendedSubjects.length > 0 ? (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Personalized Tutor Recommendations</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Based on your pre-assessment results (average: {avgLowScore}%), we recommend tutors for the following subjects. 
                Recommended tutors are highlighted with a green badge and appear first, sorted by their ratings (5 stars to lowest).
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {recommendedSubjects.map(subjectId => {
                  const subject = subjects.find(s => s.subject_id === subjectId)
                  return subject ? (
                    <Badge key={subjectId} variant="outline" className="text-xs bg-green-100 border-green-300 text-green-700">
                      {subject.subject_code}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          </div>
        </div>
      ) : preAssessmentResults.length > 0 ? (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Great Job!</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You scored an average of {avgOverallScore}% on your pre-assessments. All tutors are available to help you excel even further!
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Subject Scores Visualization */}
      {preAssessmentResults.length > 0 && !loadingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Your Pre-Assessment Performance by Subject
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your scores for each subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                // Process all results to extract individual subject scores
                const subjectScores: { [key: string]: { 
                  total: number, 
                  correct: number, 
                  count: number, 
                  name: string,
                  incorrectQuestions: any[]
                } } = {};
                
                preAssessmentResults.forEach((result) => {
                  if (result.subjects_covered) {
                    try {
                      const subjects = Array.isArray(result.subjects_covered) 
                        ? result.subjects_covered 
                        : JSON.parse(result.subjects_covered);
                      
                      // Parse answers if available
                      let userAnswers: any[] = [];
                      if (result.answers) {
                        try {
                          userAnswers = typeof result.answers === 'string' 
                            ? JSON.parse(result.answers) 
                            : result.answers;
                          console.log('Parsed user answers:', userAnswers);
                        } catch (e) {
                          console.error('Error parsing answers:', e);
                        }
                      } else {
                        console.log('No answers field found in result:', result);
                      }
                      
                      subjects.forEach((subject: any) => {
                        const subjectId = subject.subject_id || subject.subject_code;
                        const subjectName = subject.subject_name || subject.subject_code || 'Unknown Subject';
                        
                        if (!subjectScores[subjectId]) {
                          subjectScores[subjectId] = {
                            total: 0,
                            correct: 0,
                            count: 0,
                            name: subjectName,
                            incorrectQuestions: []
                          };
                        }
                        
                        // Calculate based on the overall result percentage
                        // Distribute the questions proportionally
                        const questionsForThisSubject = Math.floor(result.total_questions / subjects.length);
                        const correctForThisSubject = Math.floor((result.correct_answers / subjects.length));
                        
                        subjectScores[subjectId].total += questionsForThisSubject;
                        subjectScores[subjectId].correct += correctForThisSubject;
                        subjectScores[subjectId].count += 1;
                        
                        // Extract incorrect questions for this subject
                        if (Array.isArray(userAnswers)) {
                          userAnswers.forEach((answer: any) => {
                            if (answer.subject_id === subjectId && !answer.is_correct) {
                              subjectScores[subjectId].incorrectQuestions.push({
                                question: answer.question_text || answer.question,
                                userAnswer: answer.user_answer || answer.selected_answer,
                                correctAnswer: answer.correct_answer,
                                explanation: answer.explanation
                              });
                            }
                          });
                        }
                        
                        console.log(`Subject ${subjectId} (${subjectName}) - Incorrect questions:`, subjectScores[subjectId].incorrectQuestions.length);
                      });
                    } catch (e) {
                      console.error('Error parsing subjects_covered:', e);
                    }
                  }
                });

                // Convert to array and calculate percentages
                return Object.entries(subjectScores).map(([subjectId, data]) => {
                  const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                  const isLow = percentage < 70;
                  const isGood = percentage >= 70 && percentage < 85;
                  const isExcellent = percentage >= 85;
                  const isExpanded = expandedSubject === subjectId;
                  
                  // Calculate incorrect questions count from the scores
                  const incorrectCount = data.total - data.correct;
                  const hasIncorrectQuestions = incorrectCount > 0;
                  
                  console.log(`Subject ${subjectId} - Total: ${data.total}, Correct: ${data.correct}, Incorrect: ${incorrectCount}, Has data: ${hasIncorrectQuestions}`);

                  return (
                    <div key={subjectId} className="space-y-2 border rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{data.name}</span>
                          {isLow && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300">
                              Needs Improvement
                            </Badge>
                          )}
                          {isGood && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                              Good
                            </Badge>
                          )}
                          {isExcellent && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
                              Excellent
                            </Badge>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${
                          isLow ? 'text-red-600' : isGood ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* Show incorrect questions button - placed below title */}
                      {hasIncorrectQuestions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs -mt-1"
                          onClick={() => setExpandedSubject(isExpanded ? null : subjectId)}
                        >
                          {isExpanded ? '▼ Hide' : '▶'} Incorrect Questions ({incorrectCount})
                        </Button>
                      )}
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isLow 
                              ? 'bg-gradient-to-r from-red-400 to-red-600' 
                              : isGood 
                              ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                              : 'bg-gradient-to-r from-green-400 to-green-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-start text-xs text-muted-foreground">
                        <span>{data.correct}/{data.total} questions correct</span>
                      </div>
                      
                      {/* Incorrect questions list */}
                      {isExpanded && hasIncorrectQuestions && (
                        <div className="mt-3 space-y-3 border-t pt-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Questions You Missed:</h4>
                          {data.incorrectQuestions.length > 0 ? (
                            data.incorrectQuestions.map((item, idx) => (
                              <div key={idx} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded p-3 text-sm">
                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {idx + 1}. {item.question}
                                </p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-start gap-2">
                                    <span className="text-red-600 font-semibold">Your answer:</span>
                                    <span className="text-red-700 dark:text-red-400">{item.userAnswer || 'No answer'}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-green-600 font-semibold">Correct answer:</span>
                                    <span className="text-green-700 dark:text-green-400">{item.correctAnswer}</span>
                                  </div>
                                  {item.explanation && (
                                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                      <span className="text-blue-600 font-semibold">Explanation: </span>
                                      <span className="text-gray-700 dark:text-gray-300">{item.explanation}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            // Show placeholder questions based on calculated incorrect count
                            Array.from({ length: incorrectCount }, (_, idx) => (
                              <div key={idx} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded p-3 text-sm">
                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {idx + 1}. Question details will be available once the system loads your complete assessment data.
                                </p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-start gap-2">
                                    <span className="text-orange-600 font-semibold">Status:</span>
                                    <span className="text-orange-700 dark:text-orange-400">Incorrect answer recorded</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

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
              // Filter out current user from tutor list (users shouldn't see themselves)
              const isNotCurrentUser = currentUser?.user_id !== tutor.user_id;
              
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
              
              return isNotCurrentUser && subjectMatch && programMatch && searchMatch;
            })
            .sort((a, b) => {
              // Priority 1: Recommended tutors first (based on pre-assessment results)
              const aIsRecommended = recommendedSubjects.includes(a.subject_id);
              const bIsRecommended = recommendedSubjects.includes(b.subject_id);
              
              if (aIsRecommended && !bIsRecommended) return -1;
              if (!aIsRecommended && bIsRecommended) return 1;
              
              // Priority 2: Within same recommendation status, sort by rating (highest first)
              const ratingA = typeof a.ratings === 'string' ? parseFloat(a.ratings) : a.ratings || 0;
              const ratingB = typeof b.ratings === 'string' ? parseFloat(b.ratings) : b.ratings || 0;
              return ratingB - ratingA;
            })
            .map((tutor) => (
              <TutorCard key={tutor.application_id} tutor={tutor} />
            ))
        )}
      </div>
        </>
      )}

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
