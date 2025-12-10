"use client"
import BookingForm from "@/components/modals/BookingForm"
import EnhancedBookingForm from "@/components/modals/EnhancedBookingForm"
import PreAssessmentTestModal from "@/components/modals/PreAssessmentTestModal"
import ApplyAsTutorModalWithAssessment from "@/components/modals/applyastutor_modal_with_assessment"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Star, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap, Loader2, AlertCircle, Check, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useSubjects } from "@/hooks/use-subjects"
import { CICT_PROGRAMS } from "@/lib/constants"

// Helper function to generate initials from name
const getInitials = (name: string): string => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

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
  const [avgLowScore, setAvgLowScore] = useState<string>('82.5')
  const [avgOverallScore, setAvgOverallScore] = useState<string>('82.5')
  const [loadingResults, setLoadingResults] = useState(false)
  const [hasSkippedPreAssessment, setHasSkippedPreAssessment] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [showSubjectPerformance, setShowSubjectPerformance] = useState<boolean>(false) // Changed to false by default
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [tutorsPerPage] = useState(9)
  
  // Subject filter combobox state (for main filter)
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")
  
  // Ratings modal state
  const [showRatingsModal, setShowRatingsModal] = useState(false)
  const [selectedTutorForRatings, setSelectedTutorForRatings] = useState<Tutor | null>(null)
  const [ratingsModalStats, setRatingsModalStats] = useState<{
    comments: any[];
    loading: boolean;
  }>({
    comments: [],
    loading: false
  })
  
  // Tutor statistics state
  const [tutorStats, setTutorStats] = useState<{
    completedCount: number;
    comments: any[];
    loading: boolean;
  }>({
    completedCount: 0,
    comments: [],
    loading: false
  })
  
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()

  // Fallback refresh function for user data; triggers a safe reload to refresh context if a dedicated refresh function
  // is not provided by the UserContext. You can replace this with a context-provided updater if available.
  const refreshCurrentUser = () => {
    if (typeof window !== "undefined") {
      // Simple and reliable way to re-fetch user-related data when a dedicated context method isn't available.
      window.location.reload()
    }
  }

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





  // Fetch pre-assessment results and determine recommended subjects
  const fetchPreAssessmentResults = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      setLoadingResults(true)
      
      // Add cache busting to force fresh data from database
      const timestamp = Date.now()
      const response = await fetch(
        `https://api.cictpeerlearninghub.com/api/pre-assessment-results/user/${currentUser.user_id}?_t=${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('🔄 Fetched fresh pre-assessment data from database at', new Date(data.timestamp || timestamp).toLocaleTimeString())
      
      if (data.success && data.results) {
        setPreAssessmentResults(data.results)
        
        // Determine subjects where student needs help (scored below 82.5%)
        const needHelpSubjects: number[] = []
        const lowScores: number[] = []
        const allScores: number[] = []
        
        data.results.forEach((result: any) => {
          // Track all scores for overall average
          allScores.push(result.percentage)
          
          if (result.percentage < 82.5 && result.subjects_covered) {
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
        const calculatedAvgScore = lowScores.length > 0 ? (lowScores.reduce((a, b) => a + b, 0) / lowScores.length).toFixed(1) : '82.5'
        // Calculate overall average score
        const calculatedOverallAvg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '82.5'
        setRecommendedSubjects(needHelpSubjects)
        setAvgLowScore(calculatedAvgScore)
        setAvgOverallScore(calculatedOverallAvg)
        
        console.log('Pre-assessment results:', data.results)
        console.log('Recommended subjects (scored < 82.5%):', needHelpSubjects)
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
      
      const response = await fetch('https://api.cictpeerlearninghub.com/api/tutors')
      
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
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSubjectFilter, selectedProgramFilter, searchTerm])

  // Fix z-index for all modals to appear above sidebar (sidebar has z-70)
  useEffect(() => {
    const isAnyModalOpen = showBookingModal || showProfileModal || showRatingsModal || showApplyModal || showTestModal
    
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
  }, [showBookingModal, showProfileModal, showRatingsModal, showApplyModal, showTestModal])

  // Available programs (using constants)
  const programs = CICT_PROGRAMS

  // Fetch tutor statistics when profile modal opens
  const fetchTutorStatistics = async (tutorUserId: number) => {
    try {
      setTutorStats(prev => ({ ...prev, loading: true }))
      
      // Fetch completed sessions count
      const countResponse = await fetch(`https://api.cictpeerlearninghub.com/api/tutors/${tutorUserId}/sessions/completed-count`)
      const countData = await countResponse.json()
      
      // Fetch all comments (we'll filter in the component for display)
      const commentsResponse = await fetch(`https://api.cictpeerlearninghub.com/api/tutors/${tutorUserId}/sessions/comments`)
      const commentsData = await commentsResponse.json()
      
      if (countData.success && commentsData.success) {
        setTutorStats({
          completedCount: countData.completedCount,
          comments: commentsData.comments,
          loading: false
        })
      } else {
        console.error('Error fetching tutor statistics:', countData, commentsData)
        setTutorStats({ completedCount: 0, comments: [], loading: false })
      }
    } catch (error) {
      console.error('Error fetching tutor statistics:', error)
      setTutorStats({ completedCount: 0, comments: [], loading: false })
    }
  }
  
  // Fetch ratings for modal
  const fetchRatingsForModal = async (tutorUserId: number) => {
    try {
      setRatingsModalStats(prev => ({ ...prev, loading: true }))
      
      // Fetch all comments for ratings modal
      const commentsResponse = await fetch(`https://api.cictpeerlearninghub.com/api/tutors/${tutorUserId}/sessions/comments`)
      const commentsData = await commentsResponse.json()
      
      if (commentsData.success) {
        setRatingsModalStats({
          comments: commentsData.comments,
          loading: false
        })
      } else {
        console.error('Error fetching tutor ratings:', commentsData)
        setRatingsModalStats({ comments: [], loading: false })
      }
    } catch (error) {
      console.error('Error fetching tutor ratings:', error)
      setRatingsModalStats({ comments: [], loading: false })
    }
  }



  const TutorCard = ({ tutor }: { tutor: Tutor }) => {
    const isSubjectRecommended = recommendedSubjects.includes(tutor.subject_id);
    const [cardStats, setCardStats] = useState<{
      comments: any[];
      loading: boolean;
    }>({
      comments: [],
      loading: false
    });

    // Fetch tutor reviews for card display
    useEffect(() => {
      const fetchCardReviews = async () => {
        try {
          setCardStats(prev => ({ ...prev, loading: true }));
          
          const commentsResponse = await fetch(`https://api.cictpeerlearninghub.com/api/tutors/${tutor.user_id}/sessions/comments?rating_filter=5`);
          const commentsData = await commentsResponse.json();
          
          if (commentsData.success) {
            setCardStats({
              comments: commentsData.comments.slice(0, 3), // Only get 3 most recent
              loading: false
            });
          } else {
            setCardStats({ comments: [], loading: false });
          }
        } catch (error) {
          setCardStats({ comments: [], loading: false });
        }
      };

      fetchCardReviews();
    }, [tutor.user_id]);
    
    // derive numeric rating and 5-star flag
    const ratingValue = typeof tutor.ratings === 'string' ? parseFloat(tutor.ratings) : tutor.ratings || 0;
    const isFiveStar = ratingValue >= 5;

    return (
      <Card className={`hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 ${isFiveStar ? 'ring-2 ring-green-400 border-green-300' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl break-words">{tutor.name || 'Name not provided'}</CardTitle>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-wrap flex-shrink-0">
                  {isFiveStar && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Recommended
                    </Badge>
                  )}
                  {!isFiveStar && isSubjectRecommended && (
                    <Badge variant="outline" className="bg-amber-100 border-amber-300 text-amber-800">
                      Suggested
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
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 mr-1" />
                Since: {tutor.application_date ? new Date(tutor.application_date).toLocaleDateString() : 'N/A'}
              </div>
              {/* Tutor Rating Display - Compact */}
              <div
                className="flex items-center text-xs font-medium group relative"
                title={tutor.ratings ? `Rated ${tutor.ratings} out of 5` : 'No ratings yet'}
              >
                <span className="mr-1">⭐</span>
                <span className="text-xs font-medium">
                  {tutor.ratings ? parseFloat(tutor.ratings.toString()).toFixed(1) : 'No ratings'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="text-xs">
              {tutor.subject_name || 'Subject not specified'}
            </Badge>
            {tutor.program && (
              <Badge variant="secondary" className="text-xs">
                {tutor.program}
              </Badge>
            )}
          </div>
        </div>

        {/* Specialties - Compact */}
        {tutor.specialties && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Specialties</Label>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tutor.specialties}
            </p>
          </div>
        )}



        <div className="pt-4 border-t">
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 lg:justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full lg:w-auto text-xs px-2 py-1"
              onClick={() => {
                setSelectedTutorForRatings(tutor);
                fetchRatingsForModal(tutor.user_id);
                setShowRatingsModal(true);
              }}
            >
              Ratings
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full lg:w-auto text-xs px-2 py-1"
              onClick={() => {
                setSelectedTutor(tutor);
                fetchTutorStatistics(tutor.user_id);
                setShowProfileModal(true);
              }}
            >
              Profile
            </Button>
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 w-full lg:w-auto text-xs px-2 py-1"
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
              <Calendar className="w-3 h-3 mr-1" />
              Book
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    )
  }

  // Memoized filtered and sorted tutors to prevent unnecessary re-renders
  const filteredTutors = useMemo(() => {
    return tutors
      .filter((tutor) => {
        // Filter out current user from tutor list (users shouldn't see themselves)
        const isNotCurrentUser = currentUser?.user_id !== tutor.user_id;
        
        // Subject filter
        const subjectMatch = selectedSubjectFilter === 'all' || tutor.subject_id.toString() === selectedSubjectFilter;
        
        // Program filter - applies to all users
        let programMatch = true
        if (selectedProgramFilter !== "all") {
          // Apply the selected program filter from the dropdown
          programMatch = tutor.program === selectedProgramFilter
        } else if (userRole === "student") {
          // For students with "all" selected, still only show their program
          programMatch = !!(tutor.program && tutor.program === userProgram)
          
          // Debug logging for program filtering
          if (process.env.NODE_ENV === 'development') {
            console.log(`Student view - Tutor "${tutor.name}": program="${tutor.program}", userProgram="${userProgram}", matches=${programMatch}`)
          }
        }
        // For admins/tutors with "all" selected, show all programs
        
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
        // Priority 1: 5-star tutors first
        const ratingA = typeof a.ratings === 'string' ? parseFloat(a.ratings) : a.ratings || 0;
        const ratingB = typeof b.ratings === 'string' ? parseFloat(b.ratings) : b.ratings || 0;
        const aIsFive = ratingA >= 5;
        const bIsFive = ratingB >= 5;

        if (aIsFive && !bIsFive) return -1;
        if (!aIsFive && bIsFive) return 1;

        // Priority 2: Then prioritize tutors recommended by subject (Suggested)
        const aIsSuggested = recommendedSubjects.includes(a.subject_id);
        const bIsSuggested = recommendedSubjects.includes(b.subject_id);
        if (aIsSuggested && !bIsSuggested) return -1;
        if (!aIsSuggested && bIsSuggested) return 1;

        // Priority 3: Within same status, sort by rating (highest first)
        return ratingB - ratingA;
      });
  }, [tutors, currentUser?.user_id, selectedSubjectFilter, selectedProgramFilter, userRole, userProgram, searchTerm, recommendedSubjects]);

  // Check for existing application before opening modal
  const handleApplyAsTutor = async () => {
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to apply as a tutor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/tutor-applications/user/${currentUser.user_id}`);
      const result = await response.json();
      
      if (result.success && result.applications && result.applications.length > 0) {
        // User has existing applications
        const pendingApps = result.applications.filter((app: any) => app.status === 'pending');
        if (pendingApps.length > 0) {
          const app = pendingApps[0];
          toast({
            title: 'Application Already Pending',
            description: `You already have a pending application for ${app.subject_name} submitted on ${app.application_date ? new Date(app.application_date).toLocaleDateString() : 'a previous date'}. Please wait for it to be reviewed.`,
            variant: 'destructive',
            duration: 6000,
          });
          return;
        }
      }
      
      // No pending applications, open the modal
      setShowApplyModal(true);
    } catch (error) {
      console.error('Error checking existing applications:', error);
      // If check fails, still allow opening the modal
      setShowApplyModal(true);
    }
  };

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
        <Button className="bg-green-600 hover:bg-green-700" onClick={handleApplyAsTutor}>
          <User className="w-4 h-4 mr-2" />
          Apply as Tutor
        </Button>
        <ApplyAsTutorModalWithAssessment
          open={showApplyModal}
          onClose={() => setShowApplyModal(false)}
        />

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
          {/* Program Filter - Available for all users */}
          <Select 
            value={selectedProgramFilter} 
            onValueChange={(value) => {
              setSelectedProgramFilter(value)
              // Reset subject filter when program changes
              setSelectedSubjectFilter('all')
            }}
          >
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
          {/* Subject Filter - Shows subjects for selected program */}
          <Popover open={subjectFilterComboboxOpen} onOpenChange={setSubjectFilterComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={subjectFilterComboboxOpen}
                className="w-[280px] justify-between"
              >
                {selectedSubjectFilter === 'all' ? (
                  <>
                    All Subjects
                    {selectedProgramFilter !== 'all' && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({subjects.filter((subject) => {
                          if (Array.isArray(subject.program)) {
                            return subject.program.includes(selectedProgramFilter)
                          } else if (typeof subject.program === 'string') {
                            try {
                              const programArray = JSON.parse(subject.program)
                              return Array.isArray(programArray) && programArray.includes(selectedProgramFilter)
                            } catch {
                              return subject.program === selectedProgramFilter
                            }
                          }
                          return false
                        }).length} available)
                      </span>
                    )}
                  </>
                ) : (
                  subjects.find((subject) => subject.subject_id.toString() === selectedSubjectFilter)?.subject_code + 
                  " - " + 
                  subjects.find((subject) => subject.subject_id.toString() === selectedSubjectFilter)?.subject_name
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Search subjects to filter..." 
                  value={subjectFilterSearchValue}
                  onValueChange={setSubjectFilterSearchValue}
                />
                <CommandList>
                  <CommandEmpty>No subject found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setSelectedSubjectFilter('all')
                        setSubjectFilterComboboxOpen(false)
                        setSubjectFilterSearchValue("")
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedSubjectFilter === 'all' ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">All Subjects</span>
                        <span className="text-sm text-muted-foreground">Show all available subjects</span>
                      </div>
                    </CommandItem>
                    {subjects
                      .filter((subject) => {
                        // Filter subjects by selected program
                        if (selectedProgramFilter === 'all') return true
                        
                        // Check if subject's program matches selected program
                        if (Array.isArray(subject.program)) {
                          return subject.program.includes(selectedProgramFilter)
                        } else if (typeof subject.program === 'string') {
                          try {
                            const programArray = JSON.parse(subject.program)
                            return Array.isArray(programArray) && programArray.includes(selectedProgramFilter)
                          } catch {
                            return subject.program === selectedProgramFilter
                          }
                        }
                        return false
                      })
                      .filter((subject) => {
                        const searchTerm = subjectFilterSearchValue.toLowerCase()
                        const subjectText = `${subject.subject_code} ${subject.subject_name}`.toLowerCase()
                        return (
                          subject.subject_name?.toLowerCase().includes(searchTerm) ||
                          subject.subject_code?.toLowerCase().includes(searchTerm) ||
                          subjectText.includes(searchTerm)
                        )
                      })
                      .sort((a, b) => (a.subject_code || '').localeCompare(b.subject_code || ''))
                      .map((subject) => (
                        <CommandItem
                          key={subject.subject_id}
                          value={subject.subject_id.toString()}
                          onSelect={(currentValue) => {
                            setSelectedSubjectFilter(currentValue)
                            setSubjectFilterComboboxOpen(false)
                            setSubjectFilterSearchValue("")
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedSubjectFilter === subject.subject_id.toString() 
                                ? "opacity-100" 
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{subject.subject_code}</span>
                            <span className="text-sm text-muted-foreground">{subject.subject_name}</span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                Tutors with a 5-star rating are labeled <strong>Recommended</strong> (green) and appear first. Tutors who match your weak subjects but are not 5★ are labeled <strong>Suggested</strong>.
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
      {preAssessmentResults.length > 0 && !loadingResults && showSubjectPerformance && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Your Pre-Assessment Performance by Subject
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your scores for each subject
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPreAssessmentResults}
                  className="text-blue-600 hover:text-blue-700"
                  disabled={loadingResults}
                >
                  {loadingResults ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Data
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubjectPerformance(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Hide Results
                </Button>
              </div>
            </div>
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
                          console.log('📊 Assessment Result Data:', {
                            totalQuestions: result.total_questions,
                            correctAnswers: result.correct_answers,
                            answersArrayLength: userAnswers.length,
                            percentage: result.percentage
                          });
                          console.log('📝 Full user answers array:', userAnswers);
                          console.log('🎯 Sample answer structure:', userAnswers[0]);
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
                      });
                      
                      // Count actual questions per subject from answers
                      if (Array.isArray(userAnswers) && userAnswers.length > 0) {
                        console.log('🔍 Processing answers to count per subject...');
                        console.log('📦 Total answers to process:', userAnswers.length);
                        
                        // Debug: Show unique subjects in answers
                        const uniqueSubjects = [...new Set(userAnswers.map(a => `${a.subject_id}:${a.subject_name}`))];
                        console.log('🎓 Unique subjects in answers:', uniqueSubjects);
                        
                        userAnswers.forEach((answer: any, index: number) => {
                          const subjectId = answer.subject_id;
                          const subjectName = answer.subject_name || 'Unknown Subject';
                          
                          if (index < 3 || !answer.is_correct) {
                            console.log(`[${index}] Q${answer.question_id} - Subject ${subjectId} (${subjectName}): is_correct=${answer.is_correct}, answer="${answer.user_answer?.substring(0, 30)}..."`);
                          }
                          
                          // Initialize subject if not already done
                          if (!subjectScores[subjectId]) {
                            subjectScores[subjectId] = {
                              total: 0,
                              correct: 0,
                              count: 0,
                              name: subjectName,
                              incorrectQuestions: []
                            };
                          }
                          
                          // Count total questions
                          subjectScores[subjectId].total += 1;
                          
                          // Count correct answers
                          if (answer.is_correct) {
                            subjectScores[subjectId].correct += 1;
                          } else {
                            // Store incorrect questions
                            subjectScores[subjectId].incorrectQuestions.push({
                              question: answer.question_text || answer.question,
                              userAnswer: answer.user_answer || answer.selected_answer,
                              correctAnswer: answer.correct_answer,
                              explanation: answer.explanation
                            });
                          }
                        });
                        
                        console.log('📈 Final subject scores calculated:', JSON.stringify(subjectScores, null, 2));
                        console.log('✅ Processing complete. About to display results.');
                      } else {
                        console.warn('⚠️ No userAnswers array found or empty! Using fallback calculation...');
                        // Fallback: If no answers array, distribute proportionally
                        subjects.forEach((subject: any) => {
                          const subjectId = subject.subject_id || subject.subject_code;
                          const questionsForThisSubject = Math.floor(result.total_questions / subjects.length);
                          const correctForThisSubject = Math.floor((result.correct_answers / subjects.length));
                          
                          if (subjectScores[subjectId]) {
                            subjectScores[subjectId].total += questionsForThisSubject;
                            subjectScores[subjectId].correct += correctForThisSubject;
                          }
                        });
                      }
                      
                      // Log the results for debugging
                      subjects.forEach((subject: any) => {
                        const subjectId = subject.subject_id || subject.subject_code;
                        const subjectName = subject.subject_name || 'Unknown Subject';
                        if (subjectScores[subjectId]) {
                          console.log(`Subject ${subjectId} (${subjectName}) - Total: ${subjectScores[subjectId].total}, Correct: ${subjectScores[subjectId].correct}, Incorrect: ${subjectScores[subjectId].incorrectQuestions.length}`);
                        }
                      });
                    } catch (e) {
                      console.error('Error parsing subjects_covered:', e);
                    }
                  }
                });

                // Convert to array and calculate percentages
                return Object.entries(subjectScores).map(([subjectId, data]) => {
                  const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                  const isLow = percentage < 82.5;
                  const isGood = percentage >= 82.5 && percentage < 85;
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

      {/* Show Subject Performance Button (when hidden) */}
      {preAssessmentResults.length > 0 && !loadingResults && !showSubjectPerformance && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowSubjectPerformance(true)}
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Show Pre-Assessment Performance by Subject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Tutors Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
          ) : (() => {
            // Calculate pagination
            const totalTutors = filteredTutors.length
            const totalPages = Math.ceil(totalTutors / tutorsPerPage)
            const startIndex = (currentPage - 1) * tutorsPerPage
            const endIndex = startIndex + tutorsPerPage
            const currentTutors = filteredTutors.slice(startIndex, endIndex)
            
            // Reset to page 1 if current page is beyond available pages
            if (currentPage > totalPages && totalPages > 0) {
              setCurrentPage(1)
              return null
            }
            
            return currentTutors.length > 0 ? (
              currentTutors.map((tutor) => (
                <TutorCard key={tutor.application_id} tutor={tutor} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No tutors match your current filters.</p>
                <Button onClick={() => {
                  setSelectedSubjectFilter('all')
                  setSelectedProgramFilter('all')
                  setSearchTerm('')
                  setCurrentPage(1)
                }} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )
          })()}
        </div>
        
        {/* Pagination Controls */}
        {!loading && !error && tutors.length > 0 && (() => {
          const totalTutors = filteredTutors.length
          const totalPages = Math.ceil(totalTutors / tutorsPerPage)
          const startIndex = (currentPage - 1) * tutorsPerPage
          const endIndex = Math.min(startIndex + tutorsPerPage, totalTutors)
          
          return totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Showing {startIndex + 1}-{endIndex} of {totalTutors} tutors</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {/* Show page numbers */}
                  {(() => {
                    const pages = []
                    const showPages = 5
                    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
                    let endPage = Math.min(totalPages, startPage + showPages - 1)
                    
                    if (endPage - startPage < showPages - 1) {
                      startPage = Math.max(1, endPage - showPages + 1)
                    }
                    
                    // First page and ellipsis
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key="1"
                          variant={1 === currentPage ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-10 p-0"
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </Button>
                      )
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-muted-foreground">...</span>
                        )
                      }
                    }
                    
                    // Current range of pages
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-10 p-0"
                          onClick={() => setCurrentPage(i)}
                        >
                          {i}
                        </Button>
                      )
                    }
                    
                    // Last page and ellipsis
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-muted-foreground">...</span>
                        )
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          variant={totalPages === currentPage ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-10 p-0"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )
        })()}
      </div>
        </>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent 
          className="max-w-7xl max-h-[95vh] overflow-y-auto p-0" 
          style={{ zIndex: 80 }}
        >
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
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto" 
          style={{ zIndex: 80 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="text-lg font-semibold bg-green-100 text-green-600">
                  {getInitials(selectedTutor?.name || '')}
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

              {/* Sessions Statistics */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Sessions Completed</Label>
                    <div className="mt-1">
                      {tutorStats.loading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {tutorStats.completedCount}
                          </Badge>
                          <span className="text-sm text-muted-foreground">completed sessions</span>
                        </div>
                      )}
                    </div>
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

              {/* Student Comments Section */}
              {!tutorStats.loading && tutorStats.comments.length > 0 && (
                <div className="border-t pt-6">
                  <Label className="text-sm font-medium text-muted-foreground">Student Feedback (All Reviews)</Label>
                  <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                    {tutorStats.comments
                      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()) // Sort by most recent first
                      .map((comment, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${
                          comment.rating === 5 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' :
                          comment.rating >= 4 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
                          comment.rating >= 3 ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' :
                          'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{comment.student_name}</span>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${
                                    i < comment.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                  }`} />
                                ))}
                                <span className="ml-1 text-xs text-muted-foreground">({comment.rating}/5)</span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.completed_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            "{comment.feedback}"
                          </p>
                          {comment.subject_name && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {comment.subject_name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
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
      
      {/* Ratings Modal */}
      <Dialog open={showRatingsModal} onOpenChange={setShowRatingsModal}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto" 
          style={{ zIndex: 80 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-bold">{selectedTutorForRatings?.name || 'Tutor'} - Student Reviews</h2>
                <p className="text-muted-foreground">{selectedTutorForRatings?.subject_name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTutorForRatings && (
            <div className="space-y-6">
              {/* Rating Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {selectedTutorForRatings.ratings || '0'}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>
                    <div className="flex items-center">
                      {(() => {
                        const ratingValue = typeof selectedTutorForRatings.ratings === 'string' 
                          ? parseFloat(selectedTutorForRatings.ratings) 
                          : selectedTutorForRatings.ratings || 0;
                        return Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-6 h-6 ${
                            i < ratingValue ? 'text-yellow-500 fill-current' : 'text-gray-300'
                          }`} />
                        ))
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{ratingsModalStats.comments.length}</div>
                    <div className="text-sm text-muted-foreground">Total Reviews</div>
                  </div>
                </div>
              </div>
              
              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Student Reviews</h3>
                {ratingsModalStats.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading reviews...</span>
                  </div>
                ) : ratingsModalStats.comments.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                    {ratingsModalStats.comments
                      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                      .map((comment, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${
                          comment.rating === 5 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' :
                          comment.rating >= 4 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
                          comment.rating >= 3 ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' :
                          'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="font-medium text-sm">{comment.student_name}</div>
                                <div className="flex items-center mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${
                                      i < comment.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                    }`} />
                                  ))}
                                  <span className="ml-2 text-sm text-muted-foreground">({comment.rating}/5)</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {new Date(comment.completed_at).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              {comment.subject_name && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {comment.subject_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            "{comment.feedback}"
                          </p>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No reviews available yet.</p>
                    <p className="text-sm">This tutor hasn't received any student feedback.</p>
                  </div>
                )}
              </div>
              
              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowRatingsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
