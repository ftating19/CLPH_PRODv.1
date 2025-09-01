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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Brain, Clock, Trophy, Plus, Search, Filter, Star, Play, CheckCircle, Trash2, Edit, X, ChevronLeft, ChevronRight, Layers, List, User } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useQuizzes, useQuizQuestions, useQuizAttempts } from "@/hooks/use-quizzes"
import { useSubjects } from "@/hooks/use-subjects"

// Question types
type QuestionType = "multiple-choice" | "true-false" | "short-answer" | "essay"

interface Question {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
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
}

export default function Quizzes() {
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
  
  // Confirmation and time-up dialogs
  const [showStartConfirmation, setShowStartConfirmation] = useState(false)
  const [quizToStart, setQuizToStart] = useState<Quiz | null>(null)
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const { currentUser } = useUser()
  const { toast } = useToast()

  // Database hooks
  const { quizzes, loading: quizzesLoading, error: quizzesError, refetch: refetchQuizzes } = useQuizzes()
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { questions, loading: questionsLoading } = useQuizQuestions(currentQuiz?.id || currentQuiz?.quiz_id || null)
  const { createAttempt } = useQuizAttempts()

  // Convert database quiz to component Quiz format
  const quizList = quizzes.map((dbQuiz: any) => ({
    id: dbQuiz.quizzes_id,
    quiz_id: dbQuiz.quizzes_id,
    title: dbQuiz.title,
    subject: dbQuiz.subject_name,
    questions: [], // Will be loaded separately when needed
    questionCount: dbQuiz.item_counts || 0, // Add question count from database
    duration: `${dbQuiz.duration || 15}`, // Remove hardcoded "min" - will be formatted by formatDuration
    duration_unit: dbQuiz.duration_unit || 'minutes', // Add duration unit from database
    difficulty: dbQuiz.difficulty || 'Medium',
    description: dbQuiz.description || 'Test your knowledge in this subject area',
    completedTimes: 0, // TODO: Get from attempts
    bestScore: null, // TODO: Get from attempts
    lastAttempt: null, // TODO: Get from attempts
    created_by: dbQuiz.created_by,
    creator_name: `${dbQuiz.first_name || ''} ${dbQuiz.last_name || ''}`.trim(),
  }))

  // Filter quizzes based on search and filter criteria
  const filteredQuizList = quizList.filter((quiz: any) => {
    // Search filter
    const matchesSearch = searchQuery.trim() === "" || 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Subject filter
    const matchesSubject = selectedSubjectFilter === "all" || quiz.subject === selectedSubjectFilter

    // Difficulty filter
    const matchesDifficulty = selectedDifficultyFilter === "all" || quiz.difficulty === selectedDifficultyFilter

    return matchesSearch && matchesSubject && matchesDifficulty
  })

  // Removed quizGroupedSets logic

  // Form states for quiz creation
  const [quizTitle, setQuizTitle] = useState("")
  const [quizSubject, setQuizSubject] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [quizDuration, setQuizDuration] = useState("")
  const [quizDurationUnit, setQuizDurationUnit] = useState("minutes") // Add duration unit state
  const [quizDifficulty, setQuizDifficulty] = useState("")
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])

  // Form states for question creation
  const [questionType, setQuestionType] = useState<QuestionType>("multiple-choice")
  const [questionText, setQuestionText] = useState("")
  const [questionOptions, setQuestionOptions] = useState(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [questionExplanation, setQuestionExplanation] = useState("")
  const [questionPoints, setQuestionPoints] = useState(5)

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const user_id = currentUser?.user_id

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
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
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
        type: q.type || 'multiple-choice',
        options: q.choices || q.options || [],
        correctAnswer: q.answer || q.correct_answer,
        points: q.points || 1,
        explanation: q.explanation
      }))

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
      takingQuiz.questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correctAnswer) {
          correctAnswers++
        }
      })

      const score = Math.round((correctAnswers / takingQuiz.questions.length) * 100)
      
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

        const response = await fetch('http://localhost:4000/api/quiz-attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attemptData)
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Quiz Completed!",
            description: `Your score: ${score}% (${correctAnswers}/${takingQuiz.questions.length} correct) in ${timeSpent} minutes.`,
          })
        } else {
          throw new Error(result.error || 'Failed to save quiz attempt')
        }
      } catch (error) {
        console.error('Error saving quiz attempt:', error)
        toast({
          title: "Quiz Completed",
          description: `Your score: ${score}% (${correctAnswers}/${takingQuiz.questions.length} correct), but failed to save results.`,
          variant: "destructive"
        })
      }
    }

    // Reset quiz taking state
    exitQuiz()
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
        item_counts: quizQuestions.length
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
                quizzes_id: createdQuizId,  // Changed from quiz_id to quizzes_id
                question: question.question,  // Changed from question_text to question
                choices: question.options || [],
                answer: question.correctAnswer,  // Changed from correct_answer to answer
                explanation: question.explanation || null,
                points: question.points || 1
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
        setQuizQuestions([])
        setCurrentQuiz(null)
        setShowCreateDialog(false)
        
        toast({
          title: "Success",
          description: currentQuiz ? "Quiz updated successfully" : `Quiz created successfully with ${quizQuestions.length} questions`
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
      options: questionType === "multiple-choice" ? questionOptions.filter(opt => opt.trim()) : undefined,
      correctAnswer: correctAnswer,
      explanation: questionExplanation,
      points: questionPoints
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

  const QuizCard = ({ quiz }: { quiz: Quiz }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{quiz.title}</CardTitle>
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
            <span>Best: {quiz.bestScore ? `${quiz.bestScore}%` : "Not attempted"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span>{quiz.completedTimes} attempts</span>
          </div>
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
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={() => checkQuizPermissionAndManage(quiz)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage Quiz
          </Button>
          <Button 
            size="sm"
            onClick={() => startQuiz(quiz, false)}
            disabled={(quiz.questionCount || 0) === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            {quiz.completedTimes > 0 ? "Retake" : "Start"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => checkQuizPermissionAndDelete(quiz)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        {(quiz.questionCount || 0) === 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            No questions added yet. Click 'Manage Quiz' to add questions.
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with interactive quizzes</p>
        </div>
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
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={quizSubject} onValueChange={setQuizSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.subject_id} value={subject.subject_name}>
                              {subject.subject_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                  <SelectItem value="short-answer">Short Answer</SelectItem>
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

                          {(questionType === "short-answer" || questionType === "essay") && (
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
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_name}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        {filteredQuizList.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      {/* List View (removed viewMode check, always show list) */}

      {/* Show different messages based on filter state */}
      {filteredQuizList.length === 0 && !quizzesLoading && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          {quizList.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No quizzes available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quiz to start testing knowledge
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
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
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Quiz
                </Button>
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
                  <div className="bg-red-100 dark:bg-red-900 px-3 py-1 rounded-lg">
                    <div className="text-xs text-red-600 dark:text-red-300 font-medium">
                      Time Remaining
                    </div>
                    <div className="text-lg font-bold text-red-800 dark:text-red-200">
                      {formatTime(getRemainingTime())}
                    </div>
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
                  {/* Multiple Choice Questions */}
                  {takingQuiz.questions[currentQuestionIndex].type === "multiple-choice" && (
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
                            // Preview mode - show letter indicators like manage quiz
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium bg-white dark:bg-gray-800">
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                          ) : (
                            // Quiz mode - show radio buttons
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
                    </div>
                  )}

                  {/* True/False Questions */}
                  {takingQuiz.questions[currentQuestionIndex].type === "true-false" && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground mb-3">
                        {isPreviewMode ? "Answer Options:" : "Select your answer:"}
                      </div>
                      
                      {["True", "False"].map((option, optionIndex) => (
                        <div key={option} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isPreviewMode 
                            ? "bg-muted/30" 
                            : selectedAnswers[currentQuestionIndex] === option 
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                              : "hover:bg-muted cursor-pointer"
                        }`}>
                          {isPreviewMode ? (
                            // Preview mode - show T/F indicators
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium bg-white dark:bg-gray-800">
                              {option.charAt(0)}
                            </div>
                          ) : (
                            // Quiz mode - show radio buttons
                            <input
                              type="radio"
                              id={`tf-${option}`}
                              name={`question-${currentQuestionIndex}`}
                              value={option}
                              checked={selectedAnswers[currentQuestionIndex] === option}
                              onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value)}
                              className="w-4 h-4"
                            />
                          )}
                          <Label 
                            htmlFor={isPreviewMode ? undefined : `tf-${option}`}
                            className={`flex-1 ${isPreviewMode ? "" : "cursor-pointer"}`}
                            onClick={isPreviewMode ? undefined : () => handleAnswerSelect(currentQuestionIndex, option)}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

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
            <AlertDialogTitle>Start Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you ready to start the quiz "{quizToStart?.title}"?
              <br /><br />
              <strong>Duration:</strong> {quizToStart?.duration} {quizToStart?.duration_unit}
              <br />
              <strong>Questions:</strong> {quizToStart?.questionCount || 'Unknown'} questions
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
              Start Quiz
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
    </div>
  )
}
