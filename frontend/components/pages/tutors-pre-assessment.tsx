"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"
import Layout from "@/components/dashboard/layout"
import { apiUrl } from "@/lib/api-config"
// Icons
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Target,
  Clock,
  Users,
  Brain,
  GraduationCap,
  Filter,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Timer,
  BookOpen
} from "lucide-react"

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubjects } from "@/hooks/use-subjects"
import { CICT_PROGRAMS } from "@/lib/constants"

// Interfaces
type QuestionType = "multiple-choice" | "true-false" | "short-answer" | "essay"

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

interface TutorPreAssessment {
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
  subject_id?: number
  created_at?: string
  question_count?: number
}

export default function TutorsPreAssessment() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, refetch: refetchSubjects } = useSubjects()

  // State
  const [preAssessments, setPreAssessments] = useState<TutorPreAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPreAssessment, setSelectedPreAssessment] = useState<TutorPreAssessment | null>(null)

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showQuestionManagerDialog, setShowQuestionManagerDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({
    title: "",
    program: "",
    year_level: "",
    subject_id: 0,
    description: "",
    duration: 0,
    duration_unit: "minutes",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard"
  })

  const [editForm, setEditForm] = useState({
    title: "",
    program: "",
    year_level: "",
    subject_id: 0,
    description: "",
    duration: 0,
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

  // Filter subjects for faculty (only show subjects assigned to current faculty)
  const facultySubjects = subjects.filter(subject => {
    if (!currentUser?.user_id) return false
    
    // Check if current user is assigned to this subject
    const assignedFaculty = (subject as any).faculty_ids || []
    return assignedFaculty.some((fid: string) => String(fid) === String(currentUser.user_id))
  })

  // Filter subjects based on selected year level for create form
  const createFormSubjects = facultySubjects.filter(subject => {
    if (!createForm.year_level) return true // Show all if no year level selected
    
    // Check if subject year level matches selected year level
    if (subject.year_level) {
      // Handle both string and array formats
      const subjectYearLevels = Array.isArray(subject.year_level) 
        ? subject.year_level 
        : [subject.year_level]
      return subjectYearLevels.includes(createForm.year_level)
    }
    
    return true // Show all subjects if no year level specified in subject
  })

  // Filter subjects based on selected year level for edit form
  const editFormSubjects = facultySubjects.filter(subject => {
    if (!editForm.year_level) return true // Show all if no year level selected
    
    // Check if subject year level matches selected year level
    if (subject.year_level) {
      // Handle both string and array formats
      const subjectYearLevels = Array.isArray(subject.year_level) 
        ? subject.year_level 
        : [subject.year_level]
      return subjectYearLevels.includes(editForm.year_level)
    }
    
    return true // Show all subjects if no year level specified in subject
  })

  // Fetch tutors pre-assessments
  const fetchPreAssessments = async () => {
    try {
      setLoading(true)
      // For faculty, only show pre-assessments they created for tutor evaluation
      const response = await fetch(`apiUrl/api/tutor-pre-assessments?created_by=${currentUser?.user_id}`)
      
      if (!response.ok) throw new Error('Failed to fetch tutors pre-assessments')
      const data = await response.json()
      setPreAssessments(data.preAssessments || [])
    } catch (error) {
      console.error('Error fetching tutors pre-assessments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch tutors pre-assessments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.user_id) {
      fetchPreAssessments()
    }
  }, [currentUser])

  // Create pre-assessment
  const handleCreatePreAssessment = async () => {
    if (!createForm.title.trim() || !createForm.program || !createForm.year_level || 
        !createForm.description.trim() || !createForm.subject_id || createForm.subject_id === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including subject.",
        variant: "destructive"
      })
      return
    }

    if (!createForm.duration || createForm.duration < 1) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid duration (minimum 1).",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const requestBody = {
        ...createForm,
        created_by: currentUser?.user_id,
        assessment_type: 'tutor' // Mark this as a tutor pre-assessment
      }
      
      const response = await fetch('apiUrl/api/tutor-pre-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tutor pre-assessment')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Tutor pre-assessment created successfully",
      })

      setShowCreateDialog(false)
      setCreateForm({
        title: "",
        program: "",
        year_level: "",
        subject_id: 0,
        description: "",
        duration: 0,
        duration_unit: "minutes",
        difficulty: "Medium"
      })
      fetchPreAssessments()
    } catch (error) {
      console.error('Error creating tutor pre-assessment:', error)
      toast({
        title: "Error",
        description: "Failed to create tutor pre-assessment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit pre-assessment
  const handleEditPreAssessment = (assessment: TutorPreAssessment) => {
    setSelectedPreAssessment(assessment)
    setEditForm({
      title: assessment.title || "",
      program: assessment.program || "",
      year_level: assessment.year_level || "",
      subject_id: assessment.subject_id || 0,
      description: assessment.description || "",
      duration: typeof assessment.duration === 'number' && !isNaN(assessment.duration) && assessment.duration > 0 ? assessment.duration : 0,
      duration_unit: assessment.duration_unit || "minutes",
      difficulty: assessment.difficulty || "Medium"
    })
    setShowEditDialog(true)
  }

  const handleUpdatePreAssessment = async () => {
    if (!selectedPreAssessment) return

    if (!editForm.title.trim() || !editForm.program || !editForm.year_level || 
        !editForm.description.trim() || !editForm.subject_id || editForm.subject_id === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including subject.",
        variant: "destructive"
      })
      return
    }

    if (!editForm.duration || editForm.duration < 1) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid duration (minimum 1).",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`apiUrl/api/tutor-pre-assessments/${selectedPreAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Failed to update tutor pre-assessment')

      toast({
        title: "Success",
        description: "Tutor pre-assessment updated successfully"
      })

      setShowEditDialog(false)
      setSelectedPreAssessment(null)
      fetchPreAssessments()
    } catch (error) {
      console.error('Error updating tutor pre-assessment:', error)
      toast({
        title: "Error",
        description: "Failed to update tutor pre-assessment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete pre-assessment
  const handleDeletePreAssessment = (assessment: TutorPreAssessment) => {
    setSelectedPreAssessment(assessment)
    setShowDeleteDialog(true)
  }

  const confirmDeletePreAssessment = async () => {
    if (!selectedPreAssessment) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`apiUrl/api/tutor-pre-assessments/${selectedPreAssessment.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete tutor pre-assessment')

      toast({
        title: "Success",
        description: "Tutor pre-assessment deleted successfully",
        variant: "destructive"
      })

      setShowDeleteDialog(false)
      setSelectedPreAssessment(null)
      fetchPreAssessments()
    } catch (error) {
      console.error('Error deleting tutor pre-assessment:', error)
      toast({
        title: "Error",
        description: "Failed to delete tutor pre-assessment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Question management
  const handleManageQuestions = async (preAssessment: TutorPreAssessment) => {
    setSelectedPreAssessment(preAssessment)
    await fetchQuestions(preAssessment.id)
    setShowQuestionManagerDialog(true)
  }

  const fetchQuestions = async (preAssessmentId: number) => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`apiUrl/api/tutor-pre-assessment-questions/pre-assessment/${preAssessmentId}?t=${timestamp}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      
      // Map database fields to frontend interface
      const mappedQuestions = (data.questions || []).map((q: any) => ({
        id: q.id,
        type: q.question_type,
        question: q.question, // Map from database field
        options: q.options && typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        subject_id: q.subject_id,
        subject_name: q.subject_name,
        subject_code: q.subject_code
      }))
      
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
      subjectId: selectedPreAssessment?.subject_id ? selectedPreAssessment.subject_id.toString() : ""
    })
    setShowQuestionDialog(true)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setQuestionForm({
      type: question.type || "multiple-choice",
      question: question.question || "",
      options: question.options || ["", "", "", ""],
      correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : (question.correctAnswer || ""),
      explanation: question.explanation || "",
      points: typeof question.points === 'number' && !isNaN(question.points) ? question.points : 1,
      subjectId: String(question.subject_id || "")
    })
    setShowQuestionDialog(true)
  }

  const handleSaveQuestion = async () => {
    if (!selectedPreAssessment) return

    if (!questionForm.question.trim() || !questionForm.correctAnswer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the question and correct answer",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const requestData = {
        pre_assessment_id: selectedPreAssessment.id,
        question_type: questionForm.type,
        question: questionForm.question,
        options: questionForm.type === "multiple-choice" ? questionForm.options : null,
        correct_answer: questionForm.correctAnswer,
        explanation: questionForm.explanation,
        points: questionForm.points,
        subject_id: questionForm.subjectId ? parseInt(questionForm.subjectId) : null
      }

      let response
      if (editingQuestion) {
        response = await fetch(`apiUrl/api/tutor-pre-assessment-questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })
      } else {
        response = await fetch('apiUrl/api/tutor-pre-assessment-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })
      }

      if (!response.ok) throw new Error('Failed to save question')

      toast({
        title: "Success",
        description: editingQuestion ? "Question updated successfully" : "Question created successfully"
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
      const response = await fetch(`apiUrl/api/tutor-pre-assessment-questions/${questionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete question')

      toast({
        title: "Success",
        description: "Question deleted successfully"
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

  // Filter assessments
  const filteredPreAssessments = preAssessments.filter((assessment) => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProgram = selectedProgram === "all" || assessment.program === selectedProgram
    const matchesDifficulty = selectedDifficulty === "all" || assessment.difficulty === selectedDifficulty
    
    return matchesSearch && matchesProgram && matchesDifficulty
  })

  if (!currentUser || currentUser.role?.toLowerCase() !== 'faculty') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Only faculty members can access this page.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tutors Pre-Assessment</h1>
            <p className="text-muted-foreground">Create and manage pre-assessment tests for tutor applicants</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Assessment
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search assessments..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-full sm:w-[280px]">
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
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tutor assessments...</p>
            </div>
          </div>
        )}

        {/* Assessments Grid */}
        {!loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPreAssessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{assessment.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={assessment.status === 'active' ? 'default' : 'secondary'}>
                          {assessment.status}
                        </Badge>
                        <Badge variant="outline">
                          {assessment.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {assessment.program}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {assessment.year_level}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Timer className="w-4 h-4 mr-2" />
                      {assessment.duration} {assessment.duration_unit}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Brain className="w-4 h-4 mr-2" />
                      {assessment.question_count || 0} questions
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
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
        )}

        {/* Empty State */}
        {!loading && filteredPreAssessments.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {preAssessments.length === 0 ? "No Tutor Assessments Yet" : "No Matching Assessments"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {preAssessments.length === 0 
                ? "Create your first pre-assessment for tutor applicants to get started."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {preAssessments.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Assessment
              </Button>
            )}
          </div>
        )}

        {/* Create Assessment Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tutor Pre-Assessment</DialogTitle>
              <DialogDescription>
                Create a pre-assessment test for students applying to become tutors.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Assessment Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Programming Fundamentals Assessment"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={createForm.subject_id ? createForm.subject_id.toString() : ""} onValueChange={(value) => setCreateForm({ ...createForm, subject_id: parseInt(value) || 0 })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {createFormSubjects && createFormSubjects.length > 0 ? (
                      createFormSubjects.map((subject) => (
                        subject && subject.subject_id ? (
                          <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                            {subject.subject_name || 'Unknown Subject'} ({subject.subject_code || 'N/A'})
                          </SelectItem>
                        ) : null
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No subjects available for selected year level
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Select value={createForm.program} onValueChange={(value) => setCreateForm({ ...createForm, program: value })}>
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
                <div>
                  <Label htmlFor="year_level">Year Level</Label>
                  <Select value={createForm.year_level} onValueChange={(value) => setCreateForm({ ...createForm, year_level: value })}>
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
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and content of this assessment..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="Enter duration (e.g., 30, 60, 120)"
                    value={createForm.duration?.toString() || ""}
                    onChange={(e) => setCreateForm({ ...createForm, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration_unit">Unit</Label>
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
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={createForm.difficulty} onValueChange={(value: "Easy" | "Medium" | "Hard") => setCreateForm({ ...createForm, difficulty: value })}>
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePreAssessment} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Assessment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Assessment Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Tutor Pre-Assessment</DialogTitle>
              <DialogDescription>
                Update the tutor pre-assessment details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Assessment Title</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Programming Fundamentals Assessment"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-subject">Subject</Label>
                <Select value={editForm.subject_id ? editForm.subject_id.toString() : ""} onValueChange={(value) => setEditForm({ ...editForm, subject_id: parseInt(value) || 0 })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {editFormSubjects && editFormSubjects.length > 0 ? (
                      editFormSubjects.map((subject) => (
                        subject && subject.subject_id ? (
                          <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                            {subject.subject_name || 'Unknown Subject'} ({subject.subject_code || 'N/A'})
                          </SelectItem>
                        ) : null
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No subjects available for selected year level
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-program">Program</Label>
                  <Select value={editForm.program} onValueChange={(value) => setEditForm({ ...editForm, program: value })}>
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
                <div>
                  <Label htmlFor="edit-year_level">Year Level</Label>
                  <Select value={editForm.year_level} onValueChange={(value) => setEditForm({ ...editForm, year_level: value })}>
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
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe the purpose and content of this assessment..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="1"
                    placeholder="Enter duration (e.g., 30, 60, 120)"
                    value={editForm.duration?.toString() || ""}
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duration_unit">Unit</Label>
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
                <div>
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <Select value={editForm.difficulty} onValueChange={(value: "Easy" | "Medium" | "Hard") => setEditForm({ ...editForm, difficulty: value })}>
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePreAssessment} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Assessment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tutor Pre-Assessment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedPreAssessment?.title}"? This action cannot be undone
                and will also delete all associated questions.
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
                Add, edit, or remove questions for this tutor pre-assessment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} total
                  </p>
                </div>
                <Button onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            Question {index + 1}
                          </Badge>
                          <Badge variant="secondary">
                            {question.type}
                          </Badge>
                          <Badge variant="outline">
                            {question.points} point{question.points !== 1 ? 's' : ''}
                          </Badge>
                          {question.subject_name && (
                            <Badge variant="outline">
                              {question.subject_name}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium mb-2">{question.question}</p>
                        {question.options && (
                          <div className="text-sm text-muted-foreground">
                            Options: {question.options.filter(Boolean).join(', ')}
                          </div>
                        )}
                        <div className="text-sm text-green-600 mt-1">
                          <strong>Answer:</strong> {question.correctAnswer}
                        </div>
                        {question.explanation && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditQuestion(question)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteQuestion(question.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {questions.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No questions added yet.</p>
                  <Button className="mt-4" onClick={handleAddQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Question
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Question Dialog */}
        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update the question details' : 'Create a new question for this tutor pre-assessment'}
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
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-subject">Subject (Optional)</Label>
                <Popover open={questionSubjectComboboxOpen} onOpenChange={setQuestionSubjectComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={questionSubjectComboboxOpen}
                      className="w-full justify-between"
                    >
                      {questionForm.subjectId ? (
                        (() => {
                          const subject = facultySubjects.find(s => String(s.subject_id) === questionForm.subjectId);
                          return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : questionForm.subjectId;
                        })()
                      ) : (
                        "Select subject (optional)"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search subjects..."
                        value={questionSubjectSearchValue}
                        onValueChange={setQuestionSubjectSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No subjects found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setQuestionForm({ ...questionForm, subjectId: "" });
                              setQuestionSubjectComboboxOpen(false);
                              setQuestionSubjectSearchValue("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                questionForm.subjectId === "" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            No subject
                          </CommandItem>
                          {facultySubjects
                            .filter(subject => 
                              subject.subject_name.toLowerCase().includes(questionSubjectSearchValue.toLowerCase()) ||
                              (subject.subject_code && subject.subject_code.toLowerCase().includes(questionSubjectSearchValue.toLowerCase()))
                            )
                            .map((subject) => (
                              <CommandItem
                                key={subject.subject_id}
                                value={String(subject.subject_id)}
                                onSelect={() => {
                                  setQuestionForm({ ...questionForm, subjectId: String(subject.subject_id) });
                                  setQuestionSubjectComboboxOpen(false);
                                  setQuestionSubjectSearchValue("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    questionForm.subjectId === String(subject.subject_id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-text">Question</Label>
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
                <Label htmlFor="correct-answer">Correct Answer</Label>
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
                  <Input
                    id="correct-answer"
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    placeholder="Enter the correct answer..."
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
                  placeholder="Explain why this is the correct answer..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  max="100"
                  value={questionForm.points?.toString() || "1"}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}