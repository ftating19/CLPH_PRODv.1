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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BookOpen, Clock, Plus, Search, Edit, Trash2, Eye, FileText, Users, CheckCircle, XCircle } from "lucide-react"
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

export default function ManagePostTest() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, loading: subjectsLoading } = useSubjects()
  
  const [postTests, setPostTests] = useState<PostTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all")
  
  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedPostTest, setSelectedPostTest] = useState<PostTest | null>(null)
  const [postTestQuestions, setPostTestQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [postTestToDelete, setPostTestToDelete] = useState<PostTest | null>(null)
  
  // Fetch post-tests created by current tutor
  const fetchPostTests = async () => {
    if (!currentUser?.user_id) return
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/api/post-tests/tutor/${currentUser.user_id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch post-tests')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPostTests(data.postTests || [])
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
  
  // Fetch questions for a specific post-test
  const fetchPostTestQuestions = async (postTestId: number) => {
    try {
      setLoadingQuestions(true)
      const response = await fetch(`http://localhost:4000/api/post-tests/${postTestId}/questions`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPostTestQuestions(data.questions || [])
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
    fetchPostTests()
  }, [currentUser])
  
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
              <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
                <SelectTrigger>
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
        </CardContent>
      </Card>
      
      {/* Post-Tests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading post-tests...</p>
        </div>
      ) : filteredPostTests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Post-Tests Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedSubjectFilter !== "all"
                ? "No post-tests match your search criteria"
                : "You haven't created any post-tests yet. Create one from your tutoring sessions."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPostTests.map((postTest) => (
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
    </div>
  )
}
