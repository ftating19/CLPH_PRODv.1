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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Layers, Plus, RotateCcw, ChevronLeft, ChevronRight, BookOpen, Brain, Search, Filter, Star, Clock, Trash2, Edit, List, User, ChevronDown, CheckCircle, XCircle, Check, ChevronsUpDown, Trophy } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useFlashcards, useFlashcardsWithPending, useCreateFlashcard, useUpdateFlashcard, useDeleteFlashcard } from "@/hooks/use-flashcards"
import { useUpdateFlashcardProgress, useFlashcardProgress } from "@/hooks/use-flashcard-progress"
import { useSubjects } from "@/hooks/use-subjects"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { StarRating } from "@/components/ui/star-rating"

export default function Flashcards() {
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

  const [selectedSet, setSelectedSet] = useState<any | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [viewMode, setViewMode] = useState<"sets" | "list">("sets")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFlashcard, setEditingFlashcard] = useState<any | null>(null)
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false)
  const [editingFlashcardIndex, setEditingFlashcardIndex] = useState<number | null>(null)
  const [editingFlashcardSet, setEditingFlashcardSet] = useState<any | null>(null)
  
  // Rejection comment dialog states
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [selectedRejectionComment, setSelectedRejectionComment] = useState<{ subject: string, comment: string } | null>(null)

  // Rating prompt dialog
  const [showRatingPrompt, setShowRatingPrompt] = useState(false)
  const [setToRate, setSetToRate] = useState<{subId: number, subject: string} | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all")
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>("all")
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all")
  
  // Subject combobox state
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")

  // Create subject combobox state (for dialog)
  const [createSubjectComboboxOpen, setCreateSubjectComboboxOpen] = useState(false)
  const [createSubjectSearchValue, setCreateSubjectSearchValue] = useState("")

  // Set subject combobox state
  const [setSubjectComboboxOpen, setSetSubjectComboboxOpen] = useState(false)
  const [setSubjectSearchValue, setSetSubjectSearchValue] = useState("")

  const { currentUser } = useUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const simpleView = searchParams?.get("view") === "simple"

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const userProgram = currentUser?.program || ""
  const user_id = currentUser?.user_id
  
  // Program state for flashcard creation
  const [flashcardProgram, setFlashcardProgram] = useState(userRole === "admin" ? "" : userProgram)
  
  // Update flashcardProgram when currentUser loads or changes
  useEffect(() => {
    console.log('=== PROGRAM STATE INITIALIZATION DEBUG ===');
    console.log('currentUser:', currentUser);
    console.log('currentUser.program:', currentUser?.program);
    console.log('userRole:', userRole);
    console.log('userProgram:', userProgram);
    
    if (currentUser) {
      if (userRole === "admin") {
        console.log('Setting flashcardProgram to empty string (admin)');
        setFlashcardProgram("")
      } else {
        console.log('Setting flashcardProgram to:', currentUser.program || "");
        setFlashcardProgram(currentUser.program || "")
      }
    }
    console.log('=======================================');
  }, [currentUser, userRole])
  
  // Debug logging for user info and program state
  if (process.env.NODE_ENV === 'development') {
    console.log('Flashcards - Current User Info:', {
      role: userRole,
      program: userProgram,
      flashcardProgram: flashcardProgram,
      fullUser: currentUser
    })
  }

  // Flashcard set ratings state
  const [setRatings, setSetRatings] = useState<{[subId: number]: {average_rating: number, total_ratings: number}}>({})
  const [userSetRatings, setUserSetRatings] = useState<{[subId: number]: number}>({})
  const [userSetComments, setUserSetComments] = useState<{[subId: number]: string}>({})
  const [ratingsLoading, setRatingsLoading] = useState(true)

  // Permission helper functions
  // Permission logic for Students, Tutors, Faculty, Admin
  const canManageFlashcard = (flashcard: any) => {
    // Allow admin to manage any flashcard
    if (!currentUser) return false;
    if (userRole === 'admin') {
      return true;
    }
    // For student, tutor, faculty: only allow editing own sets
    return Number(flashcard.created_by) === Number(user_id);
  }

  const checkFlashcardPermissionAndEdit = (flashcard: any) => {
    if (canManageFlashcard(flashcard)) {
      openEditDialog(flashcard)
    } else {
      toast({
        title: "Access Denied",
        description: "You can only edit flashcards that you created.",
        variant: "destructive",
      })
    }
  }

  const checkFlashcardPermissionAndDelete = (flashcard: any) => {
    if (canManageFlashcard(flashcard)) {
      handleDeleteFlashcard(flashcard.flashcard_id)
    } else {
      toast({
        title: "Access Denied",
        description: "You can only delete flashcards that you created.",
        variant: "destructive",
      })
    }
  }

  const getCreatorIndicator = (flashcard: any) => {
  if (Number(flashcard.created_by) === Number(user_id)) return "You"
  if (flashcard.creator_name) return flashcard.creator_name
  if (flashcard.creator_role) return `${flashcard.creator_role}`
  if (flashcard.created_by) return `User #${flashcard.created_by}`
  return "Unknown"
  }

  // Form states for flashcard creation
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [flashcardView, setFlashcardView] = useState<"Personal" | "Public">("Personal")

  // Multiple flashcards state (for bulk creation)
  const [flashcardSetTitle, setFlashcardSetTitle] = useState("")
  const [flashcardSetSubject, setFlashcardSetSubject] = useState("")
  const [flashcardsList, setFlashcardsList] = useState<Array<{id: string, question: string, answer: string}>>([])
  const [currentFlashcard, setCurrentFlashcard] = useState<any | null>(null)

  // Database hooks
  // Use different hooks based on view mode
  // In tools (non-simple view), fetch including pending flashcards for the current user
  // In learning (simple view), use regular flashcards
  const { flashcards: regularFlashcards, loading: regularLoading, error: regularError, refetch: regularRefetch } = useFlashcards(user_id)
  const { flashcards: flashcardsWithPending, loading: pendingLoading, error: pendingError, refetch: pendingRefetch } = useFlashcardsWithPending(!simpleView && currentUser?.user_id ? currentUser.user_id : null)
  
  // Select appropriate data based on view mode
  const flashcards = !simpleView && currentUser?.user_id ? flashcardsWithPending : regularFlashcards
  const flashcardsLoading = !simpleView && currentUser?.user_id ? pendingLoading : regularLoading
  const flashcardsError = !simpleView && currentUser?.user_id ? pendingError : regularError
  const refetchFlashcards = !simpleView && currentUser?.user_id ? pendingRefetch : regularRefetch
  
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { createFlashcard, creating } = useCreateFlashcard()
  const { updateFlashcard, updating } = useUpdateFlashcard()
  const { deleteFlashcard, deleting } = useDeleteFlashcard()
  
  // Progress hooks
  const { markCompleted, updating: updatingProgress } = useUpdateFlashcardProgress()
  const { progress: userProgress, stats: progressStats, refetch: refetchProgress } = useFlashcardProgress(user_id || null)

  // Flashcard set statistics state (unique users who completed)
  const [flashcardSetStatistics, setFlashcardSetStatistics] = useState<{[subId: number]: {unique_users_completed: number}}>({})
  const [statisticsLoading, setStatisticsLoading] = useState(true)

  // Filter flashcards based on search and filter criteria
  const filteredFlashcards = flashcards.filter((flashcard: any) => {
    // Debug log for flashcard_view
    if (simpleView) {
      console.log(`🃏 Flashcard "${flashcard.question?.substring(0, 30)}...": flashcard_view="${flashcard.flashcard_view}", program="${flashcard.program}"`)
    }
    
    // Search filter
    const matchesSearch = searchQuery.trim() === "" || 
      flashcard.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flashcard.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flashcard.subject_name.toLowerCase().includes(searchQuery.toLowerCase())

    // Subject filter
    const matchesSubject = selectedSubjectFilter === "all" || flashcard.subject_name === selectedSubjectFilter

    // Difficulty filter (assuming difficulty is available, otherwise always match)
    const matchesDifficulty = selectedDifficultyFilter === "all" || (flashcard.difficulty || "Mixed") === selectedDifficultyFilter

    // Program filter - for students, automatically filter by their program
    let matchesProgram = true
    if (userRole === "student") {
      // For students, only show flashcards that exactly match their program
      matchesProgram = flashcard.program && flashcard.program === userProgram
      
      // Debug logging for program filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`Flashcard "${flashcard.question}": program="${flashcard.program}", userProgram="${userProgram}", matches=${matchesProgram}`)
      }
    } else if (userRole === "admin" && selectedProgramFilter !== "all") {
      // For admins, apply the selected program filter
      matchesProgram = flashcard.program === selectedProgramFilter
    }

    // Flashcard View filter - show only Public flashcards in simple view (learning section)
    // In tools section, show flashcards created by user or all if admin/faculty
    const matchesView = simpleView 
      ? (flashcard.flashcard_view === 'Public')  // Learning section: only Public flashcards
      : (
          // Tools section: show own flashcards or all for admin/faculty (matching quiz logic)
          userRole === 'admin' || 
          userRole === 'faculty' || 
          Number(flashcard.created_by) === Number(user_id)
        )

    // Debug logging for view filter
    if (simpleView) {
      console.log(`🔍 Filter Check - Flashcard: flashcard_view="${flashcard.flashcard_view}", matchesView=${matchesView}, simpleView=${simpleView}`)
    } else {
      console.log(`🔧 Tools Filter - Flashcard: flashcard_view="${flashcard.flashcard_view}", created_by=${flashcard.created_by}, user_id=${user_id}, is_pending=${flashcard.is_pending}, matchesView=${matchesView}`)
    }

    return matchesSearch && matchesSubject && matchesDifficulty && matchesProgram && matchesView
  })

  // Group flashcards by sub_id (flashcard sets)
  const flashcardsBySubId = filteredFlashcards.reduce((acc: any, flashcard: any) => {
    const subId = flashcard.sub_id || flashcard.flashcard_id;
    if (!acc[subId]) {
      acc[subId] = [];
    }
    acc[subId].push(flashcard);
    return acc;
  }, {});

  // Convert grouped flashcards to sets
  let flashcardGroupedSets = Object.keys(flashcardsBySubId).map((subId) => {
    const cards = flashcardsBySubId[subId];
    const firstCard = cards[0];
    
    // Calculate progress
    const completedCards = cards.filter((c: any) => c.status === 'completed' || c.progress_status === 'completed').length;
    const progress = cards.length > 0 ? Math.round((completedCards / cards.length) * 100) : 0;
    
    // Use first card's question as title, or generate a title
    const title = firstCard.question 
      ? `${firstCard.question.substring(0, 50)}${firstCard.question.length > 50 ? '...' : ''}`
      : `Flashcard Set #${subId}`;
    
    return {
      id: parseInt(subId),
      sub_id: parseInt(subId),
      title: title,
      subject: firstCard.subject_name,
      creator_name: firstCard.creator_name,
      creator_role: firstCard.creator_role,
      created_by: firstCard.created_by,
      cardCount: cards.length,
      description: cards.length > 1 ? `${cards.length} flashcards in this set` : firstCard.answer?.substring(0, 80) + (firstCard.answer?.length > 80 ? '...' : ''),
      difficulty: firstCard.difficulty || "Mixed",
      lastStudied: firstCard.completed_at || firstCard.created_at || new Date().toISOString().split('T')[0],
      progress: progress,
      completedCards: completedCards,
      created_at: firstCard.created_at,
      status: firstCard.status,
      is_pending: firstCard.is_pending,
      comment: firstCard.comment,
      cards: cards.map((c: any) => ({
        id: c.flashcard_id,
        front: c.question,
        back: c.answer,
        status: c.status || c.progress_status || 'not_started',
        completed_at: c.completed_at
      }))
    };
  });

  // Sort flashcard sets: Recommended (4.5+ rating) first, then by rating, then by date
  flashcardGroupedSets = flashcardGroupedSets.sort((a, b) => {
    const ratingA = setRatings[a.sub_id]?.average_rating || 0
    const ratingB = setRatings[b.sub_id]?.average_rating || 0
    
    const isRecommendedA = ratingA >= 4.5
    const isRecommendedB = ratingB >= 4.5
    
    // Recommended items first
    if (isRecommendedA && !isRecommendedB) return -1
    if (!isRecommendedA && isRecommendedB) return 1
    
    // Within same category (both recommended or both not), sort by rating
    if (ratingB !== ratingA) return ratingB - ratingA
    
    // If ratings are equal, sort by date (newest first)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // Fetch flashcard set statistics for all sets
  useEffect(() => {
    const fetchFlashcardSetStatistics = async () => {
      if (flashcardGroupedSets.length === 0) {
        setStatisticsLoading(false)
        return
      }

      try {
        const statisticsPromises = flashcardGroupedSets.map(async (set: any) => {
          try {
            const response = await fetch(`http://localhost:4000/api/flashcards/set/statistics/${set.sub_id}`)
            const data = await response.json()
            
            if (data.success && data.statistics) {
              return {
                subId: set.sub_id,
                unique_users_completed: data.statistics.unique_users_completed || 0
              }
            }
            return {
              subId: set.sub_id,
              unique_users_completed: 0
            }
          } catch (error) {
            console.error(`Error fetching statistics for flashcard set ${set.sub_id}:`, error)
            return {
              subId: set.sub_id,
              unique_users_completed: 0
            }
          }
        })

        const statisticsArray = await Promise.all(statisticsPromises)
        const statisticsMap: {[subId: number]: {unique_users_completed: number}} = {}
        
        statisticsArray.forEach(stat => {
          statisticsMap[stat.subId] = { unique_users_completed: stat.unique_users_completed }
        })
        
        setFlashcardSetStatistics(statisticsMap)
      } catch (error) {
        console.error('Error fetching flashcard set statistics:', error)
      } finally {
        setStatisticsLoading(false)
      }
    }

    fetchFlashcardSetStatistics()
  }, [flashcardGroupedSets.length])

  // Fetch flashcard set ratings
  useEffect(() => {
    const fetchFlashcardSetRatings = async () => {
      if (flashcardGroupedSets.length === 0) {
        setRatingsLoading(false)
        return
      }

      try {
        // Fetch average ratings for all flashcard sets
        const ratingsPromises = flashcardGroupedSets.map(async (set: any) => {
          try {
            const response = await fetch(`http://localhost:4000/api/flashcards/set/${set.sub_id}/rating`)
            if (response.ok) {
              const data = await response.json()
              return {
                subId: set.sub_id,
                average_rating: data.average_rating || 0,
                total_ratings: data.total_ratings || 0
              }
            }
            return { subId: set.sub_id, average_rating: 0, total_ratings: 0 }
          } catch (error) {
            console.error(`Error fetching rating for flashcard set ${set.sub_id}:`, error)
            return { subId: set.sub_id, average_rating: 0, total_ratings: 0 }
          }
        })

        const ratingsArray = await Promise.all(ratingsPromises)
        const ratingsMap: {[subId: number]: {average_rating: number, total_ratings: number}} = {}
        ratingsArray.forEach(rating => {
          ratingsMap[rating.subId] = { average_rating: rating.average_rating, total_ratings: rating.total_ratings }
        })
        setSetRatings(ratingsMap)

        // Fetch user's ratings if logged in
        if (currentUser?.user_id) {
          const userRatingsPromises = flashcardGroupedSets.map(async (set: any) => {
            try {
              const response = await fetch(`http://localhost:4000/api/flashcards/set/${set.sub_id}/rating/${currentUser.user_id}`)
              if (response.ok) {
                const data = await response.json()
                return {
                  subId: set.sub_id,
                  rating: data.rating?.rating || 0
                }
              }
              return { subId: set.sub_id, rating: 0 }
            } catch (error) {
              return { subId: set.sub_id, rating: 0 }
            }
          })

          const userRatingsArray = await Promise.all(userRatingsPromises)
          const userRatingsMap: {[subId: number]: number} = {}
          const userCommentsMap: {[subId: number]: string} = {}
          userRatingsArray.forEach(rating => {
            if (rating.rating > 0) {
              userRatingsMap[rating.subId] = rating.rating
            }
          })
          
          // Fetch user's comments
          const userCommentsPromises = flashcardGroupedSets.map(async (set: any) => {
            try {
              const response = await fetch(`http://localhost:4000/api/flashcards/set/${set.sub_id}/rating/${currentUser.user_id}`)
              if (response.ok) {
                const data = await response.json()
                return {
                  subId: set.sub_id,
                  comment: data.rating?.comment || null
                }
              }
              return { subId: set.sub_id, comment: null }
            } catch (error) {
              return { subId: set.sub_id, comment: null }
            }
          })
          
          const userCommentsArray = await Promise.all(userCommentsPromises)
          userCommentsArray.forEach(item => {
            if (item.comment) {
              userCommentsMap[item.subId] = item.comment
            }
          })
          
          setUserSetRatings(userRatingsMap)
          setUserSetComments(userCommentsMap)
        }
      } catch (error) {
        console.error('Error fetching flashcard set ratings:', error)
      } finally {
        setRatingsLoading(false)
      }
    }

    fetchFlashcardSetRatings()
  }, [flashcardGroupedSets.length, currentUser?.user_id])

  // Handle flashcard set rating
  const handleRateFlashcardSet = async (subId: number, rating: number, comment?: string) => {
    if (!currentUser?.user_id) {
      toast({
        title: "Error",
        description: "You must be logged in to rate flashcard sets",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`http://localhost:4000/api/flashcards/set/${subId}/rating`, {
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
        setSetRatings(prev => ({
          ...prev,
          [subId]: {
            average_rating: data.average_rating,
            total_ratings: data.total_ratings
          }
        }))
        setUserSetRatings(prev => ({
          ...prev,
          [subId]: rating
        }))
        
        // Update comment if provided
        if (comment) {
          setUserSetComments(prev => ({
            ...prev,
            [subId]: comment
          }))
        } else {
          // Remove comment if empty
          setUserSetComments(prev => {
            const newComments = { ...prev }
            delete newComments[subId]
            return newComments
          })
        }

        toast({
          title: "Success",
          description: "Flashcard set rated successfully!",
          duration: 2000
        })
      } else {
        throw new Error('Failed to rate flashcard set')
      }
    } catch (error) {
      console.error('Error rating flashcard set:', error)
      toast({
        title: "Error",
        description: "Failed to rate flashcard set. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCreateFlashcard = async () => {
    if (!question.trim()) {
      toast({ title: "Error", description: "Question is required.", variant: "destructive" });
      return;
    }
    if (!answer.trim()) {
      toast({ title: "Error", description: "Answer is required.", variant: "destructive" });
      return;
    }
    if (!selectedSubject) {
      toast({ title: "Error", description: "Subject is required.", variant: "destructive" });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create flashcards.",
        variant: "destructive",
      })
      return
    }

    try {
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === selectedSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      // Find the max sub_id from all flashcards to increment
      let maxSubId = 0;
      if (flashcards && flashcards.length > 0) {
        maxSubId = Math.max(...flashcards.map((fc: any) => fc.sub_id || 0));
      }
      const newSubId = maxSubId + 1;

      console.log('=== FLASHCARD CREATION DEBUG ===');
      console.log('Flashcard Program State:', flashcardProgram);
      console.log('User Program:', userProgram);
      console.log('User Role:', userRole);
      console.log('Current User:', currentUser);
      console.log('currentUser.program:', currentUser.program);
      
      // Use currentUser.program directly if flashcardProgram is empty for students
      const programToSend = userRole === "admin" ? flashcardProgram : (flashcardProgram || currentUser.program || userProgram);
      console.log('Final program value to send:', programToSend);
      console.log('Program value type:', typeof programToSend);
      console.log('Program value length:', programToSend ? programToSend.length : 'null/undefined');
      
      // Validate program is selected
      if (!programToSend || programToSend.trim() === '') {
        toast({
          title: "Error",
          description: "Please select a program.",
          variant: "destructive",
        });
        return;
      }
      
      // Create the flashcard data object first
      const flashcardData = {
        question: question.trim(),
        answer: answer.trim(),
        subject_id: subject.subject_id,
        created_by: currentUser.user_id,
        sub_id: newSubId,
        program: programToSend,
        flashcard_view: flashcardView
      };
      
      console.log('Complete flashcard data object:', JSON.stringify(flashcardData, null, 2));
      console.log('====================================');

      await createFlashcard(flashcardData)

      toast({
        title: "Submitted for Review",
        description: "Your study material has been submitted and is currently under review by the faculty. It will be published once approved.",
        duration: 5000,
      })

      // Reset form
      setQuestion("")
      setAnswer("")
      setSelectedSubject("")
      setFlashcardView("Personal")
      setShowCreateDialog(false)
      
      // Refresh flashcards and progress
      refetchFlashcards()
      refetchProgress()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditFlashcard = async () => {
    if (!editingFlashcard || !question.trim() || !answer.trim() || !selectedSubject) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    try {
          toast({
            title: "Success",
            description: "Flashcard created successfully!",
            duration: 3000,
          })
          // Reset form
          setQuestion("")
          setAnswer("")
          setSelectedSubject("")
          setShowCreateDialog(false)
      
          // Refresh flashcards and progress
          refetchFlashcards()
          refetchProgress()
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === selectedSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      await updateFlashcard(editingFlashcard.flashcard_id, {
        question: question.trim(),
        answer: answer.trim(),
        subject_id: subject.subject_id,
        program: flashcardProgram
      })

      toast({
        title: "Success",
        description: "Flashcard updated successfully!",
        duration: 3000,
      })

      // Reset form
      setQuestion("")
      setAnswer("")
      setSelectedSubject("")
      setEditingFlashcard(null)
      setShowCreateDialog(false)
      
      // Refresh flashcards and progress
      refetchFlashcards()
      refetchProgress()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFlashcard = async (flashcardId: number) => {
    try {
      await deleteFlashcard(flashcardId)

      toast({
        title: "Success",
        description: "Flashcard deleted successfully!",
        duration: 3000,
      })

      // Refresh flashcards and progress
      refetchFlashcards()
      refetchProgress()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (flashcard: any) => {
    setEditingFlashcard(flashcard)
    setQuestion(flashcard.question)
    setAnswer(flashcard.answer)
    setSelectedSubject(flashcard.subject_name)
    setShowCreateDialog(true
    )
  }

  const closeDialog = () => {
    setShowCreateDialog(false)
    setEditingFlashcard(null)
    setQuestion("")
    setAnswer("")
    setSelectedSubject("")
  }

  // Functions for handling multiple flashcards
  const handleCreateFlashcardSet = async () => {
    if (!flashcardSetTitle.trim() || !flashcardSetSubject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in set title and subject.",
        variant: "destructive",
      })
      return
    }

    if (flashcardsList.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one flashcard",
        variant: "destructive"
      })
      return
    }

    try {
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === flashcardSetSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      // Find the max sub_id from all flashcards to increment
      let maxSubId = 0;
      if (flashcards && flashcards.length > 0) {
        maxSubId = Math.max(...flashcards.map((fc: any) => fc.sub_id || 0));
      }
      const newSubId = maxSubId + 1;

      console.log('=== FLASHCARD SET CREATION DEBUG ===');
      console.log('Flashcard Program State:', flashcardProgram);
      console.log('User Program:', userProgram);
      console.log('User Role:', userRole);
      console.log('Current User:', currentUser);
      console.log('Set Title:', flashcardSetTitle);
      console.log('Set Subject:', flashcardSetSubject);
      console.log('Subject Object:', subject);
      console.log('Flashcards List:', flashcardsList);
      console.log('====================================');

      if (editingFlashcardSet) {
        // Update existing flashcard set
        // First, delete all existing flashcards in the set
        for (const card of editingFlashcardSet.cards) {
          try {
            await deleteFlashcard(card.id)
          } catch (deleteError) {
            console.error(`Error deleting flashcard ${card.id}:`, deleteError)
          }
        }

        // Then create new flashcards with the same sub_id
        for (const [index, flashcard] of flashcardsList.entries()) {
          try {
            console.log(`Creating flashcard ${index + 1} with program:`, flashcardProgram);
            await createFlashcard({
              question: flashcard.question.trim(),
              answer: flashcard.answer.trim(),
              subject_id: subject.subject_id,
              created_by: currentUser?.user_id || 1,
              sub_id: editingFlashcardSet.sub_id || newSubId,
              program: flashcardProgram,
              flashcard_view: flashcardView
            })
          } catch (flashcardError) {
            console.error(`Error creating flashcard ${index + 1}:`, flashcardError)
          }
        }

        toast({
          title: "Submitted for Review",
          description: "Your study material has been submitted and is currently under review by the faculty. It will be published once approved.",
          duration: 5000,
        })
      } else {
        // Create new flashcard set with new sub_id
        for (const [index, flashcard] of flashcardsList.entries()) {
          try {
            console.log(`Creating new flashcard ${index + 1} with program:`, flashcardProgram);
            await createFlashcard({
              question: flashcard.question.trim(),
              answer: flashcard.answer.trim(),
              subject_id: subject.subject_id,
              created_by: currentUser?.user_id || 1,
              sub_id: newSubId,
              program: flashcardProgram,
              flashcard_view: flashcardView
            })
          } catch (flashcardError) {
            console.error(`Error creating flashcard ${index + 1}:`, flashcardError)
          }
        }

        toast({
          title: "Submitted for Review",
          description: "Your study material has been submitted and is currently under review by the faculty. It will be published once approved.",
          duration: 5000,
        })
      }
      
      // Refresh flashcards list and progress
      await refetchFlashcards()
      refetchProgress()
      
      // Reset form
      setFlashcardSetTitle("")
      setFlashcardSetSubject("")
      setFlashcardsList([])
      setCurrentFlashcard(null)
      setEditingFlashcardSet(null)
      setShowCreateDialog(false)
      
    } catch (error) {
      console.error('Error managing flashcard set:', error)
      toast({
        title: "Error",
        description: "Failed to save flashcard set. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddFlashcard = () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Error",
        description: "Please enter both question and answer.",
        variant: "destructive",
      })
      return
    }

    const newFlashcard = {
      id: `fc${Date.now()}`,
      question: question.trim(),
      answer: answer.trim()
    }

    if (editingFlashcardIndex !== null) {
      // Update existing flashcard
      setFlashcardsList(prev => prev.map((fc, index) => 
        index === editingFlashcardIndex ? newFlashcard : fc
      ))
      setEditingFlashcardIndex(null)
    } else {
      // Add new flashcard
      setFlashcardsList(prev => [...prev, newFlashcard])
    }

    // Reset flashcard form
    setQuestion("")
    setAnswer("")
    setShowFlashcardDialog(false)

    toast({
      title: editingFlashcardIndex !== null ? "Flashcard Updated" : "Flashcard Added",
      description: editingFlashcardIndex !== null ? "Flashcard has been updated." : "New flashcard has been added to the set.",
    })
  }

  const handleEditFlashcardInList = (index: number) => {
    const flashcard = flashcardsList[index]
    setEditingFlashcardIndex(index)
    setQuestion(flashcard.question)
    setAnswer(flashcard.answer)
    setShowFlashcardDialog(true)
  }

  const handleDeleteFlashcardFromList = (index: number) => {
    setFlashcardsList(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Flashcard Removed",
      description: "Flashcard has been removed from the set.",
    })
  }

  const startStudying = (set: any) => {
    setSelectedSet(set)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setStudyMode(true)
  }

  const handleEditFlashcardSet = (set: any) => {
    // Check if user can edit this flashcard set
    if (!currentUser || !canManageFlashcard(set)) {
      toast({
        title: "Access Denied",
        description: "You can only edit flashcard sets that you created.",
        variant: "destructive",
      })
      return
    }

    // Set editing mode
    setEditingFlashcardSet(set)
    
    // Set up for editing the flashcard set
    setCurrentFlashcard({})
    setFlashcardSetTitle(set.title)
    setFlashcardSetSubject(set.subject)
    
    // Convert set cards to flashcard list format
    const flashcardList = set.cards.map((card: any) => ({
      id: card.id.toString(),
      question: card.front,
      answer: card.back
    }))
    setFlashcardsList(flashcardList)
    setShowCreateDialog(true)
  }

  const nextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFinishFlashcard = async () => {
    if (!selectedSet || !currentUser) return
    
    const currentCard = selectedSet.cards[currentCardIndex]
    
    try {
      await markCompleted(currentCard.id, currentUser.user_id)
      
      // Update the card status in the current set
      const updatedCards = [...selectedSet.cards]
      updatedCards[currentCardIndex] = {
        ...updatedCards[currentCardIndex],
        status: 'completed'
      }
      
      setSelectedSet({
        ...selectedSet,
        cards: updatedCards
      })
      
      // Refresh progress data
      refetchProgress()
      refetchFlashcards()
      
      // Auto-advance to next card if available
      if (currentCardIndex < selectedSet.cards.length - 1) {
        nextCard()
      }
    } catch (error) {
      console.error('Error marking flashcard as completed:', error)
    }
  }

  const handleNextOrComplete = async () => {
    if (!selectedSet || !currentUser) return;
    try {
      const isLastCard = currentCardIndex === selectedSet.cards.length - 1;
      if (isLastCard) {
        // Mark all cards as completed and finish set
        const updatedCards = [...selectedSet.cards];
        for (let i = 0; i < updatedCards.length; i++) {
          if (updatedCards[i].status !== 'completed') {
            await markCompleted(updatedCards[i].id, currentUser.user_id);
            updatedCards[i] = {
              ...updatedCards[i],
              status: 'completed'
            };
          }
        }
        setSelectedSet({
          ...selectedSet,
          cards: updatedCards
        });
        refetchProgress();
        refetchFlashcards();
        
        const completedSubId = selectedSet.sub_id;
        const completedSubject = selectedSet.subject;
        
        // Show completion message and go back to sets
        toast({
          title: "Congratulations!",
          description: "You've completed this flashcard set! 🎉",
          duration: 4000
        });
        
        setTimeout(() => {
          setStudyMode(false);
          
          // Show rating prompt if user hasn't rated this set yet
          if (!userSetRatings[completedSubId]) {
            setSetToRate({ subId: completedSubId, subject: completedSubject });
            setShowRatingPrompt(true);
          }
        }, 2000);
      } else {
        // Just go to next card, do not mark as completed
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error('Error marking flashcard as completed:', error);
    }
  }

  const FlashcardSetCard = ({ set }: { set: any }) => {
    // Check if flashcard set was created within the last 24 hours
    const isNew = set.created_at ? 
      (new Date().getTime() - new Date(set.created_at).getTime()) < (24 * 60 * 60 * 1000) : 
      false;
    
    // Check if flashcard set is highly rated (4.5+)
    const isRecommended = (setRatings[set.sub_id]?.average_rating || 0) >= 4.5;
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 overflow-hidden">
        {/* Recommended Banner for highly-rated sets (4.5+) */}
        {isRecommended && !set.is_pending && (
          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-900 border-b border-amber-200 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-amber-300 px-3 py-1.5 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <Trophy className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                ⭐ Recommended - Highly Rated ({setRatings[set.sub_id]?.average_rating.toFixed(1)} stars)
              </span>
            </div>
          </div>
        )}
        
        {set.is_pending && (
          <div className={`${
            set.status === 'pending' 
              ? 'bg-amber-100 text-amber-800 border-b border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
              : set.status === 'approved'
              ? 'bg-green-100 text-green-800 border-b border-green-200 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 border-b border-red-200 dark:bg-red-900/30 dark:text-red-300'
          } px-3 py-1.5 text-xs font-medium`}>
            <div className="flex items-center space-x-1.5">
              {set.status === 'pending' && <Clock className="w-3 h-3 flex-shrink-0" />}
              {set.status === 'approved' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
              {set.status === 'rejected' && <XCircle className="w-3 h-3 flex-shrink-0" />}
              <span className="truncate">
                {set.status === 'pending' && '⏳ Pending Approval'}
                {set.status === 'approved' && '✅ Approved'}
                {set.status === 'rejected' && '❌ Rejected'}
              </span>
              {/* Show clickable link for rejection comment */}
              {set.status === 'rejected' && set.comment && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-red-900 dark:text-red-200 underline h-auto p-0 ml-2 font-semibold hover:text-red-700 text-xs"
                  onClick={() => {
                    setSelectedRejectionComment({ subject: set.subject, comment: set.comment || '' })
                    setShowRejectionDialog(true)
                  }}
                >
                  - View Reason
                </Button>
              )}
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Set name/title hidden */}
              {/* <CardTitle className="text-xl">{set.title}</CardTitle> */}
              <div className="flex items-center gap-2">
                <CardDescription className="text-base mt-1">{set.subject}</CardDescription>
                {isNew && !set.is_pending && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                    ✨ New
                  </Badge>
                )}
              </div>
              <Badge variant={set.difficulty === "Beginner" ? "secondary" : set.difficulty === "Intermediate" ? "default" : "destructive"}>
                {set.difficulty}
              </Badge>
              {/* Show creator name and role */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                <User className="w-3 h-3" />
                <span>
                  Created by: {getCreatorIndicator(set)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Layers className="w-4 h-4 mr-1 text-muted-foreground" />
                <span>{set.cardCount} cards</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                <span>Last studied: {new Date(set.lastStudied).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>{flashcardSetStatistics[set.sub_id]?.unique_users_completed || 0} {(flashcardSetStatistics[set.sub_id]?.unique_users_completed || 0) === 1 ? 'user' : 'users'} finished</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Progress</Label>
              <span>{set.progress}%</span>
            </div>
            <Progress value={set.progress} className="h-2" />
          </div>

          {/* Summary info instead of individual flashcards */}
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-muted-foreground">{set.cardCount}</div>
            <div className="text-sm text-muted-foreground">
              {set.cardCount === 1 ? 'Flashcard' : 'Flashcards'} ready to study
            </div>
          </div>

          {/* Flashcard Set Rating */}
          <div className="border-t pt-3">
            <StarRating
              rating={setRatings[set.sub_id]?.average_rating || 0}
              totalRatings={setRatings[set.sub_id]?.total_ratings || 0}
              userRating={userSetRatings[set.sub_id] || null}
              userComment={userSetComments[set.sub_id] || null}
              onRate={(rating, comment) => handleRateFlashcardSet(set.sub_id, rating, comment)}
              readonly={!currentUser?.user_id || set.is_pending}
              size="md"
              showCount={true}
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={() => startStudying(set)}
              disabled={set.cardCount === 0 || set.is_pending}
            >
              <Brain className="w-4 h-4 mr-2" />
              {set.is_pending ? 'Pending Approval' : 'Study Now'}
            </Button>
            {!simpleView && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditFlashcardSet(set)}
                disabled={set.is_pending}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Set
              </Button>
            )}
          </div>

          {set.cardCount === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              No flashcards in this set yet.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (studyMode && selectedSet) {
    const currentCard = selectedSet.cards[currentCardIndex]
    const progress = ((currentCardIndex + 1) / selectedSet.cards.length) * 100
    const isCompleted = currentCard.status === 'completed'

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStudyMode(false)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Sets
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{selectedSet.title}</h2>
              <p className="text-sm text-muted-foreground">
                Card {currentCardIndex + 1} of {selectedSet.cards.length}
                {isCompleted && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsFlipped(false)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <Card 
            className={`min-h-[300px] cursor-pointer hover:shadow-lg transition-all duration-200 ${
              isCompleted ? 'border-green-200 bg-green-50' : ''
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <CardContent className="flex items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  {isFlipped ? "Answer" : "Question"}
                </div>
                <div className="text-xl font-medium">
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>
                <div className="text-sm text-muted-foreground">
                  Click to {isFlipped ? "show question" : "reveal answer"}
                </div>
                {isCompleted && (
                  <div className="flex items-center justify-center text-green-600">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevCard}
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Hard
              </Button>
              <Button variant="outline" size="sm">
                Good
              </Button>
              <Button variant="outline" size="sm">
                Easy
              </Button>
            </div>

            <Button 
              onClick={handleNextOrComplete}
              disabled={updatingProgress}
              className={`px-6 py-2 ${
                currentCardIndex === selectedSet.cards.length - 1 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              size="lg"
            >
              {updatingProgress ? (
                "Processing..."
              ) : currentCardIndex === selectedSet.cards.length - 1 ? (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Complete Set
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (flashcardsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading flashcards...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">Study with interactive flashcard sets</p>
        </div>
        {!simpleView && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Flashcard
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setEditingFlashcard(null)
              setCurrentFlashcard(null)
              console.log('Modal opened: flashcardProgram value is', flashcardProgram);
              setShowCreateDialog(true)
            }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Single Flashcard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setCurrentFlashcard({})
              setFlashcardSetTitle("")
              setFlashcardSetSubject("")
              setFlashcardsList([])
              setEditingFlashcardSet(null)
              setShowCreateDialog(true)
            }}>
              <Layers className="w-4 h-4 mr-2" />
              Flashcard Set
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search flashcards by question, answer or subject..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* View Mode Toggle */}
    {/* Hide list type, only show set type */}
        
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(selectedSubjectFilter !== "all" || selectedDifficultyFilter !== "all" || (userRole === "admin" && selectedProgramFilter !== "all")) && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {[selectedSubjectFilter, selectedDifficultyFilter, userRole === "admin" ? selectedProgramFilter : null].filter(f => f !== "all" && f !== null).length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Flashcards</DialogTitle>
              <DialogDescription>
                Filter flashcards by subject and difficulty
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
                      {selectedSubjectFilter === 'all' ? (
                        "All Subjects"
                      ) : (
                        subjects.find((subject: any) => subject.subject_name === selectedSubjectFilter)?.subject_code + 
                        " - " + 
                        subjects.find((subject: any) => subject.subject_name === selectedSubjectFilter)?.subject_name
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
                            .filter((subject: any) => {
                              const searchTerm = subjectFilterSearchValue.toLowerCase()
                              const subjectText = `${subject.subject_code} ${subject.subject_name}`.toLowerCase()
                              return (
                                subject.subject_name?.toLowerCase().includes(searchTerm) ||
                                subject.subject_code?.toLowerCase().includes(searchTerm) ||
                                subjectText.includes(searchTerm)
                              )
                            })
                            .map((subject: any) => (
                              <CommandItem
                                key={subject.subject_id}
                                value={subject.subject_name}
                                onSelect={(currentValue) => {
                                  setSelectedSubjectFilter(currentValue)
                                  setSubjectFilterComboboxOpen(false)
                                  setSubjectFilterSearchValue("")
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedSubjectFilter === subject.subject_name 
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

      {/* Main content below search/filter bar */}
      <>
      {viewMode === "sets" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {flashcardGroupedSets.map((set) => (
              <FlashcardSetCard key={set.id} set={set} />
            ))}
          </div>

          {flashcardGroupedSets.length === 0 && (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              {filteredFlashcards.length === 0 && flashcards.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {simpleView ? "Check back later for flashcards" : "Create your first flashcard to start studying"}
                  </p>
                  {!simpleView && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Flashcard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards match your filters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search terms or filters to find flashcards
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
                        Create New Flashcard
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-4">
            {filteredFlashcards.map((flashcard: any) => (
              <Card key={flashcard.flashcard_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{flashcard.subject_name}</Badge>
                      {flashcard.status === 'completed' && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <Star className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {flashcard.status === 'in_progress' && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Question:</Label>
                        <p className="text-sm">{flashcard.question}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Answer:</Label>
                        <p className="text-sm">{flashcard.answer}</p>
                      </div>
                    </div>
                    
                    {/* Creator indicator */}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground border-t pt-2 mt-2">
                      <User className="w-3 h-3" />
                      <span>Created by: {getCreatorIndicator(flashcard)}</span>
                    </div>
                  </div>
                  {!simpleView && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkFlashcardPermissionAndEdit(flashcard)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkFlashcardPermissionAndDelete(flashcard)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredFlashcards.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              {flashcards.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {simpleView ? "Check back later for flashcards" : "Create your first flashcard to start studying"}
                  </p>
                  {!simpleView && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Flashcard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards match your filters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search terms or filters to find flashcards
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
                        Create New Flashcard
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Flashcard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={() => {
        setShowCreateDialog(false)
        setEditingFlashcard(null)
        setCurrentFlashcard(null)
        setQuestion("")
        setAnswer("")
        setSelectedSubject("")
        setFlashcardSetTitle("")
        setFlashcardSetSubject("")
        setFlashcardsList([])
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFlashcard ? "Edit Flashcard" : 
               currentFlashcard && Object.keys(currentFlashcard).length === 0 ? 
                 (editingFlashcardSet ? "Edit Flashcard Set" : "Create Flashcard Set") : 
               "Create Single Flashcard"}
            </DialogTitle>
            <DialogDescription>
              {editingFlashcard ? "Update your flashcard" : 
               currentFlashcard && Object.keys(currentFlashcard).length === 0 ? 
                 (editingFlashcardSet ? "Update multiple flashcards in this set" : "Create multiple flashcards in one go") : 
               "Create a single flashcard to study with"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Single Flashcard Creation/Edit */}
          {(!currentFlashcard || editingFlashcard) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select value={flashcardProgram} onValueChange={(value) => {
                  console.log('Program dropdown selected:', value);
                  setFlashcardProgram(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole === "admin" ? (
                      programOptions.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))
                    ) : (
                      // Students can only see their own program
                      userProgram && (
                        <SelectItem key={userProgram} value={userProgram}>
                          {userProgram}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flashcard-view">Flashcard View</Label>
                <Select value={flashcardView} onValueChange={(value: "Personal" | "Public") => setFlashcardView(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Public flashcards appear in the learning section for all users. Personal flashcards are only visible in your tools.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Popover open={createSubjectComboboxOpen} onOpenChange={setCreateSubjectComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={createSubjectComboboxOpen}
                      className="w-full justify-between"
                    >
                      {selectedSubject ? (
                        (() => {
                          const subject = subjects.find(s => s.subject_name === selectedSubject);
                          return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : selectedSubject;
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
                        value={createSubjectSearchValue}
                        onValueChange={setCreateSubjectSearchValue}
                      />
                      <CommandList>
                        {subjects
                          .filter((subject) => {
                            const searchTerm = createSubjectSearchValue.toLowerCase();
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
                                setSelectedSubject(subject.subject_name)
                                setCreateSubjectComboboxOpen(false)
                                setCreateSubjectSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSubject === subject.subject_name ? "opacity-100" : "opacity-0"
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
                <Label htmlFor="question">Question</Label>
                <Textarea 
                  id="question" 
                  placeholder="Enter the question" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea 
                  id="answer" 
                  placeholder="Enter the answer" 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setEditingFlashcard(null)
                  setQuestion("")
                  setAnswer("")
                  setSelectedSubject("")
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingFlashcard ? handleEditFlashcard : handleCreateFlashcard}
                  disabled={creating || updating}
                >
                  {editingFlashcard ? (updating ? "Updating..." : "Update") : (creating ? "Creating..." : "Create")}
                </Button>
              </div>
            </div>
          )}

          {/* Flashcard Set Creation */}
          {currentFlashcard && Object.keys(currentFlashcard).length === 0 && !editingFlashcard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Set Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Set Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setTitle">Set Title</Label>
                    <Input 
                      id="setTitle" 
                      placeholder="Enter set title"
                      value={flashcardSetTitle}
                      onChange={(e) => setFlashcardSetTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setProgram">Program</Label>
                    <Select value={flashcardProgram} onValueChange={val => {
                      console.log('Set dropdown selected program:', val);
                      setFlashcardProgram(val);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRole === "admin" ? (
                          programOptions.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))
                        ) : (
                          // Students can only see their own program
                          userProgram && (
                            <SelectItem key={userProgram} value={userProgram}>
                              {userProgram}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setFlashcardView">Flashcard View</Label>
                    <Select value={flashcardView} onValueChange={(value: "Personal" | "Public") => setFlashcardView(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Public flashcards appear in the learning section for all users
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setSubject">Subject</Label>
                    <Popover open={setSubjectComboboxOpen} onOpenChange={setSetSubjectComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={setSubjectComboboxOpen}
                          className="w-full justify-between"
                        >
                          {flashcardSetSubject ? (
                            (() => {
                              const subject = subjects.find(s => s.subject_name === flashcardSetSubject);
                              return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : flashcardSetSubject;
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
                            value={setSubjectSearchValue}
                            onValueChange={setSetSubjectSearchValue}
                          />
                          <CommandList>
                            {subjects
                              .filter((subject) => {
                                const searchTerm = setSubjectSearchValue.toLowerCase();
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
                                    setFlashcardSetSubject(subject.subject_name)
                                    setSetSubjectComboboxOpen(false)
                                    setSetSubjectSearchValue("")
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      flashcardSetSubject === subject.subject_name ? "opacity-100" : "opacity-0"
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
                </div>
              </div>

              {/* Flashcards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Flashcards ({flashcardsList.length})</h3>
                  <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Flashcard
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingFlashcardIndex !== null ? "Edit Flashcard" : "Add New Flashcard"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Textarea 
                            placeholder="Enter the question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer</Label>
                          <Textarea 
                            placeholder="Enter the answer..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setShowFlashcardDialog(false)
                            setEditingFlashcardIndex(null)
                            setQuestion("")
                            setAnswer("")
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddFlashcard}>
                            {editingFlashcardIndex !== null ? "Update Flashcard" : "Add Flashcard"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Flashcards List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {flashcardsList.map((flashcard, index) => (
                    <Card key={flashcard.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{index + 1}. {flashcard.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">{flashcard.answer}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditFlashcardInList(index)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteFlashcardFromList(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {flashcardsList.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No flashcards added yet</p>
                      <p className="text-xs">Click "Add Flashcard" to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Flashcard Set Actions */}
          {currentFlashcard && Object.keys(currentFlashcard).length === 0 && !editingFlashcard && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false)
                setCurrentFlashcard(null)
                setFlashcardSetTitle("")
                setFlashcardSetSubject("")
                setFlashcardsList([])
                setEditingFlashcardSet(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateFlashcardSet}>
                {editingFlashcardSet ? "Update Flashcard Set" : "Create Flashcard Set"}
              </Button>
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
              Your flashcard set for "{selectedRejectionComment?.subject}" was rejected for the following reason:
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
              <span>Rate This Flashcard Set</span>
            </DialogTitle>
            <DialogDescription>
              How would you rate the "{setToRate?.subject}" flashcard set? Your feedback helps improve the learning experience.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {setToRate && (
              <StarRating
                rating={0}
                totalRatings={setRatings[setToRate.subId]?.total_ratings || 0}
                userRating={null}
                userComment={null}
                onRate={(rating, comment) => {
                  handleRateFlashcardSet(setToRate.subId, rating, comment)
                  setShowRatingPrompt(false)
                  setSetToRate(null)
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
                setSetToRate(null)
              }}
            >
              Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
    </div>
  );
}
