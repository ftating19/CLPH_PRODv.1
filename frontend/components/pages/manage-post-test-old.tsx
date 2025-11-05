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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BookOpen, Clock, Plus, Search, Edit, Trash2, Eye, FileText, Users, CheckCircle, XCircle, Check, ChevronsUpDown } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useSubjects } from "@/hooks/use-subjects"

// Question types
type QuestionType = "multiple-choice" | "true-false" | "identification"

interface Question {
  id?: number
  type: QuestionType
  question: string
  options?: string[]
  correct_answer: string
  points: number
  subject_id?: number
}

interface PostTest {
  id: number
  title: string
  description: string
  session_id: number
  tutor_id: number
  student_id: number
  subject_id: number
  subject_name?: string
  duration: number
  duration_unit: string
  created_at: string
  status: string
  question_count?: number
  student_name?: string
  session_date?: string
}

interface Template {
  template_id: number
  tutor_id: number
  title: string
  description: string
  subject_id: number
  subject_name: string
  total_questions: number
  time_limit: number
  passing_score: number
  is_active: boolean
  created_at: string
  times_assigned: number
  times_completed: number
}

interface Assignment {
  assignment_id: number
  template_id: number
  student_id: number
  booking_id: number
  first_name: string
  last_name: string
  email: string
  status: string
  assigned_at: string
  completed_at?: string
  score?: number
  passed?: boolean
}

