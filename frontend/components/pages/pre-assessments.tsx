"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Brain, Clock, Trophy, Plus, Search, Edit, Trash2, Eye, Target, FileText, Users, ChevronDown, ArrowLeft, ArrowRight, Play, CheckCircle, Check, ChevronsUpDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { usePreAssessments } from "@/hooks/use-pre-assessments"
import { usePreAssessmentGuard } from "@/hooks/use-pre-assessment-guard"
import { CICT_PROGRAMS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Custom multi-select component for subjects
const SubjectMultiSelect = ({ 
  selectedSubjects, 
  onChange, 
  subjects,
  disabled = false 
}: { 
  selectedSubjects: number[]
  onChange: (subjects: number[]) => void
  subjects: any[]
  disabled?: boolean
}) => {
  const [open, setOpen] = useState(false)
  
  const handleSubjectToggle = (subjectId: number) => {
    const updatedSubjects = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter(id => id !== subjectId)
      : [...selectedSubjects, subjectId]
    onChange(updatedSubjects)
  }

  const selectedSubjectNames = subjects
    .filter(subject => selectedSubjects.includes(subject.subject_id))
    .map(subject => subject.subject_name)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedSubjects.length === 0 
            ? "Select subjects..." 
            : `${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? 's' : ''} selected`
          }
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-60 overflow-auto">
          {subjects.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No subjects available for selected program and year level
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.subject_id} className="flex items-center space-x-2 p-2 hover:bg-accent cursor-pointer">
                <Checkbox
                  checked={selectedSubjects.includes(subject.subject_id)}
                  onCheckedChange={() => handleSubjectToggle(subject.subject_id)}
                />
                <span className="text-sm">{subject.subject_name} ({subject.subject_code})</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Question types
type QuestionType = "multiple-choice" | "true-false" | "enumeration" | "essay"

interface Question {
  id: number
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
  subject_id?: number
  subject_name?: string
  subject_code?: string
}

interface Answer {
  questionId: number
  answer: string
}

interface PreAssessment {
  id: number
  title: string
  description: string
  created_by: number
  created_by_name?: string
  program: string
  year_level: string
  duration: number
  duration_unit: string
  difficulty: "Easy" | "Medium" | "Hard"
  status: "active" | "inactive"
  created_at?: string
  question_count?: number
}

export default function PreAssessments() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userRole = currentUser?.role?.toLowerCase() || "student"
  const { checkPreAssessmentStatus } = usePreAssessmentGuard()

  // Check if this is a required assessment flow
  const isRequired = searchParams?.get('required') === 'true'
  const selectedAssessmentId = searchParams?.get('assessment')

  // State management
  const { preAssessments, loading, error, refetch } = usePreAssessments()
  const [subjects, setSubjects] = useState<any[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [selectedPreAssessment, setSelectedPreAssessment] = useState<PreAssessment | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showQuestionManagerDialog, setShowQuestionManagerDialog] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({
    title: "",
    program: "",
    year_level: "",
    description: "",
    duration: 30,
    duration_unit: "minutes",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard"
  })

  const [editForm, setEditForm] = useState({
    title: "",
    program: "",
    year_level: "",
    description: "",
    duration: 30,
    duration_unit: "minutes",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard"
  })

  const [questionForm, setQuestionForm] = useState({
    type: "multiple-choice" as QuestionType,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    points: 1,
    subjectId: ""
  })

  // Question subject combobox state
  const [questionSubjectComboboxOpen, setQuestionSubjectComboboxOpen] = useState(false)
  const [questionSubjectSearchValue, setQuestionSubjectSearchValue] = useState("")

  // Check if user is admin
  const isAdmin = userRole === "admin"
  const isStudent = userRole === "student"

  // Redirect if not admin and not a student
  useEffect(() => {
    if (currentUser && !isAdmin && !isStudent) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      })
      router.push('/dashboard')
    }
  }, [currentUser, isAdmin, isStudent, toast, router])

  // Fetch data
  useEffect(() => {
    if (isAdmin) {
      fetchSubjects()
    } else if (isStudent) {
      fetchStudentResults()
    }
  }, [isAdmin, isStudent])

  // Handle required assessment selection
  useEffect(() => {
    if (isRequired && selectedAssessmentId && preAssessments.length > 0) {
      const assessment = preAssessments.find(a => a.id.toString() === selectedAssessmentId)
      if (assessment) {
        setSelectedPreAssessment(assessment)
        setShowStartDialog(true)
      }
    }
  }, [isRequired, selectedAssessmentId, preAssessments])

  // Timer effect for student assessment
  useEffect(() => {
    if (timeLeft > 0 && showAssessmentModal && isStudent) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && selectedPreAssessment && showAssessmentModal && isStudent) {
      handleSubmitStudentAssessment()
    }
  }, [timeLeft, selectedPreAssessment, showAssessmentModal, isStudent])

  // Filter subjects based on program and year level
  useEffect(() => {
    filterSubjects()
  }, [subjects, createForm.program, createForm.year_level, editForm.program, editForm.year_level])

  const filterSubjects = () => {
    const program = createForm.program || editForm.program
    const yearLevel = createForm.year_level || editForm.year_level
    
    if (!program || !yearLevel) {
      setFilteredSubjects([])
      return
    }
    
    const filtered = subjects.filter(subject => {
      // Check if subject.program is an array or string
      let subjectPrograms = []
      
      if (typeof subject.program === 'string') {
        try {
          // Try to parse as JSON array
          subjectPrograms = JSON.parse(subject.program)
        } catch {
          // If not JSON, treat as single program
          subjectPrograms = [subject.program]
        }
      } else if (Array.isArray(subject.program)) {
        subjectPrograms = subject.program
      }
      
      // Check if the selected program is in the subject's programs
      // and if year level matches
      return subjectPrograms.includes(program) && subject.year_level === yearLevel
    })
    
    console.log('Filtering subjects:', { program, yearLevel, totalSubjects: subjects.length, filteredCount: filtered.length, filtered })
    setFilteredSubjects(filtered)
  }

  // Filter subjects for question dialog based on selected pre-assessment
  const getQuestionSubjects = () => {
    if (!selectedPreAssessment || !selectedPreAssessment.program || !selectedPreAssessment.year_level) {
      console.log('No pre-assessment selected or missing program/year level:', selectedPreAssessment)
      return []
    }

    const filtered = subjects.filter(subject => {
      // Check if subject.program is an array or string
      let subjectPrograms = []
      
      if (typeof subject.program === 'string') {
        try {
          // Try to parse as JSON array
          subjectPrograms = JSON.parse(subject.program)
        } catch {
          // If not JSON, treat as single program
          subjectPrograms = [subject.program]
        }
      } else if (Array.isArray(subject.program)) {
        subjectPrograms = subject.program
      }
      
      // Check if the pre-assessment's program is in the subject's programs
      // and if year level matches
      return subjectPrograms.includes(selectedPreAssessment.program) && 
             subject.year_level === selectedPreAssessment.year_level
    }).sort((a, b) => {
      // Sort alphabetically by subject code first, then by subject name
      const codeComparison = a.subject_code.localeCompare(b.subject_code)
      if (codeComparison !== 0) {
        return codeComparison
      }
      // If codes are the same, sort by subject name
      return a.subject_name.localeCompare(b.subject_name)
    })

    console.log('Question subjects filtered and sorted:', {
      preAssessment: selectedPreAssessment,
      totalSubjects: subjects.length,
      filteredCount: filtered.length,
      filtered: filtered.map(s => ({ id: s.subject_id, name: s.subject_name, code: s.subject_code, program: s.program, year: s.year_level }))
    })

    return filtered
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('https://api.cictpeerlearninghub.com/api/subjects')
      if (!response.ok) throw new Error('Failed to fetch subjects')
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchStudentResults = async () => {
    if (!currentUser?.user_id) return
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pre-assessment-results/user/${currentUser.user_id}`)
      if (!response.ok) throw new Error('Failed to fetch student results')
      const data = await response.json()
      setStudentResults(data.results || [])
    } catch (error) {
      console.error('Error fetching student results:', error)
    }
  }

  // Create pre-assessment
  const handleCreatePreAssessment = async () => {
    if (!createForm.title.trim() || !createForm.program || !createForm.year_level || 
        !createForm.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const requestBody = {
        ...createForm,
        created_by: currentUser?.user_id
      }
      
      console.log('Creating pre-assessment with data:', requestBody)
      
      const response = await fetch('https://api.cictpeerlearninghub.com/api/pre-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error response:', errorData)
        throw new Error(errorData.error || 'Failed to create pre-assessment')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Pre-assessment created successfully",
        variant: "default"
      })

      setShowCreateDialog(false)
      setCreateForm({
        title: "",
        program: "",
        year_level: "",
        description: "",
        duration: 30,
        duration_unit: "minutes",
        difficulty: "Medium"
      })
      refetch()
    } catch (error) {
      console.error('Error creating pre-assessment:', error)
      toast({
        title: "Error",
        description: "Failed to create pre-assessment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit pre-assessment
  const handleEditPreAssessment = (preAssessment: PreAssessment) => {
    setSelectedPreAssessment(preAssessment)
    setEditForm({
      title: preAssessment.title,
      program: preAssessment.program,
      year_level: preAssessment.year_level,
      description: preAssessment.description,
      duration: preAssessment.duration,
      duration_unit: preAssessment.duration_unit,
      difficulty: preAssessment.difficulty
    })
    setShowEditDialog(true)
  }

  const handleUpdatePreAssessment = async () => {
    if (!selectedPreAssessment) return

    if (!editForm.title.trim() || !editForm.program || !editForm.year_level || 
        !editForm.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      console.log('Updating pre-assessment with data:', editForm)
      
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pre-assessments/${selectedPreAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error response:', errorData)
        throw new Error(errorData.error || 'Failed to update pre-assessment')
      }

      toast({
        title: "Success",
        description: "Pre-assessment updated successfully",
        variant: "default"
      })

      setShowEditDialog(false)
      setSelectedPreAssessment(null)
      refetch()
    } catch (error) {
      console.error('Error updating pre-assessment:', error)
      toast({
        title: "Error",
        description: "Failed to update pre-assessment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete pre-assessment
  const handleDeletePreAssessment = (preAssessment: PreAssessment) => {
    setSelectedPreAssessment(preAssessment)
    setShowDeleteDialog(true)
  }

  const confirmDeletePreAssessment = async () => {
    if (!selectedPreAssessment) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pre-assessments/${selectedPreAssessment.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete pre-assessment')

      toast({
        title: "Success",
        description: "Pre-assessment deleted successfully",
        variant: "destructive"
      })

      setShowDeleteDialog(false)
      setSelectedPreAssessment(null)
      refetch()
    } catch (error) {
      console.error('Error deleting pre-assessment:', error)
      toast({
        title: "Error",
        description: "Failed to delete pre-assessment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Question management handlers
  const handleManageQuestions = async (preAssessment: PreAssessment) => {
    setSelectedPreAssessment(preAssessment)
    await fetchQuestions(preAssessment.id)
    setShowQuestionManagerDialog(true)
  }

  const fetchQuestions = async (preAssessmentId: number) => {
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pre-assessment-questions/pre-assessment/${preAssessmentId}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      
      // Map database fields to frontend interface
      const mappedQuestions = (data.questions || []).map((q: any) => ({
        id: q.id,
        type: q.question_type,
        question: q.question,
        options: q.options && typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        subject_id: q.subject_id,
        subject_name: q.subject_name,
        subject_code: q.subject_code
      }))
      
      console.log('Fetched and mapped questions:', mappedQuestions)
      setQuestions(mappedQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      })
    }
  }

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setQuestionForm({
      type: "multiple-choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      points: 1,
      subjectId: ""
    })
    console.log('Opening add question dialog. Available subjects:', getQuestionSubjects())
    setShowQuestionDialog(true)
  }

  const handleEditQuestion = (question: Question) => {
    console.log('Editing question:', question)
    setEditingQuestion(question)
    
    // Handle options properly for multiple-choice questions
    let optionsToUse = ["", "", "", ""]
    if (question.type === "multiple-choice" && question.options && question.options.length > 0) {
      optionsToUse = [...question.options]
      // Ensure we have at least 4 options for the form
      while (optionsToUse.length < 4) {
        optionsToUse.push("")
      }
    }
    
    setQuestionForm({
      type: question.type,
      question: question.question,
      options: optionsToUse,
      correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer,
      explanation: question.explanation || "",
      points: question.points,
      subjectId: question.subject_id?.toString() || ""
    })
    console.log('Question form set to:', {
      type: question.type,
      question: question.question,
      options: optionsToUse,
      correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer,
      explanation: question.explanation || "",
      points: question.points,
      subjectId: question.subject_id?.toString() || ""
    })
    setShowQuestionDialog(true)
  }

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || !questionForm.correctAnswer.trim() || !questionForm.subjectId) {
      toast({
        title: "Validation Error",
        description: "Question, correct answer, and subject are required.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const parsedSubjectId = parseInt(questionForm.subjectId)
      if (isNaN(parsedSubjectId)) {
        toast({
          title: "Validation Error",
          description: "Please select a valid subject.",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }
      
      const questionData = {
        pre_assessment_id: selectedPreAssessment?.id,
        question_type: questionForm.type,
        question: questionForm.question,
        options: questionForm.type === "multiple-choice" ? questionForm.options.filter(option => option.trim()) : null,
        correct_answer: questionForm.correctAnswer,
        explanation: questionForm.explanation,
        points: questionForm.points,
        subject_id: parsedSubjectId
      }

      console.log('Question data being sent:', questionData)

      const url = editingQuestion 
        ? `https://api.cictpeerlearninghub.com/api/pre-assessment-questions/${editingQuestion.id}`
        : 'https://api.cictpeerlearninghub.com/api/pre-assessment-questions'
      
      const method = editingQuestion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      })

      if (!response.ok) throw new Error('Failed to save question')

      toast({
        title: "Success",
        description: `Question ${editingQuestion ? 'updated' : 'created'} successfully`,
        variant: "default"
      })

      setShowQuestionDialog(false)
      if (selectedPreAssessment) {
        await fetchQuestions(selectedPreAssessment.id)
      }
    } catch (error) {
      console.error('Error saving question:', error)
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pre-assessment-questions/${questionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete question')

      toast({
        title: "Success",
        description: "Question deleted successfully",
        variant: "default"
      })

      if (selectedPreAssessment) {
        await fetchQuestions(selectedPreAssessment.id)
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Student-specific handlers
  const handleStartAssessment = (assessment: PreAssessment) => {
    if (!assessment.program || !assessment.year_level) {
      toast({
        title: "Selection Error",
        description: "Selected pre-assessment is missing program or year level information.",
        variant: "destructive"
      })
      return
    }
    setSelectedPreAssessment(assessment)
    setShowStartDialog(true)
  }

  const handleConfirmStart = async () => {
    if (!selectedPreAssessment) return

    try {
      setIsLoadingQuestions(true)
      setShowStartDialog(false)

      // Fetch questions
      const questionsResponse = await fetch(`https://api.cictpeerlearninghub.com/api/pre-assessment-questions/pre-assessment/${selectedPreAssessment.id}`)
      if (!questionsResponse.ok) throw new Error('Failed to fetch questions')
      const questionsData = await questionsResponse.json()

      // Transform questions data - parse options if they are JSON strings
      const transformedQuestions = (questionsData.questions || []).map((q: any) => ({
        ...q,
        options: q.options && typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }))
      
      // Shuffle questions for randomization
      const shuffleArray = (array: any[]) => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      }
      
      const shuffledQuestions = shuffleArray(transformedQuestions)
      
      setQuestions(shuffledQuestions)
      
      // Initialize answers array
      const initialAnswers = shuffledQuestions.map((q: Question) => ({
        questionId: q.id,
        answer: ""
      }))
      setAnswers(initialAnswers)
      setCurrentQuestionIndex(0)

      // Set timer (convert to seconds)
      const durationInSeconds = selectedPreAssessment.duration_unit === 'hours' 
        ? selectedPreAssessment.duration * 3600
        : selectedPreAssessment.duration * 60
      setTimeLeft(durationInSeconds)

      setShowAssessmentModal(true)
    } catch (error) {
      console.error('Error starting assessment:', error)
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // Student assessment handlers
  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => prev.map(a => 
      a.questionId === questionId ? { ...a, answer } : a
    ))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitStudentAssessment = async () => {
    setIsSubmitting(true)
    try {
      // Calculate score
      let correctAnswers = 0
      let totalScore = 0
      
      // Format answers with detailed information including is_correct and subject_id
      const formattedAnswers = answers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId)
        if (!question) return null
        
        const correctAnswer = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer[0] 
          : question.correctAnswer
        
        const isCorrect = answer.answer && 
          answer.answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
        
        if (isCorrect) {
          correctAnswers++
          totalScore += question.points || 1
        }
        
        return {
          question_id: answer.questionId,
          question_text: question.question,
          question: question.question,
          user_answer: answer.answer,
          selected_answer: answer.answer,
          correct_answer: correctAnswer,
          is_correct: isCorrect,
          subject_id: question.subject_id || null,
          subject_name: question.subject_name || '',
          explanation: question.explanation || '',
          points: question.points || 1
        }
      }).filter(Boolean)
      
      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0)
      const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0
      const timeTaken = timeLeft > 0 
        ? (selectedPreAssessment!.duration * (selectedPreAssessment!.duration_unit === 'hours' ? 3600 : 60)) - timeLeft 
        : selectedPreAssessment!.duration * (selectedPreAssessment!.duration_unit === 'hours' ? 3600 : 60)

      console.log('📊 Submitting Pre-Assessment from pre-assessments page:', {
        totalQuestions: questions.length,
        correctAnswers: correctAnswers,
        totalScore: totalScore,
        totalPoints: totalPoints,
        percentage: percentage,
        answersCount: formattedAnswers.length
      })
      console.log('📝 Sample formatted answer:', formattedAnswers[0])

      const submissionData = {
        pre_assessment_id: selectedPreAssessment!.id,
        user_id: currentUser?.user_id,
        score: totalScore,
        total_points: totalPoints,
        correct_answers: correctAnswers,
        total_questions: questions.length,
        time_taken_seconds: timeTaken,
        started_at: new Date(Date.now() - (timeTaken * 1000)).toISOString(),
        answers: formattedAnswers
      }

      const response = await fetch('https://api.cictpeerlearninghub.com/api/pre-assessment-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) throw new Error('Failed to submit assessment')

      toast({
        title: "Assessment Completed!",
        description: "Your answers have been recorded successfully.",
        variant: "default"
      })

      setShowAssessmentModal(false)
      
      // Refresh results and guard status
      if (isRequired) {
        await checkPreAssessmentStatus()
        router.push('/dashboard')
      } else {
        fetchStudentResults()
      }

    } catch (error) {
      console.error('Error submitting assessment:', error)
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    return answers.filter(a => a.answer.trim() !== "").length
  }

  const hasCompletedAssessment = (assessmentId: number) => {
    return studentResults.some(result => result.pre_assessment_id === assessmentId)
  }

  const getStudentAvailableAssessments = () => {
    if (!currentUser || !isStudent) return []
    
    return preAssessments.filter(assessment => {
      // Filter by student's program and year level
      const matchesProgram = assessment.program === currentUser.program
      const matchesYearLevel = assessment.year_level === currentUser.year_level
      const isActive = assessment.status === 'active'
      
      return matchesProgram && matchesYearLevel && isActive
    })
  }

  // Filter pre-assessments
  const filteredPreAssessments = isStudent 
    ? getStudentAvailableAssessments().filter(assessment => {
        const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assessment.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
      })
    : preAssessments.filter(assessment => {
        const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assessment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assessment.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assessment.year_level.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesProgram = programFilter === "all" || assessment.program === programFilter

        return matchesSearch && matchesProgram
      })

  // Access denied for non-admin and non-student users
  if (currentUser && !isAdmin && !isStudent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading pre-assessments...</p>
        </div>
      </div>
    )
  }

  // Student View
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {isRequired && (
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            <h1 className="text-3xl font-bold text-foreground">
              {isRequired ? 'Required Pre-Assessment' : 'Available Pre-Assessments'}
            </h1>
            <p className="text-muted-foreground">
              {isRequired 
                ? 'Complete a pre-assessment to access your dashboard'
                : 'Take pre-assessments to evaluate your knowledge level'
              }
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search assessments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          )}
        </div>

        {/* Assessments Grid */}
        <div className={`grid gap-6 ${
          filteredPreAssessments.length === 1 
            ? 'max-w-2xl mx-auto' 
            : 'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredPreAssessments.map((assessment) => {
            const isCompleted = hasCompletedAssessment(assessment.id)
            
            return (
              <Card 
                key={assessment.id} 
                className={`hover:shadow-lg transition-all duration-200 border-2 ${
                  isCompleted ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'hover:border-blue-200'
                } ${
                  filteredPreAssessments.length === 1 ? 'p-2' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className={`${
                          filteredPreAssessments.length === 1 ? 'text-2xl' : 'text-lg'
                        }`}>
                          {assessment.title}
                        </CardTitle>
                        {isCompleted && (
                          <Badge variant="default" className="bg-green-600">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardDescription className={`${
                        filteredPreAssessments.length === 1 ? 'text-base' : 'text-sm'
                      } mt-1`}>
                        {assessment.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={assessment.difficulty === 'Easy' ? 'default' : assessment.difficulty === 'Medium' ? 'secondary' : 'destructive'}
                    >
                      {assessment.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`grid gap-4 ${
                    filteredPreAssessments.length === 1 ? 'grid-cols-4 text-base' : 'grid-cols-2 text-sm'
                  }`}>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className={`mr-2 ${
                        filteredPreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                      }`} />
                      {assessment.duration} {assessment.duration_unit}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <BookOpen className={`mr-2 ${
                        filteredPreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                      }`} />
                      {assessment.question_count || 'N/A'} questions
                    </div>
                    {filteredPreAssessments.length === 1 && (
                      <>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Target className="w-5 h-5 mr-2" />
                          {assessment.difficulty} Level
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Users className="w-5 h-5 mr-2" />
                          {assessment.program}
                        </div>
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleStartAssessment(assessment)}
                    disabled={isCompleted}
                    className={`w-full ${
                      filteredPreAssessments.length === 1 ? 'h-12 text-lg' : ''
                    }`}
                    variant={isCompleted ? "secondary" : "default"}
                  >
                    {isCompleted ? (
                      <>
                        <Trophy className={`mr-2 ${
                          filteredPreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                        }`} />
                        Completed
                      </>
                    ) : (
                      <>
                        <Play className={`mr-2 ${
                          filteredPreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                        }`} />
                        {isRequired ? 'Start Required Assessment' : 'Take Assessment'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State for Students */}
        {filteredPreAssessments.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchQuery ? "No assessments found" : "No assessments available"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search terms."
                : "No pre-assessments are currently available for your program and year level."
              }
            </p>
            {isRequired && (
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Skip for Now
              </Button>
            )}
          </div>
        )}

        {/* Start Assessment Dialog */}
        <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Pre-Assessment</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  {selectedPreAssessment && (
                    <div className="space-y-3">
                      <div>You are about to start: <strong>{selectedPreAssessment.title}</strong></div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• Duration: {selectedPreAssessment.duration} {selectedPreAssessment.duration_unit}</div>
                        <div>• Questions: {selectedPreAssessment.question_count || 'Multiple'}</div>
                        <div>• Difficulty: {selectedPreAssessment.difficulty}</div>
                      </div>
                      <div className="text-sm font-medium text-orange-600">
                        ⚠️ The timer will start immediately and cannot be paused.
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmStart} disabled={isLoadingQuestions}>
                {isLoadingQuestions ? "Loading..." : "Start Assessment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assessment Modal */}
        <Dialog open={showAssessmentModal} onOpenChange={() => {}}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedPreAssessment?.title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </DialogDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      <Clock className="w-5 h-5 mr-2" />
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getAnsweredCount()} / {questions.length} answered
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
              </div>

              {/* Question Content */}
              {questions.length > 0 && (
                <div className="flex-1 overflow-y-auto p-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                          Question {currentQuestionIndex + 1}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          {questions[currentQuestionIndex]?.subject_code && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded">
                              {questions[currentQuestionIndex].subject_code}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded">
                            {questions[currentQuestionIndex]?.points} point{questions[currentQuestionIndex]?.points !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <CardDescription className="text-base mt-2">
                        {questions[currentQuestionIndex]?.question}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Multiple Choice */}
                      {questions[currentQuestionIndex]?.type === "multiple-choice" && questions[currentQuestionIndex]?.options && (
                        <RadioGroup 
                          value={answers[currentQuestionIndex]?.answer || ""} 
                          onValueChange={(value) => handleAnswerChange(questions[currentQuestionIndex].id, value)}
                        >
                          {questions[currentQuestionIndex].options!.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                {String.fromCharCode(65 + index)}. {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {/* True/False */}
                      {questions[currentQuestionIndex]?.type === "true-false" && (
                        <RadioGroup 
                          value={answers[currentQuestionIndex]?.answer || ""} 
                          onValueChange={(value) => handleAnswerChange(questions[currentQuestionIndex].id, value)}
                        >
                          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <RadioGroupItem value="True" id="true" />
                            <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <RadioGroupItem value="False" id="false" />
                            <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                          </div>
                        </RadioGroup>
                      )}

                      {/* Essay or Enumeration */}
                      {(questions[currentQuestionIndex]?.type === "essay" || questions[currentQuestionIndex]?.type === "enumeration") && (
                        <Textarea
                          value={answers[currentQuestionIndex]?.answer || ""}
                          onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                          placeholder={questions[currentQuestionIndex]?.type === "enumeration" 
                            ? "Enter your answers separated by commas..."
                            : "Enter your answer here..."
                          }
                          rows={questions[currentQuestionIndex]?.type === "essay" ? 6 : 3}
                          className="w-full"
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation */}
              <div className="bg-white dark:bg-gray-800 p-6 border-t">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex space-x-2">
                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button 
                        onClick={handleSubmitStudentAssessment}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Assessment
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button onClick={handleNextQuestion}>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Admin View (existing code)

  // Admin View (existing code)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pre-Assessment Management</h1>
          <p className="text-muted-foreground">Manage pre-assessment tests for student evaluation</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Pre-Assessment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search pre-assessments by title, description, or subject..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-64">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {CICT_PROGRAMS.map((program) => (
                <SelectItem key={program} value={program}>
                  {program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || (programFilter && programFilter !== "all")) && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setSearchQuery("")
              setProgramFilter("all")
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Pre-assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPreAssessments.map((assessment) => (
          <Card key={assessment.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-xl">{assessment.title}</CardTitle>
                    <Badge 
                      variant={assessment.status === "active" ? "default" : "secondary"}
                    >
                      {assessment.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-base mt-1">
                    {assessment.program} - {assessment.year_level}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{assessment.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Program</Label>
                  <p className="text-sm text-muted-foreground mt-1">{assessment.program || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year Level</Label>
                  <p className="text-sm text-muted-foreground mt-1">{assessment.year_level || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assessment.duration} {assessment.duration_unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Difficulty</Label>
                  <Badge variant="outline" className="text-xs">
                    {assessment.difficulty}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Questions</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {assessment.question_count || 0} questions
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button size="sm" variant="outline" onClick={() => handleManageQuestions(assessment)}>
                  <Brain className="w-4 h-4 mr-1" /> Manage Questions
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditPreAssessment(assessment)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDeletePreAssessment(assessment)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPreAssessments.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {(searchQuery || (programFilter && programFilter !== "all")) ? "No pre-assessments found" : "No pre-assessments created yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {(searchQuery || (programFilter && programFilter !== "all")) 
              ? "Try adjusting your search terms or filters to find pre-assessments."
              : "Create your first pre-assessment to start evaluating students."
            }
          </p>
          {(!searchQuery && (!programFilter || programFilter === "all")) && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Pre-Assessment
            </Button>
          )}
        </div>
      )}

      {/* Create Pre-Assessment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Pre-Assessment</DialogTitle>
            <DialogDescription>
              Create a new pre-assessment test for student evaluation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter assessment title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Program *</Label>
              <Select value={createForm.program} onValueChange={(value) => {
                setCreateForm({ ...createForm, program: value, year_level: "" })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {CICT_PROGRAMS.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_level">Year Level *</Label>
              <Select 
                value={createForm.year_level} 
                onValueChange={(value) => setCreateForm({ ...createForm, year_level: value })}
                disabled={!createForm.program}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={createForm.duration}
                  onChange={(e) => setCreateForm({ ...createForm, duration: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_unit">Duration Unit</Label>
                <Select value={createForm.duration_unit} onValueChange={(value) => setCreateForm({ ...createForm, duration_unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={createForm.difficulty} onValueChange={(value) => setCreateForm({ ...createForm, difficulty: value as "Easy" | "Medium" | "Hard" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter assessment description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePreAssessment} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Pre-Assessment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Pre-Assessment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pre-Assessment</DialogTitle>
            <DialogDescription>
              Update pre-assessment information
            </DialogDescription>
          </DialogHeader>
          {selectedPreAssessment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-program">Program *</Label>
                <Select value={editForm.program} onValueChange={(value) => {
                  setEditForm({ ...editForm, program: value, year_level: "" })
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CICT_PROGRAMS.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-year_level">Year Level *</Label>
                <Select 
                  value={editForm.year_level} 
                  onValueChange={(value) => setEditForm({ ...editForm, year_level: value })}
                  disabled={!editForm.program}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="1"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration_unit">Duration Unit</Label>
                  <Select value={editForm.duration_unit} onValueChange={(value) => setEditForm({ ...editForm, duration_unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select value={editForm.difficulty} onValueChange={(value) => setEditForm({ ...editForm, difficulty: value as "Easy" | "Medium" | "Hard" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePreAssessment} disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Pre-Assessment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pre-Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPreAssessment?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePreAssessment} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Manager Dialog */}
      <Dialog open={showQuestionManagerDialog} onOpenChange={setShowQuestionManagerDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions - {selectedPreAssessment?.title}</DialogTitle>
            <DialogDescription>
              Add, edit, or remove questions for this pre-assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} total
                </p>
                {questions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Subjects included:</span>
                    {Array.from(new Set(questions
                      .filter(q => q.subject_name && q.subject_code)
                      .map(q => q.subject_code)
                    )).sort().map((subjectCode) => {
                      const subject = questions.find(q => q.subject_code === subjectCode);
                      return subject ? (
                        <Badge key={subjectCode} variant="outline" className="text-xs">
                          {subject.subject_code} - {subject.subject_name}
                        </Badge>
                      ) : null;
                    })}
                    {questions.some(q => !q.subject_name) && (
                      <Badge variant="destructive" className="text-xs">
                        Some questions missing subject
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Button onClick={handleAddQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
            
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No questions added yet</p>
                <Button variant="outline" onClick={handleAddQuestion} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{question.type}</Badge>
                            <Badge variant="secondary">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
                            {question.subject_name && (
                              <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                {question.subject_code} - {question.subject_name}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium mb-2">Q{index + 1}: {question.question}</p>
                          {question.type === "multiple-choice" && question.options && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className={`pl-4 ${option === question.correctAnswer ? 'text-green-600 font-medium' : ''}`}>
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                  {option === question.correctAnswer && ' ✓'}
                                </div>
                              ))}
                            </div>
                          )}
                          {question.type !== "multiple-choice" && (
                            <p className="text-sm text-green-600">
                              <strong>Answer:</strong> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer}
                            </p>
                          )}
                          {question.explanation && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(question)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(question.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Update the question details' : 'Create a new question for this pre-assessment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-type">Question Type</Label>
              <Select value={questionForm.type} onValueChange={(value: QuestionType) => setQuestionForm({ ...questionForm, type: value })}>
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
              <Label htmlFor="question-subject">Subject *</Label>
              <Select 
                value={questionForm.subjectId} 
                onValueChange={(value) => {
                  console.log('Subject selected:', value)
                  setQuestionForm({ ...questionForm, subjectId: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject for this question" />
                </SelectTrigger>
                <SelectContent>
                  {getQuestionSubjects().map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                      {subject.subject_code} - {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="question-text">Question *</Label>
              <Textarea
                id="question-text"
                rows={3}
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="Enter your question here..."
              />
            </div>

            {questionForm.type === "multiple-choice" && (
              <div className="space-y-2">
                <Label>Answer Options</Label>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">{String.fromCharCode(65 + index)}.</span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options]
                        newOptions[index] = e.target.value
                        setQuestionForm({ ...questionForm, options: newOptions })
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="correct-answer">Correct Answer *</Label>
              {questionForm.type === "multiple-choice" ? (
                <Select value={questionForm.correctAnswer} onValueChange={(value) => setQuestionForm({ ...questionForm, correctAnswer: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionForm.options.map((option, index) => (
                      option.trim() && (
                        <SelectItem key={index} value={option}>
                          {String.fromCharCode(65 + index)}. {option}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              ) : questionForm.type === "true-false" ? (
                <Select value={questionForm.correctAnswer} onValueChange={(value) => setQuestionForm({ ...questionForm, correctAnswer: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  id="correct-answer"
                  rows={2}
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  placeholder={questionForm.type === "enumeration" ? "Enter correct answers separated by commas" : "Enter the correct answer"}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                rows={2}
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Provide an explanation for the answer..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="10"
                value={questionForm.points}
                onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={isSubmitting} className="ml-2">
              {isSubmitting ? "Saving..." : (editingQuestion ? "Update Question" : "Add Question")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}