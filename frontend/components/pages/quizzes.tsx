"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Brain, Clock, Trophy, Plus, Search, Filter, Star, Play, CheckCircle, Trash2, Edit, X, ChevronLeft, ChevronRight, Layers, List, User, Check, AlertCircle, Target, XCircle, ChevronsUpDown } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useQuizzes, useQuizQuestions, useQuizAttempts, useQuizzesWithPending } from "@/hooks/use-quizzes"
import { useSubjects } from "@/hooks/use-subjects"
import { useSearchParams } from "next/navigation"
import { StarRating } from "@/components/ui/star-rating"

// Question types
type QuestionType = "multiple-choice" | "true-false" | "enumeration" | "essay"

interface Question {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
  question_type?: QuestionType
}

interface Quiz {
  id: number
  quiz_id?: number // For database compatibility
  title: string
  subject: string
  questions: Question[]
  questionCount?: number // Add optional question count from database
  duration: string
  duration_unit?: string // Add optional duration unit
  difficulty: string
  description: string
  completedTimes: number
  bestScore: number | null
  lastAttempt: string | null
  status?: 'pending' | 'approved' | 'rejected'
  is_pending?: boolean
  created_at?: string // Add created_at timestamp
  comment?: string // Rejection comment from faculty/admin
}

export default function Quizzes() {
  // Get search params for view mode
  const searchParams = useSearchParams()
  const simpleView = searchParams?.get("view") === "simple"
  
  // Program options
  const programOptionsRaw = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ];
  // Remove duplicates from program options
  const programOptions = Array.from(new Set(programOptionsRaw));

  const { currentUser } = useUser();
  const userRole = currentUser?.role?.toLowerCase() || "student";
  const userProgram = currentUser?.program || "";
  
  const programDropdownOptions = userRole === "admin"
    ? programOptions
    : programOptions.filter(opt => opt === userProgram);
  const [quizProgram, setQuizProgram] = useState(userRole === "admin" ? "" : userProgram);
  
  // Update quizProgram when currentUser loads or changes
  useEffect(() => {
    if (currentUser && userRole !== "admin") {
      setQuizProgram(currentUser.program || "");
    }
  }, [currentUser, userRole]);
  
  // Debug logging for user info
  if (process.env.NODE_ENV === 'development') {
    console.log('Current User Info:', {
      role: userRole,
      program: userProgram,
      quizProgram: quizProgram,
      fullUser: currentUser
    })
  }
  
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  
  // Quiz taking states
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({})
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  // Remove viewMode and always use list view
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all")
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>("all")
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all")
  
  // Subject combobox state
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")
  
  // Create quiz subject combobox state  
  const [createQuizSubjectComboboxOpen, setCreateQuizSubjectComboboxOpen] = useState(false)
  const [createQuizSubjectSearchValue, setCreateQuizSubjectSearchValue] = useState("")
  
  // Confirmation and time-up dialogs
  const [showStartConfirmation, setShowStartConfirmation] = useState(false)
  const [quizToStart, setQuizToStart] = useState<Quiz | null>(null)
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)
  
  // Rating prompt dialog
  const [showRatingPrompt, setShowRatingPrompt] = useState(false)
  const [quizToRate, setQuizToRate] = useState<{id: number, title: string} | null>(null)
  
  // Quiz results modal states
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [quizResults, setQuizResults] = useState<{
    quiz: Quiz | null
    score: number
    correctAnswers: number
    totalQuestions: number
    timeSpent: number
    totalPointsEarned: number
    totalPointsPossible: number
    questionResults: {
      question: Question
      userAnswer: string
      isCorrect: boolean
      pointsEarned: number
      explanation?: string
    }[]
  } | null>(null)
  
  // Rejection comment dialog states
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [selectedRejectionComment, setSelectedRejectionComment] = useState<{ title: string, comment: string } | null>(null)
  
  // Removed duplicate declaration of currentUser
  const { toast } = useToast()

  // Database hooks
  // Use different hooks based on view mode
  // In tools (non-simple view), fetch including pending quizzes for the current user
  // In learning (simple view), use regular quizzes
  const { quizzes: regularQuizzes, loading: regularLoading, error: regularError, refetch: regularRefetch } = useQuizzes()
  const { quizzes: quizzesWithPending, loading: pendingLoading, error: pendingError, refetch: pendingRefetch } = useQuizzesWithPending(!simpleView && currentUser?.user_id ? currentUser.user_id : null)
  
  // Select appropriate data based on view mode
  const quizzes = !simpleView && currentUser?.user_id ? quizzesWithPending : regularQuizzes
  const quizzesLoading = !simpleView && currentUser?.user_id ? pendingLoading : regularLoading
  const quizzesError = !simpleView && currentUser?.user_id ? pendingError : regularError
  const refetchQuizzes = !simpleView && currentUser?.user_id ? pendingRefetch : regularRefetch
  
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { questions, loading: questionsLoading } = useQuizQuestions(currentQuiz?.id || currentQuiz?.quiz_id || null)
  const { createAttempt } = useQuizAttempts()
  
  // User attempts state
  const [userAttempts, setUserAttempts] = useState<{[quizId: number]: any[]}>({})
  const [attemptsLoading, setAttemptsLoading] = useState(true)
  
  // Quiz statistics state (unique users count)
  const [quizStatistics, setQuizStatistics] = useState<{[quizId: number]: {unique_users: number}}>({})
  const [statisticsLoading, setStatisticsLoading] = useState(true)

  // Quiz ratings state
  const [quizRatings, setQuizRatings] = useState<{[quizId: number]: {average_rating: number, total_ratings: number}}>({})
  const [userRatings, setUserRatings] = useState<{[quizId: number]: number}>({})
  const [userComments, setUserComments] = useState<{[quizId: number]: string}>({})
  const [ratingsLoading, setRatingsLoading] = useState(true)

  // Fetch user attempts when user is available
  useEffect(() => {
    const fetchUserAttempts = async () => {
      if (!currentUser?.user_id) {
        setAttemptsLoading(false)
        return
      }

      try {
        const response = await fetch(`http://localhost:4000/api/quiz-attempts/user/${currentUser.user_id}`)
        const data = await response.json()
        
        if (data.success && data.attempts) {
          // Group attempts by quiz_id
          const attemptsByQuiz: {[quizId: number]: any[]} = {}
          data.attempts.forEach((attempt: any) => {
            // Convert quiz_id to number to match the frontend quiz ID type
            const quizId = parseInt(attempt.quizzes_id || attempt.quiz_id)
            if (!attemptsByQuiz[quizId]) {
              attemptsByQuiz[quizId] = []
            }
            attemptsByQuiz[quizId].push(attempt)
          })
          setUserAttempts(attemptsByQuiz)
        }
      } catch (error) {
        console.error('Error fetching user attempts:', error)
      } finally {
        setAttemptsLoading(false)
      }
    }

    fetchUserAttempts()
  }, [currentUser?.user_id])

  // Fetch quiz statistics for all quizzes
  useEffect(() => {
    const fetchQuizStatistics = async () => {
      if (quizzes.length === 0) {
        setStatisticsLoading(false)
        return
      }

      try {
        const statisticsPromises = quizzes.map(async (quiz: any) => {
          try {
            const response = await fetch(`http://localhost:4000/api/quiz-attempts/statistics/${quiz.quizzes_id}`)
            const data = await response.json()
            
            if (data.success && data.statistics) {
              return {
                quizId: quiz.quizzes_id,
                unique_users: data.statistics.unique_users || 0
              }
            }
            return {
              quizId: quiz.quizzes_id,
              unique_users: 0
            }
          } catch (error) {
            console.error(`Error fetching statistics for quiz ${quiz.quizzes_id}:`, error)
            return {
              quizId: quiz.quizzes_id,
              unique_users: 0
            }
          }
        })

        const statisticsArray = await Promise.all(statisticsPromises)
        const statisticsMap: {[quizId: number]: {unique_users: number}} = {}
        
        statisticsArray.forEach(stat => {
          statisticsMap[stat.quizId] = { unique_users: stat.unique_users }
        })
        
        setQuizStatistics(statisticsMap)
      } catch (error) {
        console.error('Error fetching quiz statistics:', error)
      } finally {
        setStatisticsLoading(false)
      }
    }

    fetchQuizStatistics()
  }, [quizzes])

  // Fetch quiz ratings
  useEffect(() => {
    const fetchQuizRatings = async () => {
      if (!quizzes || quizzes.length === 0) {
        setRatingsLoading(false)
        return
      }

      try {
        // Fetch average ratings for all quizzes
        const ratingsPromises = quizzes.map(async (quiz: any) => {
          try {
            const response = await fetch(`http://localhost:4000/api/quizzes/${quiz.quizzes_id}/rating`)
            if (response.ok) {
              const data = await response.json()
              return {
                quizId: quiz.quizzes_id,
                average_rating: data.average_rating || 0,
                total_ratings: data.total_ratings || 0
              }
            }
            return { quizId: quiz.quizzes_id, average_rating: 0, total_ratings: 0 }
          } catch (error) {
            console.error(`Error fetching rating for quiz ${quiz.quizzes_id}:`, error)
            return { quizId: quiz.quizzes_id, average_rating: 0, total_ratings: 0 }
          }
        })

        const ratingsArray = await Promise.all(ratingsPromises)
        const ratingsMap: {[quizId: number]: {average_rating: number, total_ratings: number}} = {}
        ratingsArray.forEach(rating => {
          ratingsMap[rating.quizId] = { average_rating: rating.average_rating, total_ratings: rating.total_ratings }
        })
        setQuizRatings(ratingsMap)

        // Fetch user's ratings if logged in
        if (currentUser?.user_id) {
          const userRatingsPromises = quizzes.map(async (quiz: any) => {
            try {
              const response = await fetch(`http://localhost:4000/api/quizzes/${quiz.quizzes_id}/rating/${currentUser.user_id}`)
              if (response.ok) {
                const data = await response.json()
                return {
                  quizId: quiz.quizzes_id,
                  rating: data.rating?.rating || 0
                }
              }
              return { quizId: quiz.quizzes_id, rating: 0 }
            } catch (error) {
              return { quizId: quiz.quizzes_id, rating: 0 }
            }
          })

          const userRatingsArray = await Promise.all(userRatingsPromises)
          const userRatingsMap: {[quizId: number]: number} = {}
          const userCommentsMap: {[quizId: number]: string} = {}
          userRatingsArray.forEach(rating => {
            if (rating.rating > 0) {
              userRatingsMap[rating.quizId] = rating.rating
            }
          })
          
          // Fetch user's comments
          const userCommentsPromises = quizzes.map(async (quiz: any) => {
            try {
              const response = await fetch(`http://localhost:4000/api/quizzes/${quiz.quizzes_id}/rating/${currentUser.user_id}`)
              if (response.ok) {
                const data = await response.json()
                return {
                  quizId: quiz.quizzes_id,
                  comment: data.rating?.comment || null
                }
              }
              return { quizId: quiz.quizzes_id, comment: null }
            } catch (error) {
              return { quizId: quiz.quizzes_id, comment: null }
            }
          })
          
          const userCommentsArray = await Promise.all(userCommentsPromises)
          userCommentsArray.forEach(item => {
            if (item.comment) {
              userCommentsMap[item.quizId] = item.comment
            }
          })
          
          setUserRatings(userRatingsMap)
          setUserComments(userCommentsMap)
        }
      } catch (error) {
        console.error('Error fetching quiz ratings:', error)
      } finally {
        setRatingsLoading(false)
      }
    }

    fetchQuizRatings()
  }, [quizzes, currentUser?.user_id])

  // Handle quiz rating
  const handleRateQuiz = async (quizId: number, rating: number, comment?: string) => {
    if (!currentUser?.user_id) {
      toast({
        title: "Error",
        description: "You must be logged in to rate quizzes",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`http://localhost:4000/api/quizzes/${quizId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          rating: rating,
          comment: comment || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        setQuizRatings(prev => ({
          ...prev,
          [quizId]: {
            average_rating: data.average_rating,
            total_ratings: data.total_ratings
          }
        }))
        setUserRatings(prev => ({
          ...prev,
          [quizId]: rating
        }))
        
        // Update comment if provided
        if (comment) {
          setUserComments(prev => ({
            ...prev,
            [quizId]: comment
          }))
        } else {
          // Remove comment if empty
          setUserComments(prev => {
            const newComments = { ...prev }
            delete newComments[quizId]
            return newComments
          })
        }

        toast({
          title: "Success",
          description: "Quiz rated successfully!",
          duration: 2000
        })
      } else {
        throw new Error('Failed to rate quiz')
      }
    } catch (error) {
      console.error('Error rating quiz:', error)
      toast({
        title: "Error",
        description: "Failed to rate quiz. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Get user_id early for use in filters
  const user_id = currentUser?.user_id

  // Convert database quiz to component Quiz format
  const quizList = quizzes.map((dbQuiz: any) => {
    const quizAttempts = userAttempts[dbQuiz.quizzes_id] || []
    const bestScore = quizAttempts.length > 0 ? Math.max(...quizAttempts.map(attempt => attempt.score)) : null
    const lastAttempt = quizAttempts.length > 0 ? quizAttempts[quizAttempts.length - 1].created_at : null
    
    const mappedQuiz = {
      id: dbQuiz.quizzes_id,
      quiz_id: dbQuiz.quizzes_id,
      title: dbQuiz.title,
      subject: dbQuiz.subject_name,
      questions: [], // Will be loaded separately when needed
      questionCount: dbQuiz.item_counts || 0, // Add question count from database
      duration: `${dbQuiz.duration || 15}`, // Duration is always stored in minutes in the database
      duration_unit: 'minutes', // Always use minutes since database stores in minutes
      difficulty: dbQuiz.difficulty || 'Medium',
      description: dbQuiz.description || 'Test your knowledge in this subject area',
      completedTimes: quizAttempts.length,
      bestScore: bestScore,
      lastAttempt: lastAttempt,
      created_by: dbQuiz.created_by,
      creator_name: `${dbQuiz.first_name || ''} ${dbQuiz.last_name || ''}`.trim(),
      program: dbQuiz.program || '', // Add program from database
      quiz_view: dbQuiz.quiz_view || 'Personal', // Add quiz_view from database
      status: dbQuiz.status, // Add status field (pending, approved, rejected)
      is_pending: dbQuiz.is_pending, // Add is_pending flag
      created_at: dbQuiz.created_at, // Add created_at timestamp
      comment: dbQuiz.comment, // Add rejection comment
    }
    
    // Debug log
    console.log(`📋 Quiz "${mappedQuiz.title}": quiz_view="${mappedQuiz.quiz_view}", program="${mappedQuiz.program}", status="${mappedQuiz.status}", is_pending=${mappedQuiz.is_pending}`)
    
    return mappedQuiz
  })

  // Filter quizzes based on search and filter criteria
  const filteredQuizList = quizList.filter((quiz: any) => {
    // Debug: Log quiz_view for all quizzes
    if (simpleView) {
      console.log(`🔍 Quiz "${quiz.title}": quiz_view="${quiz.quiz_view}", simpleView=${simpleView}`)
    }
    
    // Search filter
    const matchesSearch = searchQuery.trim() === "" || 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Subject filter
    const matchesSubject = selectedSubjectFilter === "all" || quiz.subject === selectedSubjectFilter

    // Difficulty filter
    const matchesDifficulty = selectedDifficultyFilter === "all" || quiz.difficulty === selectedDifficultyFilter

    // Program filter - for students, automatically filter by their program
    let matchesProgram = true
    if (userRole === "student") {
      // For students, only show quizzes that exactly match their program
      matchesProgram = quiz.program && quiz.program === userProgram
      
      // Debug logging for program filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`Quiz "${quiz.title}": program="${quiz.program}", userProgram="${userProgram}", matches=${matchesProgram}`)
      }
    } else if (userRole === "admin" && selectedProgramFilter !== "all") {
      // For admins, apply the selected program filter
      matchesProgram = quiz.program === selectedProgramFilter
    }

    // Quiz View filter - show only Public quizzes in simple view (learning section)
    // In tools section, show Personal quizzes (created by user) or all if admin
    const matchesView = simpleView 
      ? (quiz.quiz_view === 'Public')  // Learning section: only public
      : (userRole === 'admin' || userRole === 'faculty' || Number(quiz.created_by) === Number(user_id))  // Tools: own quizzes or admin/faculty sees all

    // Debug logging for view filter
    if (simpleView) {
      console.log(`🔍 Filter Check - "${quiz.title}": quiz_view="${quiz.quiz_view}", matchesView=${matchesView}, simpleView=${simpleView}`)
    }

    return matchesSearch && matchesSubject && matchesDifficulty && matchesProgram && matchesView
  })

  // Sort quizzes: Recommended (4.5+ rating) first, then by rating, then by date
  const sortedAndFilteredQuizList = filteredQuizList.sort((a: any, b: any) => {
    const ratingA = quizRatings[a.id]?.average_rating || 0
    const ratingB = quizRatings[b.id]?.average_rating || 0
    
    const isRecommendedA = ratingA >= 4.5
    const isRecommendedB = ratingB >= 4.5
    
    // Recommended items first
    if (isRecommendedA && !isRecommendedB) return -1
    if (!isRecommendedA && isRecommendedB) return 1
    
    // Within same category (both recommended or both not), sort by rating
    if (ratingB !== ratingA) return ratingB - ratingA
    
    // If ratings are equal, sort by date (newest first)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
    return dateB - dateA
  })

  // Removed quizGroupedSets logic

  // Form states for quiz creation
  const [quizTitle, setQuizTitle] = useState("")
  const [quizSubject, setQuizSubject] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [quizDuration, setQuizDuration] = useState("")
  const [quizDurationUnit, setQuizDurationUnit] = useState("minutes") // Add duration unit state
  const [quizDifficulty, setQuizDifficulty] = useState("")
  const [quizView, setQuizView] = useState("Personal") // Quiz view: Personal or Public
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])

  // Form states for question creation
  const [questionType, setQuestionType] = useState<QuestionType>("multiple-choice")
  const [questionText, setQuestionText] = useState("")
  const [questionOptions, setQuestionOptions] = useState(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [questionExplanation, setQuestionExplanation] = useState("")
  const [questionPoints, setQuestionPoints] = useState(5)

  // Get user role from context, default to 'student' if not available
  // Removed duplicate declaration of userRole
  // user_id already declared above before quizList mapping

  // Permission helper functions
  const canManageQuiz = (quiz: any) => {
    // Only allow the creator to manage their quiz, or admins to manage any quiz
    return Number(quiz.created_by) === Number(user_id) || userRole === 'admin'
  }

  const checkQuizPermissionAndManage = (quiz: any) => {
    if (canManageQuiz(quiz)) {
      handleManageQuiz(quiz)
    } else {
      toast({
        title: "Access Denied",
        description: "You can only edit quizzes that you created.",
        variant: "destructive",
      })
    }
  }

  const checkQuizPermissionAndDelete = (quiz: any) => {
    if (canManageQuiz(quiz)) {
      handleDeleteQuiz(quiz)
    } else {
      toast({
        title: "Access Denied",
        description: "You can only delete quizzes that you created.",
        variant: "destructive",
      })
    }
  }

  const getCreatorIndicator = (quiz: any) => {
    if (Number(quiz.created_by) === Number(user_id)) return "You"
    return quiz.creator_name || "Unknown"
  }

  // Timer effect for quiz duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (takingQuiz && quizStartTime && !isPreviewMode) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - quizStartTime.getTime()) / 1000)
        setElapsedTime(elapsed)
        
        // Check if time is up
        if (takingQuiz.duration && takingQuiz.duration_unit) {
          const durationInSeconds = getDurationInSeconds(parseInt(takingQuiz.duration), takingQuiz.duration_unit)
          if (elapsed >= durationInSeconds && !isTimeUp) {
            setIsTimeUp(true)
            setShowTimeUpDialog(true)
          }
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [takingQuiz, quizStartTime, isPreviewMode, isTimeUp])

  // Helper function to convert duration to seconds
  const getDurationInSeconds = (duration: number, unit: string) => {
    switch(unit) {
      case 'minutes': return duration * 60
      case 'hours': return duration * 60 * 60
      default: return duration * 60 // default to minutes
    }
  }

  // Helper function to calculate remaining time
  const getRemainingTime = () => {
    if (!takingQuiz || !takingQuiz.duration || !takingQuiz.duration_unit) return 0
    const totalSeconds = getDurationInSeconds(parseInt(takingQuiz.duration), takingQuiz.duration_unit)
    const remaining = totalSeconds - elapsedTime
    return Math.max(0, remaining)
  }

  // Helper function to format time
  const formatTime = (seconds: number, originalDurationSeconds?: number) => {
    // If original duration was 1 hour or more (3600+ seconds), always use hh:mm:ss format
    // This ensures consistency: a 60-minute quiz will show 01:00:00, then 00:59:59, etc.
    const useHourFormat = originalDurationSeconds ? originalDurationSeconds >= 3600 : seconds >= 3600
    
    if (useHourFormat) {
      // Show hh:mm:ss format
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      // Show mm:ss format
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  // Helper function to format duration for display
  const formatDuration = (minutes: number, preferredUnit?: string) => {
    if (preferredUnit === "hours" && minutes >= 60) {
      const hours = minutes / 60
      return hours % 1 === 0 ? `${hours} hr` : `${hours.toFixed(1)} hr`
    } else if (minutes >= 60 && !preferredUnit) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
    return `${minutes} min`
  }

  const startQuiz = (quiz: Quiz, isPreview: boolean = false) => {
    if (isPreview) {
      // For preview mode, start immediately
      startQuizDirectly(quiz, isPreview)
    } else {
      // For actual quiz, show confirmation dialog
      setQuizToStart(quiz)
      setShowStartConfirmation(true)
    }
  }

  const startQuizDirectly = async (quiz: Quiz, isPreview: boolean = false) => {
    try {
      // Load questions for the quiz
      console.log('Loading questions for quiz:', quiz)
      const response = await fetch(`http://localhost:4000/api/questions/quiz/${quiz.quiz_id || quiz.id}`)
      const data = await response.json()
      
      console.log('Questions API response:', data)
      
      if (!data.success || !data.questions || data.questions.length === 0) {
        toast({
          title: "Error",
          description: "This quiz has no questions available.",
          variant: "destructive",
        })
        return
      }

      console.log('Processing questions:', data.questions)

      // Transform the questions to match frontend expectations
      const transformedQuestions = data.questions.map((q: any) => ({
        id: q.question_id,
        question: q.question,
        type: q.question_type || q.type || 'multiple-choice',
        options: q.choices || q.options || [],
        correctAnswer: q.answer || q.correct_answer,
        points: q.points || 1,
        explanation: q.explanation
      }))

      console.log('Raw questions from database:', data.questions)
      console.log('Transformed questions:', transformedQuestions)

      // Set up quiz taking state
      setTakingQuiz({
        ...quiz,
        questions: transformedQuestions
      })
      setCurrentQuestionIndex(0)
      setSelectedAnswers({})
      setQuizStartTime(new Date())
      setIsPreviewMode(isPreview)
      
      console.log(isPreview ? "Previewing quiz:" : "Starting quiz:", quiz.title)
      console.log('Quiz with questions set:', { ...quiz, questions: transformedQuestions })
    } catch (error) {
      console.error('Error loading quiz questions:', error)
      toast({
        title: "Error",
        description: "Failed to load quiz questions.",
        variant: "destructive",
      })
    }
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const nextQuestion = () => {
    if (takingQuiz && currentQuestionIndex < takingQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const finishQuiz = async () => {
    if (!takingQuiz || !quizStartTime) return

    const endTime = new Date()
    const timeSpent = Math.round((endTime.getTime() - quizStartTime.getTime()) / 1000 / 60) // minutes

    if (isPreviewMode) {
      // For preview, just show results without saving
      toast({
        title: "Preview Complete",
        description: `You previewed ${takingQuiz.questions.length} questions in ${timeSpent} minutes.`,
      })
    } else {
      // For actual quiz, calculate score and save results
      let correctAnswers = 0
      let totalPointsEarned = 0
      let totalPointsPossible = 0
      const questionResults: {
        question: Question
        userAnswer: string
        isCorrect: boolean
        pointsEarned: number
        explanation?: string
      }[] = []

      takingQuiz.questions.forEach((question, index) => {
        const userAnswer = selectedAnswers[index] || ""
        const correctAnswer = question.correctAnswer
        const questionPoints = question.points || 1
        let isCorrect = false
        let pointsEarned = 0
        
        totalPointsPossible += questionPoints
        
        if (question.type === "enumeration") {
          // Enhanced enumeration scoring: case-insensitive, proportional partial credit
          // Example: If correct answers are "PHP, Java" (5 points) and user enters "php" - gets 2.5 points
          if (userAnswer && correctAnswer) {
            const userAnswersArray = userAnswer.split(',').map(a => a.trim().toLowerCase()).filter(a => a)
            const correctAnswersArray = correctAnswer.toString().split(',').map(a => a.trim().toLowerCase()).filter(a => a)
            
            console.log(`Question ${index + 1} - Enumeration Check:`, {
              userAnswers: userAnswersArray,
              correctAnswers: correctAnswersArray,
              totalPoints: questionPoints
            })
            
            if (userAnswersArray.length > 0) {
              // Check how many of the user's answers are correct
              const correctAnswersSet = new Set(correctAnswersArray)
              const correctUserAnswers = userAnswersArray.filter(answer => correctAnswersSet.has(answer))
              const incorrectUserAnswers = userAnswersArray.filter(answer => !correctAnswersSet.has(answer))
              
              if (incorrectUserAnswers.length === 0 && correctUserAnswers.length > 0) {
                // All user answers are correct, calculate partial credit based on completeness
                const completionRatio = Math.min(correctUserAnswers.length / correctAnswersArray.length, 1)
                pointsEarned = questionPoints * completionRatio
                
                if (correctUserAnswers.length === correctAnswersArray.length) {
                  // Full credit - all answers provided and correct
                  isCorrect = true
                  correctAnswers++
                  console.log(`Question ${index + 1}: Full credit - ${pointsEarned}/${questionPoints} points`)
                } else {
                  // Partial credit - some correct answers provided
                  console.log(`Question ${index + 1}: Partial credit - ${pointsEarned}/${questionPoints} points (${correctUserAnswers.length}/${correctAnswersArray.length} answers)`)
                  // Consider it correct if they got more than 50% of the points
                  if (completionRatio >= 0.5) {
                    isCorrect = true
                    correctAnswers++
                  }
                }
              } else {
                console.log(`Question ${index + 1}: No credit - has incorrect answers or no correct answers`)
                pointsEarned = 0
              }
            }
          }
        } else {
          // For other question types, direct comparison
          if (userAnswer === correctAnswer) {
            isCorrect = true
            correctAnswers++
            pointsEarned = questionPoints
          }
        }

        totalPointsEarned += pointsEarned

        questionResults.push({
          question,
          userAnswer,
          isCorrect,
          pointsEarned,
          explanation: question.explanation
        })
      })

      // Calculate percentage score based on points, not just question count
      const score = Math.round((totalPointsEarned / totalPointsPossible) * 100)
      
      // Prepare quiz results for the modal
      setQuizResults({
        quiz: takingQuiz,
        score,
        correctAnswers,
        totalQuestions: takingQuiz.questions.length,
        timeSpent,
        totalPointsEarned,
        totalPointsPossible,
        questionResults
      })
      
      // Save quiz attempt to database
      try {
        const attemptData = {
          quiz_id: takingQuiz.quiz_id || takingQuiz.id,
          user_id: currentUser?.user_id,
          name: `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim(),
          score: score,
          answers: selectedAnswers // Include the selected answers
        }

        console.log('Sending quiz attempt data:', attemptData)
        console.log('Quiz Results Summary:', {
          totalPointsEarned,
          totalPointsPossible,
          percentage: score,
          correctQuestions: correctAnswers,
          totalQuestions: takingQuiz.questions.length
        })

        const response = await fetch('http://localhost:4000/api/quiz-attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attemptData)
        })

        const result = await response.json()

        if (result.success) {
          // Refresh user attempts to update UI immediately
          if (currentUser) {
            const attemptsResponse = await fetch(`http://localhost:4000/api/quiz-attempts/user/${currentUser.user_id}`)
            if (attemptsResponse.ok) {
              const attemptsData = await attemptsResponse.json()
              if (attemptsData.success && attemptsData.attempts) {
                const attemptsByQuiz = attemptsData.attempts.reduce((acc: {[key: number]: any[]}, attempt: any) => {
                  // Convert quiz_id to number to match frontend expectations
                  const quizId = parseInt(attempt.quizzes_id || attempt.quiz_id)
                  if (!acc[quizId]) acc[quizId] = []
                  acc[quizId].push(attempt)
                  return acc
                }, {})
                setUserAttempts(attemptsByQuiz)
              }
            }
          }
          
          // Show results modal instead of toast
          setShowResultsDialog(true)
        } else {
          throw new Error(result.error || 'Failed to save quiz attempt')
        }
      } catch (error) {
        console.error('Error saving quiz attempt:', error)
        // Still show results even if saving failed
        setShowResultsDialog(true)
        toast({
          title: "Warning",
          description: "Quiz completed but failed to save results to server.",
          variant: "destructive"
        })
      }
    }
  }

  const exitQuiz = () => {
    setTakingQuiz(null)
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setQuizStartTime(null)
    setIsPreviewMode(false)
    setElapsedTime(0)
    setIsTimeUp(false)
    setShowTimeUpDialog(false)
  }

  const closeResultsDialog = () => {
    setShowResultsDialog(false)
    const completedQuizData = quizResults?.quiz
    setQuizResults(null)
    exitQuiz() // Reset all quiz states
    
    // Show rating prompt if user hasn't rated this quiz yet
    if (completedQuizData && currentUser?.user_id && !isPreviewMode) {
      const quizId = completedQuizData.quiz_id || completedQuizData.id
      // Only show rating prompt if user hasn't rated yet
      if (!userRatings[quizId]) {
        setQuizToRate({ id: quizId, title: completedQuizData.title })
        setShowRatingPrompt(true)
      }
    }
  }

  const handleCreateQuiz = async () => {
    if (!quizTitle.trim()) {
      toast({ title: "Error", description: "Quiz title is required.", variant: "destructive" });
      return;
    }
    if (!quizSubject.trim()) {
      toast({ title: "Error", description: "Quiz subject is required.", variant: "destructive" });
      return;
    }
    if (!quizDescription.trim()) {
      toast({ title: "Error", description: "Quiz description is required.", variant: "destructive" });
      return;
    }
    if (!quizDuration || isNaN(Number(quizDuration)) || Number(quizDuration) <= 0) {
      toast({ title: "Error", description: "Quiz duration is required and must be a positive number.", variant: "destructive" });
      return;
    }
    if (!quizDurationUnit.trim()) {
      toast({ title: "Error", description: "Quiz duration unit is required.", variant: "destructive" });
      return;
    }
    if (!quizDifficulty.trim()) {
      toast({ title: "Error", description: "Quiz difficulty is required.", variant: "destructive" });
      return;
    }
    if (quizQuestions.length === 0) {
      toast({ title: "Error", description: "Please add at least one question.", variant: "destructive" });
      return;
    }

    try {
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === quizSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      // Convert duration to minutes if needed
      let durationInMinutes = parseInt(quizDuration) || 15
      if (quizDurationUnit === "hours") {
        durationInMinutes = durationInMinutes * 60 // Convert hours to minutes
      }

      console.log('=== FRONTEND DEBUG ===');
      console.log('Quiz Duration Input:', quizDuration);
      console.log('Quiz Duration Unit:', quizDurationUnit);
      console.log('Duration in Minutes:', durationInMinutes);
      console.log('Quiz Program State:', quizProgram);
      console.log('User Program:', userProgram);
      console.log('User Role:', userRole);
      console.log('Current User:', currentUser);
      console.log('=====================');

      // Create quiz in database
      const quizData = {
        title: quizTitle,
        subject_id: subject.subject_id,
        subject_name: subject.subject_name, // Send subject_name directly from dropdown
        description: quizDescription,
        created_by: currentUser?.user_id || 1, // TODO: Get actual user ID
        quiz_type: "practice",
        duration: durationInMinutes, // Always store in minutes
        duration_unit: quizDurationUnit, // Store the original unit for reference
        difficulty: quizDifficulty,
        item_counts: quizQuestions.length,
        program: quizProgram, // Add program field
        quiz_view: quizView // Add quiz view field (Personal or Public)
      }

      console.log('=== QUIZ DATA BEING SENT ===');
      console.log(JSON.stringify(quizData, null, 2));
      console.log('Subject Name being sent:', subject.subject_name);
      console.log('===========================');

      const url = currentQuiz 
        ? `http://localhost:4000/api/quizzes/${currentQuiz.id || currentQuiz.quiz_id}` 
        : 'http://localhost:4000/api/quizzes'
      
      const response = await fetch(url, {
        method: currentQuiz ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData)
      })

      const result = await response.json()

      if (result.success) {
        const createdQuizId = currentQuiz ? (currentQuiz.id || currentQuiz.quiz_id) : result.quiz.quizzes_id
        
        // Save all questions to the database
        if (quizQuestions.length > 0) {
          console.log(`Saving ${quizQuestions.length} questions for quiz ID:`, createdQuizId)
          
          // If updating an existing quiz, delete old questions first
          if (currentQuiz) {
            try {
              await fetch(`http://localhost:4000/api/questions/quiz/${createdQuizId}`, {
                method: 'DELETE'
              })
              console.log('Deleted old questions for quiz:', createdQuizId)
            } catch (deleteError) {
              console.error('Error deleting old questions:', deleteError)
            }
          }

          // Add all questions
          for (const [index, question] of quizQuestions.entries()) {
            try {
              const questionData = {
                quizzes_id: createdQuizId,
                question: question.question,
                choices: question.options || [],
                answer: question.correctAnswer,
                explanation: question.explanation || null,
                points: question.points || 1,
                question_type: question.question_type || question.type
              }
              console.log(`Saving question ${index + 1}:`, questionData)
              const questionResponse = await fetch('http://localhost:4000/api/questions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(questionData)
              })
              const questionResult = await questionResponse.json()
              console.log(`Question ${index + 1} save result:`, questionResult)
              if (!questionResult.success) {
                console.error('Failed to save question:', questionResult.error)
              }
            } catch (questionError) {
              console.error('Error saving question:', questionError)
            }
          }
          console.log('Finished saving all questions')
        }

        // Update the quiz with the correct item count
        if (!currentQuiz) {
          try {
            await fetch(`http://localhost:4000/api/quizzes/${createdQuizId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...quizData,
                item_counts: quizQuestions.length
              })
            })
          } catch (updateError) {
            console.error('Error updating quiz item count:', updateError)
          }
        }
        
        // Refresh quizzes list
        await refetchQuizzes()
        
        // Reset form
        setQuizTitle("")
        setQuizSubject("")
        setQuizDescription("")
        setQuizDuration("")
        setQuizDurationUnit("minutes")
        setQuizDifficulty("")
        setQuizView("Personal")
        setQuizQuestions([])
        setCurrentQuiz(null)
        setShowCreateDialog(false)
        
        toast({
          title: currentQuiz ? "Success" : "Submitted for Review",
          description: currentQuiz
            ? "Quiz updated successfully"
            : "Your study material has been submitted and is currently under review by the faculty. It will be published once approved.",
          duration: currentQuiz ? 3000 : 5000,
        })
      } else {
        throw new Error(result.error || 'Failed to save quiz')
      }
    } catch (error) {
      console.error('Error saving quiz:', error)
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive"
      })
      return
    }

    // Reset form (moved after success toast)
    // (this was moved above in the success block)
  }

  const handleAddQuestion = () => {
    if (!questionText) {
      toast({
        title: "Error",
        description: "Please enter a question.",
        variant: "destructive",
      })
      return
    }

    if (questionType === "multiple-choice" && questionOptions.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all answer options.",
        variant: "destructive",
      })
      return
    }

    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type: questionType,
      question: questionText,
      options: questionType === "multiple-choice" ? questionOptions.filter(opt => opt.trim())
        : questionType === "true-false" ? ["True", "False"]
        : undefined,
      correctAnswer: correctAnswer,
      explanation: questionExplanation,
      points: questionPoints,
      question_type: questionType // For backend
    }

    if (editingQuestion) {
      // Update existing question
      setQuizQuestions(prev => prev.map(q => q.id === editingQuestion.id ? newQuestion : q))
      setEditingQuestion(null)
    } else {
      // Add new question
      setQuizQuestions(prev => [...prev, newQuestion])
    }

    // Reset question form
    setQuestionText("")
    setQuestionOptions(["", "", "", ""])
    setCorrectAnswer("")
    setQuestionExplanation("")
    setQuestionPoints(5)
    setShowQuestionDialog(false)

    toast({
      title: editingQuestion ? "Question Updated" : "Question Added",
      description: editingQuestion ? "Question has been updated." : "New question has been added to the quiz.",
    })
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setQuestionType(question.type)
    setQuestionText(question.question)
    setQuestionOptions(question.options || ["", "", "", ""])
    setCorrectAnswer(Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer)
    setQuestionExplanation(question.explanation || "")
    setQuestionPoints(question.points)
    setShowQuestionDialog(true)
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== questionId))
    toast({
      title: "Question Deleted",
      description: "Question has been removed from the quiz.",
    })
  }

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (confirm(`Are you sure you want to delete the quiz "${quiz.title}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`http://localhost:4000/api/quizzes/${quiz.id || quiz.quiz_id}`, {
          method: 'DELETE'
        })
        
        const result = await response.json()
        
        if (result.success) {
          toast({
            title: "Success",
            description: "Quiz deleted successfully",
          })
          refetchQuizzes() // Refresh the quiz list
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete quiz",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error deleting quiz:', error)
        toast({
          title: "Error",
          description: "Failed to delete quiz",
            variant: "destructive",
        })
      }
    }
  }

  const handleManageQuiz = async (quiz: Quiz) => {
    setCurrentQuiz(quiz)
    setQuizTitle(quiz.title)
    setQuizSubject(quiz.subject)
    setQuizDescription(quiz.description)
    
    // Handle duration and duration unit
    const durationStr = quiz.duration.toString()
    const durationNum = parseInt(durationStr) || 0
    
    // Check if quiz has duration_unit from database, otherwise infer from duration
    if (quiz.duration_unit) {
      setQuizDuration(durationNum.toString())
      setQuizDurationUnit(quiz.duration_unit)
    } else {
      // For existing quizzes without duration_unit, assume minutes but check if it makes sense to display as hours
      if (durationNum >= 120 && durationNum % 60 === 0) {
        // If duration is 2+ hours and divisible by 60, display as hours
        setQuizDuration((durationNum / 60).toString())
        setQuizDurationUnit("hours")
      } else {
        // Otherwise display as minutes
        setQuizDuration(durationNum.toString())
        setQuizDurationUnit("minutes")
      }
    }
    
    setQuizDifficulty(quiz.difficulty)
    setQuizView((quiz as any).quiz_view || "Personal") // Set quiz view from database or default to Personal
    
    // Load questions from database for existing quiz
    try {
      const quizId = quiz.id || quiz.quiz_id
      const response = await fetch(`http://localhost:4000/api/questions/quiz/${quizId}`)
      const data = await response.json()
      
      if (data.success && data.questions) {
        // Convert database questions to frontend format
        const convertedQuestions = data.questions.map((dbQuestion: any) => ({
          id: `db-${dbQuestion.question_id}`,
          type: dbQuestion.question_type || 'multiple-choice',
          question: dbQuestion.question || dbQuestion.question_text || '',
          options: dbQuestion.choices || [],
          correctAnswer: dbQuestion.answer || '',
          explanation: dbQuestion.explanation || '',
          points: dbQuestion.points || 1
        }))
        setQuizQuestions(convertedQuestions)
      } else {
        setQuizQuestions([])
      }
    } catch (error) {
      console.error('Error loading quiz questions:', error)
      setQuizQuestions([])
    }
    
    setShowCreateDialog(true)
  }

  const QuizSetCard = ({ set }: { set: any }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{set.title}</CardTitle>
            <CardDescription className="text-base mt-1">{set.subject}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{set.quizCount} quizzes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <span>{set.difficulty}</span>
          </div>
        </div>

        {/* Individual Quiz Items in Set */}
        <div className="space-y-2">
          {set.quizzes.map((quiz: Quiz) => (
            <div key={quiz.id} className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{quiz.title}</h4>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                    <span>{quiz.questionCount || 0} questions</span>
                    <span>{formatDuration(parseInt(quiz.duration) || 0, quiz.duration_unit)}</span>
                    <span>{quiz.difficulty}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Created by: {getCreatorIndicator(quiz)}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => startQuiz(quiz, false)}
                    disabled={(quiz.questionCount || 0) === 0}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  {!simpleView && (
                    <>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => checkQuizPermissionAndManage(quiz)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => checkQuizPermissionAndDelete(quiz)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {(quiz.questionCount || 0) === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-1 rounded mt-2">
                  No questions added yet
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const QuizCard = ({ quiz }: { quiz: Quiz }) => {
    // Debug logging to check quiz data
    if (quiz.is_pending) {
      console.log('DEBUG - Rendering pending quiz:', {
        title: quiz.title,
        is_pending: quiz.is_pending,
        status: quiz.status
      })
    }
    
    // Check if quiz was created within the last 24 hours
    const isNew = quiz.created_at ? 
      (new Date().getTime() - new Date(quiz.created_at).getTime()) < (24 * 60 * 60 * 1000) : 
      false;
    
    // Check if quiz is highly rated (4.5+)
    const isRecommended = (quizRatings[quiz.id]?.average_rating || 0) >= 4.5;
    
    return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader>
        {/* Recommended Banner for highly-rated quizzes (4.5+) */}
        {isRecommended && !quiz.is_pending && (
          <div className="-mx-6 -mt-6 mb-4 px-4 py-2 text-sm font-medium rounded-t-lg bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-900 border-b border-amber-200 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-amber-300">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>⭐ Recommended - Highly Rated ({quizRatings[quiz.id]?.average_rating.toFixed(1)} stars)</span>
            </div>
          </div>
        )}
        
        {/* Status Banner for Pending/Approved/Rejected - Above Title */}
        {quiz.is_pending && (
          <div className={`-mx-6 -mt-6 mb-4 px-4 py-2 text-sm font-medium rounded-t-lg ${
            quiz.status === 'pending' 
              ? 'bg-amber-100 text-amber-800 border-b border-amber-200 dark:bg-amber-900/30 dark:text-amber-300' 
              : quiz.status === 'approved'
              ? 'bg-green-100 text-green-800 border-b border-green-200 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 border-b border-red-200 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {quiz.status === 'pending' && <Clock className="w-4 h-4" />}
              {quiz.status === 'approved' && <CheckCircle className="w-4 h-4" />}
              {quiz.status === 'rejected' && <XCircle className="w-4 h-4" />}
              <span>
                {quiz.status === 'pending' && '⏳ Pending Approval'}
                {quiz.status === 'approved' && '✅ Approved - Will be available soon'}
                {quiz.status === 'rejected' && '❌ Rejected'}
              </span>
              {/* Show clickable link for rejection comment */}
              {quiz.status === 'rejected' && quiz.comment && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-red-900 dark:text-red-200 underline h-auto p-0 ml-2 font-semibold hover:text-red-700"
                  onClick={() => {
                    setSelectedRejectionComment({ title: quiz.title, comment: quiz.comment || '' })
                    setShowRejectionDialog(true)
                  }}
                >
                  - View Reason
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              {isNew && !quiz.is_pending && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  ✨ New
                </Badge>
              )}
            </div>
            <CardDescription className="text-base mt-1">{quiz.subject}</CardDescription>
          </div>
          <Badge variant={quiz.difficulty === "Beginner" ? "secondary" : quiz.difficulty === "Intermediate" ? "default" : "destructive"}>
            {quiz.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{quiz.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{quiz.questionCount || 0} questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatDuration(parseInt(quiz.duration) || 0)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span>Your Highest Score: {quiz.bestScore ? `${quiz.bestScore}%` : "Not attempted"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{quizStatistics[quiz.id]?.unique_users || 0} {(quizStatistics[quiz.id]?.unique_users || 0) === 1 ? 'user' : 'users'} took this</span>
          </div>
        </div>

        {/* Quiz Rating */}
        <div className="border-t pt-3">
          <StarRating
            rating={quizRatings[quiz.id]?.average_rating || 0}
            totalRatings={quizRatings[quiz.id]?.total_ratings || 0}
            userRating={userRatings[quiz.id] || null}
            userComment={userComments[quiz.id] || null}
            onRate={(rating, comment) => handleRateQuiz(quiz.id, rating, comment)}
            readonly={!currentUser?.user_id || quiz.is_pending}
            size="md"
            showCount={true}
          />
        </div>

        {/* Creator indicator */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground border-t pt-2">
          <User className="w-3 h-3" />
          <span>Created by: {getCreatorIndicator(quiz)}</span>
        </div>

        {quiz.lastAttempt && (
          <div className="text-xs text-muted-foreground">
            Last attempt: {new Date(quiz.lastAttempt).toLocaleDateString()}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          {!simpleView && (
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={() => checkQuizPermissionAndManage(quiz)}
              disabled={quiz.is_pending}
            >
              <Edit className="w-4 h-4 mr-2" />
              Manage Quiz
            </Button>
          )}
          <Button 
            className={simpleView ? "flex-1" : ""}
            size="sm"
            onClick={() => startQuiz(quiz, false)}
            disabled={(quiz.questionCount || 0) === 0 || quiz.is_pending}
          >
            <Play className="w-4 h-4 mr-2" />
            {quiz.is_pending ? "Pending" : quiz.completedTimes > 0 ? "Retake" : "Start"}
          </Button>
          {!simpleView && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => checkQuizPermissionAndDelete(quiz)}
              disabled={quiz.is_pending && quiz.status === 'pending'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {(quiz.questionCount || 0) === 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            No questions added yet. Click 'Manage Quiz' to add questions.
          </div>
        )}
      </CardContent>
    </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with interactive quizzes</p>
        </div>
        {!simpleView && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{currentQuiz ? "Manage Quiz" : "Create New Quiz"}</DialogTitle>
                <DialogDescription>
                  {currentQuiz ? "Edit quiz details and manage questions" : "Create a new quiz and add questions for students to practice with"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quiz Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quiz Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Enter quiz title"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                      />
                    </div>
                      <div className="space-y-2">
                        <Label htmlFor="program">Program</Label>
                        {userRole === "admin" ? (
                          <select
                            id="program"
                            value={quizProgram}
                            onChange={e => setQuizProgram(e.target.value)}
                            className="w-full border rounded p-2 bg-white dark:bg-gray-900"
                          >
                            <option value="">Select Program</option>
                            {programOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            id="program"
                            value={selectedProgramFilter !== "all" ? selectedProgramFilter : userProgram}
                            disabled
                            className="w-full border rounded p-2 bg-white dark:bg-gray-900"
                          />
                        )}
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Popover open={createQuizSubjectComboboxOpen} onOpenChange={setCreateQuizSubjectComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={createQuizSubjectComboboxOpen}
                            className="w-full justify-between"
                          >
                            {quizSubject ? (
                              (() => {
                                const subject = subjects.find(s => s.subject_name === quizSubject);
                                return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : quizSubject;
                              })()
                            ) : (
                              "Select subject"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search subjects..." 
                              value={createQuizSubjectSearchValue}
                              onValueChange={setCreateQuizSubjectSearchValue}
                            />
                            <CommandList>
                              {subjects
                                .filter((subject) => {
                                  const searchTerm = createQuizSubjectSearchValue.toLowerCase();
                                  return (
                                    subject.subject_name.toLowerCase().includes(searchTerm) ||
                                    (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm))
                                  );
                                })
                                .map((subject) => (
                                  <CommandItem
                                    key={subject.subject_id}
                                    value={`${subject.subject_code || ''} ${subject.subject_name}`.trim()}
                                    onSelect={() => {
                                      setQuizSubject(subject.subject_name)
                                      setCreateQuizSubjectComboboxOpen(false)
                                      setCreateQuizSubjectSearchValue("")
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        quizSubject === subject.subject_name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                                  </CommandItem>
                                ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Enter description"
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="duration" 
                            type="number"
                            placeholder="15"
                            value={quizDuration}
                            onChange={(e) => setQuizDuration(e.target.value)}
                            className="flex-1"
                          />
                          <Select value={quizDurationUnit} onValueChange={setQuizDurationUnit}>
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Min</SelectItem>
                              <SelectItem value="hours">Hr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quizView">Quiz View</Label>
                      <Select value={quizView} onValueChange={setQuizView}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quiz view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personal">Personal</SelectItem>
                          <SelectItem value="Public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Questions ({quizQuestions.length})</h3>
                    <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Question Type</Label>
                              <Select value={questionType} onValueChange={(value: QuestionType) => setQuestionType(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true-false">True/False</SelectItem>
                                  <SelectItem value="enumeration">Enumeration</SelectItem>
                                  <SelectItem value="essay">Essay</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Points</Label>
                              <Input 
                                type="number" 
                                value={questionPoints}
                                onChange={(e) => setQuestionPoints(Number(e.target.value))}
                                min="1"
                                max="100"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Textarea 
                              placeholder="Enter your question here..."
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              rows={3}
                            />
                          </div>

                          {questionType === "multiple-choice" && (
                            <div className="space-y-4">
                              <Label>Answer Options</Label>
                              {questionOptions.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Input 
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...questionOptions]
                                      newOptions[index] = e.target.value
                                      setQuestionOptions(newOptions)
                                    }}
                                  />
                                  <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value={option} id={`option-${index}`} />
                                      <Label htmlFor={`option-${index}`} className="text-sm">Correct</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              ))}
                            </div>
                          )}

                          {questionType === "true-false" && (
                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="True" id="true" />
                                  <Label htmlFor="true">True</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="False" id="false" />
                                  <Label htmlFor="false">False</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}

                          {questionType === "enumeration" && (
                            <div className="space-y-2">
                              <Label>Enumeration Answers (comma separated)</Label>
                              <Input
                                placeholder="Enter all correct answers, separated by commas"
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                              />
                            </div>
                          )}
                          {questionType === "essay" && (
                            <div className="space-y-2">
                              <Label>Sample Answer/Keywords</Label>
                              <Textarea 
                                placeholder="Enter sample answer or keywords for grading reference..."
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                rows={2}
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Explanation (Optional)</Label>
                            <Textarea 
                              placeholder="Explain why this is the correct answer..."
                              value={questionExplanation}
                              onChange={(e) => setQuestionExplanation(e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => {
                              setShowQuestionDialog(false)
                              setEditingQuestion(null)
                              setQuestionText("")
                              setQuestionOptions(["", "", "", ""])
                              setCorrectAnswer("")
                              setQuestionExplanation("")
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddQuestion}>
                              {editingQuestion ? "Update Question" : "Add Question"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {quizQuestions.map((question, index) => (
                      <Card key={question.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {question.type.replace("-", " ")}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {question.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{index + 1}. {question.question}</p>
                            {question.options && (
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className={`text-xs p-1 rounded ${option === question.correctAnswer ? 'bg-green-100 text-green-800' : 'text-muted-foreground'}`}>
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(question)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(question.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {quizQuestions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No questions added yet</p>
                        <p className="text-xs">Click "Add Question" to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setCurrentQuiz(null)
                  setQuizTitle("")
                  setQuizSubject("")
                  setQuizDescription("")
                  setQuizDuration("")
                  setQuizDurationUnit("minutes")
                  setQuizDifficulty("")
                  setQuizView("Personal")
                  setQuizQuestions([])
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuiz}>
                  {currentQuiz ? "Update Quiz" : "Create Quiz"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search quizzes by title or subject..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* View Mode Toggle */}
        
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(selectedSubjectFilter !== "all" || selectedDifficultyFilter !== "all") && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {[selectedSubjectFilter, selectedDifficultyFilter].filter(f => f !== "all").length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Quizzes</DialogTitle>
              <DialogDescription>
                Filter quizzes by subject and difficulty
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Program Filter - Only show for admins */}
              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={selectedProgramFilter} onValueChange={setSelectedProgramFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programOptions.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Subject</Label>
                <Popover open={subjectFilterComboboxOpen} onOpenChange={setSubjectFilterComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectFilterComboboxOpen}
                      className="w-full justify-between"
                    >
                      {selectedSubjectFilter === "all" ? (
                        "All Subjects"
                      ) : (
                        (() => {
                          const subject = subjects.find(s => s.subject_name === selectedSubjectFilter);
                          return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : selectedSubjectFilter;
                        })()
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search subjects..." 
                        value={subjectFilterSearchValue}
                        onValueChange={setSubjectFilterSearchValue}
                      />
                      <CommandList>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedSubjectFilter("all")
                            setSubjectFilterComboboxOpen(false)
                            setSubjectFilterSearchValue("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSubjectFilter === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Subjects
                        </CommandItem>
                        {subjects
                          .filter((subject) => {
                            const searchTerm = subjectFilterSearchValue.toLowerCase();
                            return (
                              subject.subject_name.toLowerCase().includes(searchTerm) ||
                              (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm))
                            );
                          })
                          .map((subject) => (
                            <CommandItem
                              key={subject.subject_id}
                              value={`${subject.subject_code || ''} ${subject.subject_name}`.trim()}
                              onSelect={() => {
                                setSelectedSubjectFilter(subject.subject_name)
                                setSubjectFilterComboboxOpen(false)
                                setSubjectFilterSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSubjectFilter === subject.subject_name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                            </CommandItem>
                          ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={selectedDifficultyFilter} onValueChange={setSelectedDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedSubjectFilter("all")
                    setSelectedDifficultyFilter("all")
                    setSelectedProgramFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Always use Grid View - quizzes rendered individually, 3 per row on large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAndFilteredQuizList.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      {/* List View (removed viewMode check, always show list) */}

      {/* Show different messages based on filter state */}
      {sortedAndFilteredQuizList.length === 0 && !quizzesLoading && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          {quizList.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No quizzes available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {simpleView ? "Check back later for quizzes" : "Create your first quiz to start testing knowledge"}
              </p>
              {!simpleView && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Quiz
                </Button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No quizzes match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find quizzes
              </p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" onClick={() => {
                  setSearchQuery("")
                  setSelectedSubjectFilter("all")
                  setSelectedDifficultyFilter("all")
                }}>
                  Clear All Filters
                </Button>
                {!simpleView && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Quiz
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz Taking Interface - Dialog Popup */}
      <Dialog open={!!takingQuiz} onOpenChange={() => exitQuiz()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">
                  {takingQuiz?.title}
                </DialogTitle>
                <DialogDescription>
                  {isPreviewMode 
                    ? `Preview Mode • Question ${currentQuestionIndex + 1} of ${takingQuiz?.questions.length}`
                    : `Quiz Mode • Question ${currentQuestionIndex + 1} of ${takingQuiz?.questions.length}`
                  }
                </DialogDescription>
              </div>
              <div className="flex items-center space-x-4">
                {!isPreviewMode && takingQuiz && (
                  <div className={`bg-red-100 dark:bg-red-900 px-3 py-1 rounded-lg ${getRemainingTime() === 0 ? 'animate-pulse border-2 border-red-500' : ''}`}> 
                    <div className="text-xs text-red-600 dark:text-red-300 font-medium">
                      Time Remaining
                    </div>
                    <div className="text-lg font-bold text-red-800 dark:text-red-200">
                      {(() => {
                        const remainingTime = Math.max(0, getRemainingTime())
                        const originalDuration = takingQuiz && takingQuiz.duration && takingQuiz.duration_unit 
                          ? getDurationInSeconds(parseInt(takingQuiz.duration), takingQuiz.duration_unit) 
                          : 0
                        console.log('Timer Debug:', { remainingTime, originalDuration, duration: takingQuiz?.duration, unit: takingQuiz?.duration_unit })
                        return formatTime(remainingTime, originalDuration)
                      })()}
                    </div>
                    {getRemainingTime() === 0 && (
                      <div className="text-xs text-red-700 dark:text-red-300 font-semibold mt-1">Time is up!</div>
                    )}
                  </div>
                )}
                {takingQuiz && (
                  <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-lg">
                    <div className="text-xs text-green-600 dark:text-green-300 font-medium">
                      Duration Limit
                    </div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                      {formatDuration(parseInt(takingQuiz.duration) || 0, takingQuiz.duration_unit)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <Progress 
              value={takingQuiz ? ((currentQuestionIndex + 1) / takingQuiz.questions.length) * 100 : 0} 
              className="w-full"
            />
          </DialogHeader>

          {/* Quiz Content */}
          {takingQuiz && (
            <div className="space-y-4">
              {takingQuiz.questions && takingQuiz.questions[currentQuestionIndex] ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {currentQuestionIndex + 1}: {takingQuiz.questions[currentQuestionIndex].question}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Points: {takingQuiz.questions[currentQuestionIndex].points}</span>
                      <span>Type: {takingQuiz.questions[currentQuestionIndex].type}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {takingQuiz.questions[currentQuestionIndex].type === "multiple-choice" ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground mb-3">
                          {isPreviewMode ? "Answer Options:" : "Select your answer:"}
                        </div>
                        
                        {takingQuiz.questions[currentQuestionIndex].options?.map((option, optionIndex) => (
                          <div key={optionIndex} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                            isPreviewMode 
                              ? "bg-muted/30" 
                              : selectedAnswers[currentQuestionIndex] === option 
                                ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                                : "hover:bg-muted cursor-pointer"
                          }`}>
                            {isPreviewMode ? (
                              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium bg-white dark:bg-gray-800">
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                            ) : (
                              <input
                                type="radio"
                                id={`option-${optionIndex}`}
                                name={`question-${currentQuestionIndex}`}
                                value={option}
                                checked={selectedAnswers[currentQuestionIndex] === option}
                                onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value)}
                                className="w-4 h-4"
                              />
                            )}
                            <Label 
                              htmlFor={isPreviewMode ? undefined : `option-${optionIndex}`}
                              className={`flex-1 ${isPreviewMode ? "" : "cursor-pointer"}`}
                              onClick={isPreviewMode ? undefined : () => handleAnswerSelect(currentQuestionIndex, option)}
                            >
                              {option}
                            </Label>
                          </div>
                        ))}

                        {/* Show explanation in preview mode */}
                        {isPreviewMode && takingQuiz.questions[currentQuestionIndex].explanation && (
                          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                              Explanation:
                            </h4>
                            <p className="text-blue-800 dark:text-blue-200">
                              {takingQuiz.questions[currentQuestionIndex].explanation}
                            </p>
                          </div>
                        )}

                        {/* Show correct answer in preview mode */}
                        {isPreviewMode && (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="text-sm font-medium text-green-900 dark:text-green-100">
                              Correct Answer: {takingQuiz.questions[currentQuestionIndex].correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Unsupported question type.</div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions available for this quiz.</p>
                </div>
              )}

              {/* Navigation Buttons - Always show when quiz is loaded */}
              {takingQuiz && (
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={exitQuiz}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {isPreviewMode ? "Close Preview" : "Exit Quiz"}
                    </Button>
                    
                    {currentQuestionIndex === (takingQuiz?.questions?.length || 0) - 1 ? (
                      <Button onClick={finishQuiz}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isPreviewMode ? "Finish Preview" : "Submit Quiz"}
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Start Confirmation Dialog */}
      <AlertDialog open={showStartConfirmation} onOpenChange={setShowStartConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{(quizToStart?.completedTimes || 0) > 0 ? "Retake Quiz" : "Start Quiz"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you ready to {(quizToStart?.completedTimes || 0) > 0 ? "retake" : "start"} the quiz "{quizToStart?.title}"?
              <br /><br />
              <strong>Duration:</strong> {quizToStart?.duration} {quizToStart?.duration_unit}
              <br />
              <strong>Questions:</strong> {quizToStart?.questionCount || 'Unknown'} questions
              {(quizToStart?.completedTimes || 0) > 0 && (
                <>
                  <br />
                  <strong>Previous attempts:</strong> {quizToStart?.completedTimes || 0}
                  {quizToStart?.bestScore && (
                    <>
                      <br />
                      <strong>Your highest score:</strong> {quizToStart.bestScore}%
                    </>
                  )}
                </>
              )}
              <br /><br />
              Once you start, the timer will begin counting down. Make sure you have enough time to complete the quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowStartConfirmation(false)
              setQuizToStart(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (quizToStart) {
                startQuizDirectly(quizToStart, false)
              }
              setShowStartConfirmation(false)
              setQuizToStart(null)
            }}>
              {(quizToStart?.completedTimes || 0) > 0 ? "Retake Quiz" : "Start Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Up Dialog */}
      <AlertDialog open={showTimeUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
              The time limit for this quiz has been reached. Your answers will be automatically submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={finishQuiz}>
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quiz Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span>Quiz Results</span>
            </DialogTitle>
            <DialogDescription>
              {quizResults?.quiz?.title} - Detailed Results
            </DialogDescription>
          </DialogHeader>

          {quizResults && (
            <div className="space-y-6">
              {/* Overall Results Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Overall Performance</span>
                    <Badge 
                      variant={
                        quizResults.score >= 90 ? "default" : 
                        quizResults.score >= 80 ? "secondary" : 
                        quizResults.score >= 70 ? "outline" : 
                        "destructive"
                      }
                      className="text-lg px-4 py-2"
                    >
                      {quizResults.score}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-green-500" />
                      <span className="text-sm">
                        <strong>{quizResults.correctAnswers}</strong> out of <strong>{quizResults.totalQuestions}</strong> correct
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">
                        <strong>{quizResults.totalPointsEarned.toFixed(1)}</strong> out of <strong>{quizResults.totalPointsPossible}</strong> points
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">
                        Completed in <strong>{quizResults.timeSpent}</strong> minutes
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm">
                        Grade: <strong>
                          {quizResults.score >= 90 ? "Excellent" : 
                           quizResults.score >= 80 ? "Good" : 
                           quizResults.score >= 70 ? "Fair" : 
                           quizResults.score >= 60 ? "Needs Improvement" : 
                           "Poor"}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <Progress value={(quizResults.totalPointsEarned / quizResults.totalPointsPossible) * 100} className="w-full" />
                </CardContent>
              </Card>

              {/* Question by Question Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Question Review</h3>
                {quizResults.questionResults.map((result, index) => (
                  <Card key={index} className={`border-l-4 ${result.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-medium">
                          Question {index + 1}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          {result.isCorrect ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Correct
                            </Badge>
                          ) : result.pointsEarned > 0 ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <Target className="w-3 h-3 mr-1" />
                              Partial
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              <X className="w-3 h-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            <strong>{result.pointsEarned.toFixed(1)}</strong>/{result.question.points} 
                            {result.question.points === 1 ? ' point' : ' points'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium text-sm mb-2">Question:</p>
                        <p className="text-sm bg-muted p-3 rounded">{result.question.question}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-sm mb-1">Your Answer:</p>
                          <div className={`text-sm p-2 rounded ${result.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {result.userAnswer || <em className="text-muted-foreground">No answer provided</em>}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">Correct Answer:</p>
                          <div className="text-sm p-2 rounded bg-green-50 text-green-800">
                            {Array.isArray(result.question.correctAnswer) 
                              ? result.question.correctAnswer.join(', ')
                              : result.question.correctAnswer}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced display for enumeration questions */}
                      {result.question.type === "enumeration" && result.userAnswer && result.question.correctAnswer && (
                        <div>
                          <p className="font-medium text-sm mb-2">Answer Breakdown:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {(() => {
                              const userAnswersArray = result.userAnswer.split(',').map(a => a.trim()).filter(a => a)
                              const correctAnswersArray = result.question.correctAnswer.toString().split(',').map(a => a.trim()).filter(a => a)
                              const correctAnswersLower = correctAnswersArray.map(a => a.toLowerCase())
                              
                              return (
                                <>
                                  <div className="text-xs font-medium text-muted-foreground">Your Answers:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {userAnswersArray.map((userAns, idx) => {
                                      const isCorrect = correctAnswersLower.includes(userAns.toLowerCase())
                                      return (
                                        <span 
                                          key={idx}
                                          className={`px-2 py-1 rounded text-xs border ${
                                            isCorrect 
                                              ? 'border-green-300 bg-green-100 text-green-700'
                                              : 'border-red-300 bg-red-100 text-red-700'
                                          }`}
                                        >
                                          {userAns}
                                          {isCorrect ? (
                                            <Check className="w-3 h-3 inline ml-1" />
                                          ) : (
                                            <X className="w-3 h-3 inline ml-1" />
                                          )}
                                        </span>
                                      )
                                    })}
                                  </div>
                                  <div className="text-xs font-medium text-muted-foreground mt-2">Expected Answers:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {correctAnswersArray.map((correctAns, idx) => {
                                      const userProvided = userAnswersArray.some(ua => ua.toLowerCase() === correctAns.toLowerCase())
                                      return (
                                        <span 
                                          key={idx}
                                          className={`px-2 py-1 rounded text-xs border ${
                                            userProvided 
                                              ? 'border-green-300 bg-green-100 text-green-700'
                                              : 'border-gray-300 bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {correctAns}
                                          {userProvided ? (
                                            <Check className="w-3 h-3 inline ml-1" />
                                          ) : (
                                            <span className="w-3 h-3 inline ml-1 text-gray-400">○</span>
                                          )}
                                        </span>
                                      )
                                    })}
                                  </div>
                                  {/* Scoring breakdown for enumeration */}
                                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                    <div className="font-medium text-blue-800 mb-1">Scoring Breakdown:</div>
                                    <div className="text-blue-700">
                                      • Correct answers provided: <strong>{userAnswersArray.filter(ua => correctAnswersLower.includes(ua.toLowerCase())).length}</strong>
                                    </div>
                                    <div className="text-blue-700">
                                      • Total answers required: <strong>{correctAnswersArray.length}</strong>
                                    </div>
                                    <div className="text-blue-700">
                                      • Points earned: <strong>{result.pointsEarned.toFixed(1)}</strong> out of <strong>{result.question.points}</strong>
                                    </div>
                                    <div className="text-blue-700">
                                      • Completion rate: <strong>{Math.round((userAnswersArray.filter(ua => correctAnswersLower.includes(ua.toLowerCase())).length / correctAnswersArray.length) * 100)}%</strong>
                                    </div>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Show options for multiple choice questions */}
                      {result.question.type === "multiple-choice" && result.question.options && (
                        <div>
                          <p className="font-medium text-sm mb-2">Available Options:</p>
                          <div className="grid grid-cols-1 gap-1">
                            {result.question.options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`text-xs p-2 rounded border ${
                                  option === result.question.correctAnswer 
                                    ? 'border-green-300 bg-green-50 text-green-700'
                                    : option === result.userAnswer && !result.isCorrect
                                      ? 'border-red-300 bg-red-50 text-red-700'
                                      : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                {option}
                                {option === result.question.correctAnswer && (
                                  <Check className="w-3 h-3 inline ml-2 text-green-600" />
                                )}
                                {option === result.userAnswer && !result.isCorrect && (
                                  <X className="w-3 h-3 inline ml-2 text-red-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show explanation if available */}
                      {result.explanation && (
                        <div>
                          <p className="font-medium text-sm mb-1">Explanation:</p>
                          <div className="text-sm p-3 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            {result.explanation}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-6 border-t">
                <Button onClick={closeResultsDialog} className="px-8">
                  Close Results
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    closeResultsDialog()
                    startQuiz(quizResults.quiz!, false)
                  }}
                  className="px-8"
                >
                  Retake Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Comment Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>Rejection Reason</span>
            </DialogTitle>
            <DialogDescription>
              Your quiz "{selectedRejectionComment?.title}" was rejected for the following reason:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap">
                {selectedRejectionComment?.comment}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowRejectionDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Prompt Dialog */}
      <Dialog open={showRatingPrompt} onOpenChange={setShowRatingPrompt}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Rate This Quiz</span>
            </DialogTitle>
            <DialogDescription>
              How would you rate "{quizToRate?.title}"? Your feedback helps improve the learning experience.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {quizToRate && (
              <StarRating
                rating={0}
                totalRatings={quizRatings[quizToRate.id]?.total_ratings || 0}
                userRating={null}
                userComment={null}
                onRate={(rating, comment) => {
                  handleRateQuiz(quizToRate.id, rating, comment)
                  setShowRatingPrompt(false)
                  setQuizToRate(null)
                }}
                readonly={false}
                size="lg"
                showCount={false}
              />
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRatingPrompt(false)
                setQuizToRate(null)
              }}
            >
              Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