export default function ManagePostTest() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, loading: subjectsLoading } = useSubjects()
  
  // Tutor's subjects (filtered)
  const [tutorSubjects, setTutorSubjects] = useState<any[]>([])
  
  // Program options for filtering
  const programOptionsRaw = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ];
  const programOptions = Array.from(new Set(programOptionsRaw));
  
  const [postTests, setPostTests] = useState<PostTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all")
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all")
  
  // Template states
  const [activeTab, setActiveTab] = useState<string>("templates")
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateAssignments, setTemplateAssignments] = useState<Assignment[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  
  // Subject combobox state
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")
  
  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedPostTest, setSelectedPostTest] = useState<PostTest | null>(null)
  const [postTestQuestions, setPostTestQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  
  // Edit question states
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null)
  const [savingQuestion, setSavingQuestion] = useState(false)
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [postTestToDelete, setPostTestToDelete] = useState<PostTest | null>(null)
  
  // Create template dialog states
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false)
  const [creatingTemplate, setCreatingTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [templateForm, setTemplateForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    time_limit: 30,
    passing_score: 70
  })
  const [templateQuestions, setTemplateQuestions] = useState<Question[]>([])
  
  // Fetch post-tests created by current tutor
  const fetchPostTests = async () => {
    if (!currentUser?.user_id) return
    
    try {
      setLoading(true)
      console.log('Fetching post-tests for tutor:', currentUser.user_id)
      
      const response = await fetch(`http://localhost:4000/api/post-tests/tutor/${currentUser.user_id}`)
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to fetch post-tests: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Received data:', data)
      
      if (data.success) {
        setPostTests(data.postTests || [])
        console.log('Set post-tests:', data.postTests?.length || 0, 'items')
      }
    } catch (error) {
      console.error('Error fetching post-tests:', error)
      toast({
        title: "Error",
        description: "Failed to load post-tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch templates
  const fetchTemplates = async () => {
    if (!currentUser?.user_id) return
    
    try {
      setLoadingTemplates(true)
      const response = await fetch(`http://localhost:4000/api/post-test-templates/tutor/${currentUser.user_id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Fetch assignments for a template
  const fetchTemplateAssignments = async (templateId: number) => {
    try {
      setLoadingAssignments(true)
      const response = await fetch(`http://localhost:4000/api/post-test-templates/${templateId}/assignments`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      
      const data = await response.json()
      if (data.success) {
        setTemplateAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast({
        title: "Error",
        description: "Failed to load student assignments",
        variant: "destructive"
      })
    } finally {
      setLoadingAssignments(false)
    }
  }

  // Handle template selection
  const handleViewTemplate = async (template: Template) => {
    setSelectedTemplate(template)
    await fetchTemplateAssignments(template.template_id)
  }
  
  // Handle edit template
  const handleEditTemplate = async (template: Template) => {
    try {
      // Load template data into form
      setTemplateForm({
        title: template.title,
        description: template.description || '',
        subject_id: template.subject_id?.toString() || '',
        time_limit: template.time_limit,
        passing_score: template.passing_score
      })
      
      // Fetch template questions
      const response = await fetch(`http://localhost:4000/api/post-test-templates/${template.template_id}/questions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.questions)) {
          // Convert database format to UI format
          const formattedQuestions = data.questions.map((q: any) => ({
            id: q.question_id,
            type: q.question_type.replace(/_/g, '-'),
            question: q.question_text,
            options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : undefined,
            correct_answer: q.correct_answer,
            points: q.points || 1
          }))
          setTemplateQuestions(formattedQuestions)
        }
      }
      
      // Set editing mode and open dialog
      setEditingTemplateId(template.template_id)
      setShowCreateTemplateDialog(true)
    } catch (error) {
      console.error('Error loading template for editing:', error)
      toast({
        title: "Error",
        description: "Failed to load template data",
        variant: "destructive"
      })
    }
  }
  
  // Handle create/update template
  const handleCreateTemplate = async () => {
    if (!currentUser?.user_id) return
    
    // Validation
    if (!templateForm.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template title",
        variant: "destructive"
      })
      return
    }
    
    if (!templateForm.subject_id) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive"
      })
      return
    }
    
    if (templateQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive"
      })
      return
    }
    
    try {
      setCreatingTemplate(true)
      
      // Get subject name
      const subject = subjects.find(s => s.subject_id.toString() === templateForm.subject_id)
      
      if (editingTemplateId) {
        // UPDATE existing template
        const templateResponse = await fetch(`http://localhost:4000/api/post-test-templates/${editingTemplateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: templateForm.title,
            description: templateForm.description,
            subject_id: parseInt(templateForm.subject_id),
            subject_name: subject?.subject_name || '',
            time_limit: templateForm.time_limit,
            passing_score: templateForm.passing_score
          })
        })
        
        if (!templateResponse.ok) {
          throw new Error('Failed to update template')
        }
        
        // Delete old questions and add new ones
        // Note: This is a simple approach. For better UX, you'd want to update individual questions
        const questionsResponse = await fetch(`http://localhost:4000/api/post-test-templates/${editingTemplateId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: templateQuestions.map((q, index) => ({
              question_text: q.question,
              question_type: q.type,
              options: q.options,
              correct_answer: q.correct_answer,
              points: q.points,
              order_number: templateQuestions.length - index // Reverse order since we add new at top
            }))
          })
        })
        
        if (!questionsResponse.ok) {
          throw new Error('Failed to update questions')
        }
        
        toast({
          title: "Success",
          description: "Template updated successfully!"
        })
      } else {
        // CREATE new template
        const templateResponse = await fetch('http://localhost:4000/api/post-test-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tutor_id: currentUser.user_id,
            title: templateForm.title,
            description: templateForm.description,
            subject_id: parseInt(templateForm.subject_id),
            subject_name: subject?.subject_name || '',
            time_limit: templateForm.time_limit,
            passing_score: templateForm.passing_score
          })
        })
        
        if (!templateResponse.ok) {
          throw new Error('Failed to create template')
        }
        
        const templateData = await templateResponse.json()
        const templateId = templateData.template_id
        
        // Add questions to template
        const questionsResponse = await fetch(`http://localhost:4000/api/post-test-templates/${templateId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: templateQuestions.map((q, index) => ({
              question_text: q.question,
              question_type: q.type,
              options: q.options,
              correct_answer: q.correct_answer,
              points: q.points,
              order_number: templateQuestions.length - index // Reverse order since we add new at top
            }))
          })
        })
        
        if (!questionsResponse.ok) {
          throw new Error('Failed to add questions')
        }
        
        toast({
          title: "Success",
          description: "Template created successfully!"
        })
      }
      
      // Reset and close
      setShowCreateTemplateDialog(false)
      setEditingTemplateId(null)
      setTemplateForm({
        title: '',
        description: '',
        subject_id: '',
        time_limit: 30,
        passing_score: 70
      })
      setTemplateQuestions([])
      
      // Refresh templates
      fetchTemplates()
      
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      })
    } finally {
      setCreatingTemplate(false)
    }
  }
  
  // Fetch post-tests created by current tutor - OLD
  const fetchPostTestsOld = async () => {
    if (!currentUser?.user_id) return
    
    try {
      setLoading(true)
      console.log('Fetching post-tests for tutor:', currentUser.user_id)
      
      const response = await fetch(`http://localhost:4000/api/post-tests/tutor/${currentUser.user_id}`)
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to fetch post-tests: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Received data:', data)
      
      if (data.success) {
        setPostTests(data.postTests || [])
        console.log('Set post-tests:', data.postTests?.length || 0, 'items')
      } else {
        throw new Error(data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error fetching post-tests:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load post-tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch questions for a specific post-test or template
  const fetchPostTestQuestions = async (postTestId: number, isTemplate: boolean = false) => {
    try {
      setLoadingQuestions(true)
      const endpoint = isTemplate 
        ? `http://localhost:4000/api/post-test-templates/${postTestId}/questions`
        : `http://localhost:4000/api/post-tests/${postTestId}/questions`
      
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Parse options if they are JSON strings and map field names
        const parsedQuestions = (data.questions || []).map((q: any) => ({
          id: q.id || q.question_id,
          type: (q.type || q.question_type).replace(/_/g, '-'), // Convert underscores to hyphens
          question: q.question || q.question_text,
          options: typeof q.options === 'string' 
            ? (q.options ? JSON.parse(q.options) : [])
            : Array.isArray(q.options) 
              ? q.options 
              : [],
          correct_answer: q.correct_answer,
          points: q.points || 1,
          subject_id: q.subject_id
        }))
        setPostTestQuestions(parsedQuestions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      })
    } finally {
      setLoadingQuestions(false)
    }
  }
  
  // Handle view post-test
  const handleViewPostTest = async (postTest: PostTest) => {
    setSelectedPostTest(postTest)
    setShowViewDialog(true)
    await fetchPostTestQuestions(postTest.id)
  }
  
  // Handle edit post-test
  const handleEditPostTest = async (postTest: PostTest) => {
    setSelectedPostTest(postTest)
    setShowEditDialog(true)
    await fetchPostTestQuestions(postTest.id)
  }
  
  // Handle edit question
  const handleEditQuestion = (index: number) => {
    const question = postTestQuestions[index]
    console.log('Editing question:', question)
    setEditingQuestionIndex(index)
    // Deep clone to avoid reference issues and ensure options is an array
    setEditedQuestion({
      ...question,
      options: Array.isArray(question.options) 
        ? [...question.options] 
        : typeof question.options === 'string'
          ? JSON.parse(question.options || '[]')
          : []
    })
    console.log('Edited question set to:', {
      ...question,
      options: Array.isArray(question.options) ? question.options : []
    })
  }
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingQuestionIndex(null)
    setEditedQuestion(null)
  }
  
  // Handle save edited question
  const handleSaveQuestion = async () => {
    if (!editedQuestion || editingQuestionIndex === null || !selectedPostTest) return
    
    try {
      setSavingQuestion(true)
      
      const response = await fetch(`http://localhost:4000/api/post-tests/questions/${editedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: editedQuestion.question,
          type: editedQuestion.type.replace(/-/g, '_'), // Convert hyphens back to underscores for DB
          options: editedQuestion.options,
          correct_answer: editedQuestion.correct_answer,
          points: editedQuestion.points
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update question')
      }
      
      // Update local state
      const updatedQuestions = [...postTestQuestions]
      updatedQuestions[editingQuestionIndex] = editedQuestion
      setPostTestQuestions(updatedQuestions)
      
      toast({
        title: "Success",
        description: "Question updated successfully"
      })
      
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating question:', error)
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive"
      })
    } finally {
      setSavingQuestion(false)
    }
  }
  
  // Handle delete question
  const handleDeleteQuestion = async (questionId: number | undefined, index: number) => {
    if (!questionId || !selectedPostTest) return
    
    try {
      const response = await fetch(`http://localhost:4000/api/post-tests/questions/${questionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete question')
      }
      
      // Update local state
      const updatedQuestions = postTestQuestions.filter((_, i) => i !== index)
      setPostTestQuestions(updatedQuestions)
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      })
    }
  }
  
  // Handle delete post-test
  const handleDeletePostTest = async () => {
    if (!postTestToDelete) return
    
    try {
      const response = await fetch(`http://localhost:4000/api/post-tests/${postTestToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete post-test')
      }
      
      toast({
        title: "Success",
        description: "Post-test deleted successfully"
      })
      
      fetchPostTests()
      setShowDeleteDialog(false)
      setPostTestToDelete(null)
    } catch (error) {
      console.error('Error deleting post-test:', error)
      toast({
        title: "Error",
        description: "Failed to delete post-test",
        variant: "destructive"
      })
    }
  }
  
  useEffect(() => {
    fetchTemplates()
  }, [currentUser])
  
  // Fetch tutor's subjects from sessions/bookings
  useEffect(() => {
    const fetchTutorSubjects = async () => {
      if (!currentUser?.user_id) return
      
      try {
        // Fetch sessions for the tutor
        const response = await fetch(`http://localhost:4000/api/sessions?user_id=${currentUser.user_id}`)
        if (response.ok) {
          const data = await response.json()
          
          if (data.success && Array.isArray(data.sessions)) {
            // Get unique subject IDs from sessions where user is the tutor
            const subjectIds = [...new Set(
              data.sessions
                .filter((s: any) => s.tutor_id === currentUser.user_id)
                .map((s: any) => s.subject_id)
                .filter(Boolean)
            )]
            
            // Filter subjects to only include those the tutor teaches
            const filtered = subjects.filter(subject => subjectIds.includes(subject.subject_id))
            setTutorSubjects(filtered.length > 0 ? filtered : subjects)
          } else {
            setTutorSubjects(subjects)
          }
        }
      } catch (error) {
        console.error('Error fetching tutor subjects:', error)
        // Fallback to all subjects if error
        setTutorSubjects(subjects)
      }
    }
    
    if (subjects.length > 0 && currentUser?.user_id) {
      fetchTutorSubjects()
    }
  }, [subjects, currentUser])
  
  // Debug: Log when templateQuestions changes
  useEffect(() => {
    if (templateQuestions.length > 0) {
      console.log('Template questions updated:', templateQuestions.map((q, i) => ({
        index: i + 1,
        id: q.id,
        question: q.question.substring(0, 30) || '(empty)'
      })))
    }
  }, [templateQuestions])
  
  // Filter post-tests
  const filteredPostTests = postTests.filter(postTest => {
    const matchesSearch = postTest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         postTest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         postTest.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSubject = selectedSubjectFilter === "all" || 
                          postTest.subject_id?.toString() === selectedSubjectFilter
    
    return matchesSearch && matchesSubject
  })
  
  // Check if user is a tutor
  const isTutor = currentUser?.role?.toLowerCase() === 'tutor'
  
  if (!isTutor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only tutors can access this page. This page is for managing post-tests created for tutoring sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Post-Tests</h1>
          <p className="text-muted-foreground mt-1">
            View and manage post-tests you've created for your tutoring sessions
          </p>
        </div>
        <Button onClick={() => {
          console.log('Opening create template dialog')
          console.log('Subjects available:', subjects.length)
          setShowCreateTemplateDialog(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, description, or student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select 
                value={selectedProgramFilter} 
                onValueChange={(value) => {
                  setSelectedProgramFilter(value)
                  setSelectedSubjectFilter('all') // Reset subject when program changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by program" />
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
            <div className="w-full md:w-64">
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
                            if (selectedProgramFilter === 'all') return true
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
        </CardContent>
      </Card>
      
      {/* Templates Section */}
      <div className="space-y-6">
        {loadingTemplates ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Templates Found</h3>
              <p className="text-muted-foreground">
                You haven't created any reusable post-test templates yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.template_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-1">{template.title}</span>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {template.total_questions} Q
                      </Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>{template.subject_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{template.time_limit} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{template.times_assigned} assigned, {template.times_completed} completed</span>
                      </div>
                      <div className="pt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewTemplate(template)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Students
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Template Students Dialog */}
          {selectedTemplate && (
            <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedTemplate.title} - Student Assignments</DialogTitle>
                  <DialogDescription>
                    Students assigned to this post-test template
                  </DialogDescription>
                </DialogHeader>
                
                {loadingAssignments ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading students...</p>
                  </div>
                ) : templateAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No students assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {templateAssignments.map((assignment) => (
                        <Card key={assignment.assignment_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {assignment.first_name} {assignment.last_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">{assignment.email}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-muted-foreground">
                                    Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                  </span>
                                  {assignment.completed_at && (
                                    <span className="text-muted-foreground">
                                      Completed: {new Date(assignment.completed_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {assignment.status === 'completed' ? (
                                  <>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-green-600">
                                        {assignment.score?.toFixed(1)}%
                                      </div>
                                      <Badge variant={assignment.passed ? "default" : "destructive"}>
                                        {assignment.passed ? (
                                          <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Passed
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Failed
                                          </>
                                        )}
                                      </Badge>
                                    </div>
                                  </>
                                ) : (
                                  <Badge variant="secondary">
                                    {assignment.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateTemplateDialog} onOpenChange={(open) => {
        setShowCreateTemplateDialog(open)
        if (!open) {
          // Reset form when closing
          setEditingTemplateId(null)
          setTemplateForm({
            title: '',
            description: '',
            subject_id: '',
            time_limit: 30,
            passing_score: 70
          })
          setTemplateQuestions([])
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplateId ? 'Edit Post-Test Template' : 'Create Post-Test Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplateId 
                ? 'Update the template details and questions'
                : 'Create a reusable template that can be assigned to multiple students'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
            <Card key={postTest.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{postTest.title}</CardTitle>
                    <CardDescription className="mt-1">{postTest.description}</CardDescription>
                  </div>
                  <Badge variant={postTest.status === 'completed' ? 'default' : 'secondary'}>
                    {postTest.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Student
                    </span>
                    <span className="font-medium">{postTest.student_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Subject
                    </span>
                    <span className="font-medium">{postTest.subject_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Questions
                    </span>
                    <span className="font-medium">{postTest.question_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Duration
                    </span>
                    <span className="font-medium">{postTest.duration} {postTest.duration_unit}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewPostTest(postTest)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditPostTest(postTest)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setPostTestToDelete(postTest)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* View Post-Test Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPostTest?.title}</DialogTitle>
            <DialogDescription>{selectedPostTest?.description}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Post-Test Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="text-muted-foreground">Student</Label>
                <p className="font-medium">{selectedPostTest?.student_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{selectedPostTest?.subject_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium">{selectedPostTest?.duration} {selectedPostTest?.duration_unit}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">
                  {selectedPostTest?.created_at ? new Date(selectedPostTest.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Questions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Questions ({postTestQuestions.length})</h3>
              {loadingQuestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading questions...</p>
                </div>
              ) : postTestQuestions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No questions found</p>
              ) : (
                <div className="space-y-4">
                  {postTestQuestions.map((question, index) => (
                    <Card key={question.id || index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          <Badge variant="outline">{question.points} point{question.points !== 1 ? 's' : ''}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-medium">{question.question}</p>
                        
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Options:</Label>
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded border ${
                                  option === question.correct_answer
                                    ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700'
                                    : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                              >
                                {option}
                                {option === question.correct_answer && (
                                  <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'true-false' && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Options:</Label>
                            {['True', 'False'].map((option) => (
                              <div
                                key={option}
                                className={`p-2 rounded border ${
                                  option === question.correct_answer
                                    ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700'
                                    : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                              >
                                {option}
                                {option === question.correct_answer && (
                                  <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'identification' && (
                          <div className="p-3 bg-green-50 border border-green-300 rounded dark:bg-green-950 dark:border-green-700">
                            <Label className="text-sm text-muted-foreground">Correct Answer:</Label>
                            <p className="font-medium mt-1">{question.correct_answer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Post-Test Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit: {selectedPostTest?.title}</DialogTitle>
            <DialogDescription>Edit questions for this post-test</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Post-Test Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="text-muted-foreground">Student</Label>
                <p className="font-medium">{selectedPostTest?.student_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{selectedPostTest?.subject_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium">{selectedPostTest?.duration} {selectedPostTest?.duration_unit}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">
                  {selectedPostTest?.created_at ? new Date(selectedPostTest.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Questions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Questions ({postTestQuestions.length})</h3>
              {loadingQuestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading questions...</p>
                </div>
              ) : postTestQuestions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No questions found</p>
              ) : (
                <div className="space-y-4">
                  {postTestQuestions.map((question, index) => (
                    <Card key={question.id || index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{question.points} point{question.points !== 1 ? 's' : ''}</Badge>
                            {editingQuestionIndex !== index && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditQuestion(index)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteQuestion(question.id, index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {editingQuestionIndex === index && editedQuestion ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div>
                              <Label>Question Text</Label>
                              <Textarea
                                value={editedQuestion.question}
                                onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <Label>Question Type</Label>
                              <Select
                                value={editedQuestion.type}
                                onValueChange={(value: QuestionType) => setEditedQuestion({ ...editedQuestion, type: value })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true-false">True/False</SelectItem>
                                  <SelectItem value="identification">Identification</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {editedQuestion.type === 'multiple-choice' && (
                              <div className="space-y-2">
                                <Label>Options</Label>
                                {(editedQuestion.options || []).map((option, optIndex) => (
                                  <div key={optIndex} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...(editedQuestion.options || [])]
                                        newOptions[optIndex] = e.target.value
                                        setEditedQuestion({ ...editedQuestion, options: newOptions })
                                      }}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = (editedQuestion.options || []).filter((_, i) => i !== optIndex)
                                        setEditedQuestion({ ...editedQuestion, options: newOptions })
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditedQuestion({
                                      ...editedQuestion,
                                      options: [...(editedQuestion.options || []), '']
                                    })
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                            )}
                            
                            <div>
                              <Label>Correct Answer</Label>
                              {editedQuestion.type === 'multiple-choice' ? (
                                <Select
                                  value={editedQuestion.correct_answer}
                                  onValueChange={(value) => setEditedQuestion({ ...editedQuestion, correct_answer: value })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(editedQuestion.options || []).map((option, idx) => (
                                      <SelectItem key={idx} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : editedQuestion.type === 'true-false' ? (
                                <Select
                                  value={editedQuestion.correct_answer}
                                  onValueChange={(value) => setEditedQuestion({ ...editedQuestion, correct_answer: value })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="True">True</SelectItem>
                                    <SelectItem value="False">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={editedQuestion.correct_answer}
                                  onChange={(e) => setEditedQuestion({ ...editedQuestion, correct_answer: e.target.value })}
                                  className="mt-1"
                                />
                              )}
                            </div>
                            
                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                min="1"
                                value={editedQuestion.points}
                                onChange={(e) => setEditedQuestion({ ...editedQuestion, points: parseInt(e.target.value) || 1 })}
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="default"
                                onClick={handleSaveQuestion}
                                disabled={savingQuestion}
                              >
                                {savingQuestion ? 'Saving...' : 'Save Changes'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={savingQuestion}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <p className="font-medium">{question.question}</p>
                            
                            {question.type === 'multiple-choice' && question.options && (
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Options:</Label>
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded border ${
                                      option === question.correct_answer
                                        ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700'
                                        : 'bg-gray-50 dark:bg-gray-800'
                                    }`}
                                  >
                                    {option}
                                    {option === question.correct_answer && (
                                      <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'true-false' && (
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Options:</Label>
                                {['True', 'False'].map((option) => (
                                  <div
                                    key={option}
                                    className={`p-2 rounded border ${
                                      option === question.correct_answer
                                        ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700'
                                        : 'bg-gray-50 dark:bg-gray-800'
                                    }`}
                                  >
                                    {option}
                                    {option === question.correct_answer && (
                                      <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'identification' && (
                              <div className="p-3 bg-green-50 border border-green-300 rounded dark:bg-green-950 dark:border-green-700">
                                <Label className="text-sm text-muted-foreground">Correct Answer:</Label>
                                <p className="font-medium mt-1">{question.correct_answer}</p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post-Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postTestToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostTestToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePostTest} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateTemplateDialog} onOpenChange={(open) => {
        setShowCreateTemplateDialog(open)
        if (!open) {
          // Reset form when closing
          setEditingTemplateId(null)
          setTemplateForm({
            title: '',
            description: '',
            subject_id: '',
            time_limit: 30,
            passing_score: 70
          })
          setTemplateQuestions([])
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplateId ? 'Edit Post-Test Template' : 'Create Post-Test Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplateId 
                ? 'Update the template details and questions'
                : 'Create a reusable template that can be assigned to multiple students'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-title">Template Title *</Label>
                <Input
                  id="template-title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  placeholder="e.g., Math Final Exam"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Brief description of the post-test"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject *</Label>
                  <Select
                    value={templateForm.subject_id}
                    onValueChange={(value) => setTemplateForm({ ...templateForm, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {tutorSubjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                          {subject.subject_code} - {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    value={templateForm.time_limit}
                    onChange={(e) => setTemplateForm({ ...templateForm, time_limit: parseInt(e.target.value) || 30 })}
                    min={1}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="passing-score">Passing Score (%)</Label>
                <Input
                  id="passing-score"
                  type="number"
                  value={templateForm.passing_score}
                  onChange={(e) => setTemplateForm({ ...templateForm, passing_score: parseInt(e.target.value) || 70 })}
                  min={0}
                  max={100}
                />
              </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newQuestion = {
                      id: Date.now(),
                      type: 'multiple-choice' as QuestionType,
                      question: '',
                      options: ['', '', '', ''],
                      correct_answer: '',
                      points: 1
                    }
                    // Add new question at the TOP of the array
                    const updatedQuestions = [newQuestion, ...templateQuestions]
                    console.log('Adding question. Current count:', templateQuestions.length, 'New count:', updatedQuestions.length)
                    console.log('Question order:', updatedQuestions.map((q, i) => `Q${i + 1}: id=${q.id}`))
                    setTemplateQuestions(updatedQuestions)
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>
              
              {templateQuestions.map((q, index) => (
                <Card key={q.id || index}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Label className="font-semibold">Question {templateQuestions.length - index}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTemplateQuestions(templateQuestions.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Question Type</Label>
                      <Select
                        value={q.type}
                        onValueChange={(value: QuestionType) => {
                          const updated = [...templateQuestions]
                          updated[index] = { ...updated[index], type: value }
                          if (value === 'multiple-choice') updated[index].options = ['', '', '', '']
                          else if (value === 'true-false') updated[index].options = ['True', 'False']
                          else updated[index].options = undefined
                          setTemplateQuestions(updated)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="true-false">True/False</SelectItem>
                          <SelectItem value="identification">Identification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...templateQuestions]
                          updated[index] = { ...updated[index], question: e.target.value }
                          setTemplateQuestions(updated)
                        }}
                        rows={2}
                      />
                    </div>
                    
                    {(q.type === 'multiple-choice') && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {q.options?.map((opt, optIndex) => (
                          <Input
                            key={optIndex}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...templateQuestions]
                              updated[index].options![optIndex] = e.target.value
                              setTemplateQuestions(updated)
                            }}
                            placeholder={`Option ${optIndex + 1}`}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div>
                      <Label>Correct Answer</Label>
                      {q.type === 'true-false' ? (
                        <Select
                          value={q.correct_answer}
                          onValueChange={(value) => {
                            const updated = [...templateQuestions]
                            updated[index] = { ...updated[index], correct_answer: value }
                            setTemplateQuestions(updated)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select answer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="True">True</SelectItem>
                            <SelectItem value="False">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={q.correct_answer}
                          onChange={(e) => {
                            const updated = [...templateQuestions]
                            updated[index] = { ...updated[index], correct_answer: e.target.value }
                            setTemplateQuestions(updated)
                          }}
                          placeholder="Enter correct answer"
                        />
                      )}
                    </div>
                    
                    <div>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        value={q.points}
                        onChange={(e) => {
                          const updated = [...templateQuestions]
                          updated[index] = { ...updated[index], points: parseInt(e.target.value) || 1 }
                          setTemplateQuestions(updated)
                        }}
                        min={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {templateQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No questions added yet. Click "Add Question" to get started.
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateTemplateDialog(false)}
                disabled={creatingTemplate}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateTemplate}
                disabled={creatingTemplate}
              >
                {creatingTemplate 
                  ? (editingTemplateId ? 'Updating...' : 'Creating...') 
                  : (editingTemplateId ? 'Update Template' : 'Create Template')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
