"use client"

import { useState, useEffect } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Brain, Clock, Trophy, Plus, Search, Edit, Trash2, Eye, Target, FileText, Users, ChevronDown } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { usePreAssessments } from "@/hooks/use-pre-assessments"
import { CICT_PROGRAMS } from "@/lib/constants"

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
}

interface PreAssessment {
  id: number
  title: string
  subject_ids?: number[] // Optional for backward compatibility
  subject_id?: number // Keep for backward compatibility
  subject_names?: string // Will be comma-separated names
  subject_name?: string // Keep for backward compatibility
  description: string
  created_by: number
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
  const userRole = currentUser?.role?.toLowerCase() || "student"

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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({
    title: "",
    program: "",
    year_level: "",
    subject_ids: [] as number[],
    description: "",
    duration: 30,
    duration_unit: "minutes",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard"
  })

  const [editForm, setEditForm] = useState({
    title: "",
    program: "",
    year_level: "",
    subject_ids: [] as number[],
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
    points: 1
  })

  // Check if user is admin
  const isAdmin = userRole === "admin"

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage pre-assessments.",
        variant: "destructive"
      })
    }
  }, [currentUser, isAdmin, toast])

  // Fetch data
  useEffect(() => {
    if (isAdmin) {
      fetchSubjects()
    }
  }, [isAdmin])

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

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/subjects')
      if (!response.ok) throw new Error('Failed to fetch subjects')
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  // Create pre-assessment
  const handleCreatePreAssessment = async () => {
    if (!createForm.title.trim() || !createForm.program || !createForm.year_level || 
        createForm.subject_ids.length === 0 || !createForm.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one subject.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('http://localhost:4000/api/pre-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...createForm,
          created_by: currentUser?.user_id
        })
      })

      if (!response.ok) throw new Error('Failed to create pre-assessment')

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
        subject_ids: [],
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
      subject_ids: preAssessment.subject_ids || [],
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
        editForm.subject_ids.length === 0 || !editForm.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one subject.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`http://localhost:4000/api/pre-assessments/${selectedPreAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Failed to update pre-assessment')

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
      const response = await fetch(`http://localhost:4000/api/pre-assessments/${selectedPreAssessment.id}`, {
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
      const response = await fetch(`http://localhost:4000/api/pre-assessment-questions/pre-assessment/${preAssessmentId}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      setQuestions(data.questions || [])
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
      points: 1
    })
    setShowQuestionDialog(true)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setQuestionForm({
      type: question.type,
      question: question.question,
      options: question.options || ["", "", "", ""],
      correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer,
      explanation: question.explanation || "",
      points: question.points
    })
    setShowQuestionDialog(true)
  }

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || !questionForm.correctAnswer.trim()) {
      toast({
        title: "Validation Error",
        description: "Question and correct answer are required.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const questionData = {
        pre_assessment_id: selectedPreAssessment?.id,
        question_type: questionForm.type,
        question: questionForm.question,
        options: questionForm.type === "multiple-choice" ? questionForm.options.filter(option => option.trim()) : null,
        correct_answer: questionForm.correctAnswer,
        explanation: questionForm.explanation,
        points: questionForm.points
      }

      const url = editingQuestion 
        ? `http://localhost:4000/api/pre-assessment-questions/${editingQuestion.id}`
        : 'http://localhost:4000/api/pre-assessment-questions'
      
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
      const response = await fetch(`http://localhost:4000/api/pre-assessment-questions/${questionId}`, {
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

  // Filter pre-assessments
  const filteredPreAssessments = preAssessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assessment.subject_name && assessment.subject_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesProgram = programFilter === "all" || assessment.program === programFilter

    return matchesSearch && matchesProgram
  })

  // Access denied for non-admin users
  if (currentUser && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage pre-assessments.
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
                    {assessment.subject_name || "Unknown Subject"}
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
                setCreateForm({ ...createForm, program: value, year_level: "", subject_ids: [] })
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
                onValueChange={(value) => setCreateForm({ ...createForm, year_level: value, subject_ids: [] })}
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
            <div className="space-y-2">
              <Label>Subjects *</Label>
              <SubjectMultiSelect
                selectedSubjects={createForm.subject_ids}
                onChange={(subjects) => setCreateForm({ ...createForm, subject_ids: subjects })}
                subjects={filteredSubjects}
                disabled={!createForm.program || !createForm.year_level}
              />
              {createForm.subject_ids.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filteredSubjects
                    .filter(subject => createForm.subject_ids.includes(subject.subject_id))
                    .map((subject) => (
                      <Badge key={subject.subject_id} variant="secondary" className="text-xs">
                        {subject.subject_name}
                      </Badge>
                    ))}
                </div>
              )}
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
                  setEditForm({ ...editForm, program: value, year_level: "", subject_ids: [] })
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
                  onValueChange={(value) => setEditForm({ ...editForm, year_level: value, subject_ids: [] })}
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
              <div className="space-y-2">
                <Label>Subjects *</Label>
                <SubjectMultiSelect
                  selectedSubjects={editForm.subject_ids}
                  onChange={(subjects) => setEditForm({ ...editForm, subject_ids: subjects })}
                  subjects={filteredSubjects}
                  disabled={!editForm.program || !editForm.year_level}
                />
                {editForm.subject_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filteredSubjects
                      .filter(subject => editForm.subject_ids.includes(subject.subject_id))
                      .map((subject) => (
                        <Badge key={subject.subject_id} variant="secondary" className="text-xs">
                          {subject.subject_name}
                        </Badge>
                      ))}
                  </div>
                )}
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
              <p className="text-sm text-muted-foreground">
                {questions.length} question{questions.length !== 1 ? 's' : ''} total
              </p>
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (editingQuestion ? "Update Question" : "Add Question")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}