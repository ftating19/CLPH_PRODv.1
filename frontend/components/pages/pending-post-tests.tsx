"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { apiUrl } from "@/lib/api-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Search, Eye, FileText, Users, CheckCircle, XCircle, AlertCircle, User } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useSubjects } from "@/hooks/use-subjects"
import { cn } from "@/lib/utils"

interface Question {
  id?: number
  question_text: string
  question_type: string
  options?: string[]
  correct_answer: string
  points: number
  explanation?: string
  order_number?: number
}

interface PendingPostTest {
  id: number
  pending_post_test_id: number
  title: string
  description: string
  booking_id: number
  tutor_id: number
  student_id: number
  subject_id: number
  subject_name: string
  tutor_name: string
  tutor_email: string
  student_name: string
  time_limit: number
  passing_score: number
  total_questions: number
  status: string
  reviewed_by?: number
  reviewed_at?: string
  reviewed_by_name?: string
  comment?: string
  created_at: string
  start_date?: string
  end_date?: string
  preferred_time?: string
}

export default function PendingPostTests() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, loading: subjectsLoading } = useSubjects()
  
  // Program options for filtering
  const programOptionsRaw = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ];
  const programOptions = Array.from(new Set(programOptionsRaw));
  
  const [postTests, setPostTests] = useState<PendingPostTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all")
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all")
  
  // Subject combobox state
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState<string>("pending")
  
  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedPostTest, setSelectedPostTest] = useState<PendingPostTest | null>(null)
  const [postTestQuestions, setPostTestQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  
  // Approve/Reject states
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [postTestToProcess, setPostTestToProcess] = useState<PendingPostTest | null>(null)
  const [rejectionComment, setRejectionComment] = useState("")
  const [processing, setProcessing] = useState(false)
  
  // Fetch pending post-tests
  const fetchPendingPostTests = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiUrl(`/api/pending-post-tests`))
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending post-tests')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPostTests(data.postTests || [])
      }
    } catch (error) {
      console.error('Error fetching pending post-tests:', error)
      toast({
        title: "Error",
        description: "Failed to load pending post-tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch questions for a specific pending post-test
  const fetchPostTestQuestions = async (pendingPostTestId: number) => {
    try {
      setLoadingQuestions(true)
      const response = await fetch(apiUrl(`/api/pending-post-tests/${pendingPostTestId}`))
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      
      const data = await response.json()
      
      if (data.success && data.postTest.questions) {
        setPostTestQuestions(data.postTest.questions || [])
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
  const handleViewPostTest = async (postTest: PendingPostTest) => {
    setSelectedPostTest(postTest)
    setShowViewDialog(true)
    await fetchPostTestQuestions(postTest.pending_post_test_id)
  }
  
  // Handle approve post-test
  const handleApprovePostTest = async () => {
    if (!postTestToProcess || !currentUser?.user_id) return
    
    try {
      setProcessing(true)
      const response = await fetch(
        apiUrl(`/api/pending-post-tests/${postTestToProcess.pending_post_test_id}/approve`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            approved_by: currentUser.user_id
          })
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to approve post-test')
      }
      
      toast({
        title: "Success",
        description: "Post-test approved successfully"
      })
      
      fetchPendingPostTests()
      setShowApproveDialog(false)
      setPostTestToProcess(null)
    } catch (error) {
      console.error('Error approving post-test:', error)
      toast({
        title: "Error",
        description: "Failed to approve post-test",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }
  
  // Handle reject post-test
  const handleRejectPostTest = async () => {
    if (!postTestToProcess || !currentUser?.user_id) return
    
    if (!rejectionComment.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      })
      return
    }
    
    try {
      setProcessing(true)
      const response = await fetch(
        apiUrl(`/api/pending-post-tests/${postTestToProcess.pending_post_test_id}/reject`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rejected_by: currentUser.user_id,
            comment: rejectionComment
          })
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to reject post-test')
      }
      
      toast({
        title: "Success",
        description: "Post-test rejected successfully"
      })
      
      fetchPendingPostTests()
      setShowRejectDialog(false)
      setPostTestToProcess(null)
      setRejectionComment("")
    } catch (error) {
      console.error('Error rejecting post-test:', error)
      toast({
        title: "Error",
        description: "Failed to reject post-test",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }
  
  useEffect(() => {
    fetchPendingPostTests()
  }, [])
  
  // Filter post-tests
  const filteredPostTests = postTests.filter(postTest => {
    const matchesSearch = postTest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         postTest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         postTest.tutor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         postTest.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSubject = selectedSubjectFilter === "all" || 
                          postTest.subject_id?.toString() === selectedSubjectFilter
    
    const matchesStatus = activeTab === "all" || postTest.status === activeTab
    
    return matchesSearch && matchesSubject && matchesStatus
  })
  
  // Check if user is faculty
  const isFaculty = currentUser?.role?.toLowerCase() === 'faculty'
  
  if (!isFaculty) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only faculty members can access this page. This page is for reviewing and approving post-tests.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const getStatusCounts = () => {
    const pending = postTests.filter(pt => pt.status === 'pending').length
    const approved = postTests.filter(pt => pt.status === 'approved').length
    const rejected = postTests.filter(pt => pt.status === 'rejected').length
    return { pending, approved, rejected, all: postTests.length }
  }
  
  const counts = getStatusCounts()
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Post-Tests</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve post-tests submitted by tutors
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by title, tutor, or student..."
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
                        {selectedSubjectFilter === "all" ? (
                          "All Subjects"
                        ) : (
                          (() => {
                            const subject = subjects.find(s => s.subject_id.toString() === selectedSubjectFilter);
                            return subject ? `${subject.subject_code} - ${subject.subject_name}` : selectedSubjectFilter;
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
                                  setSelectedSubjectFilter(subject.subject_id.toString())
                                  setSubjectFilterComboboxOpen(false)
                                  setSubjectFilterSearchValue("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSubjectFilter === subject.subject_id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {subject.subject_code} - {subject.subject_name}
                              </CommandItem>
                            ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                    : `No ${activeTab === 'all' ? '' : activeTab} post-tests at this time`}
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
                      {getStatusBadge(postTest.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Tutor
                        </span>
                        <span className="font-medium">{postTest.tutor_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Student
                        </span>
                        <span className="font-medium">{postTest.student_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Subject
                        </span>
                        <span className="font-medium">{postTest.subject_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Questions
                        </span>
                        <span className="font-medium">{postTest.total_questions || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Time Limit
                        </span>
                        <span className="font-medium">{postTest.time_limit} min</span>
                      </div>
                    </div>
                    
                    {postTest.status === 'rejected' && postTest.comment && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">Rejection Reason:</p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{postTest.comment}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
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
                      {postTest.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setPostTestToProcess(postTest)
                              setShowApproveDialog(true)
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setPostTestToProcess(postTest)
                              setShowRejectDialog(true)
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
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
                <Label className="text-muted-foreground">Tutor</Label>
                <p className="font-medium">{selectedPostTest?.tutor_name}</p>
                <p className="text-sm text-muted-foreground">{selectedPostTest?.tutor_email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Student</Label>
                <p className="font-medium">{selectedPostTest?.student_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{selectedPostTest?.subject_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Time Limit</Label>
                <p className="font-medium">{selectedPostTest?.time_limit} minutes</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Passing Score</Label>
                <p className="font-medium">{selectedPostTest?.passing_score}%</p>
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
                        <p className="font-medium">{question.question_text}</p>
                        
                        {question.question_type === 'multiple_choice' && question.options && (
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
                        
                        {question.question_type === 'true_false' && (
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
                        
                        {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                          <div className="p-3 bg-green-50 border border-green-300 rounded dark:bg-green-950 dark:border-green-700">
                            <Label className="text-sm text-muted-foreground">Correct Answer:</Label>
                            <p className="font-medium mt-1">{question.correct_answer}</p>
                          </div>
                        )}
                        
                        {question.explanation && (
                          <div className="p-3 bg-blue-50 border border-blue-300 rounded dark:bg-blue-950 dark:border-blue-700">
                            <Label className="text-sm text-muted-foreground">Explanation:</Label>
                            <p className="text-sm mt-1">{question.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* Actions in view dialog */}
            {selectedPostTest?.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setPostTestToProcess(selectedPostTest)
                    setShowViewDialog(false)
                    setShowApproveDialog(true)
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setPostTestToProcess(selectedPostTest)
                    setShowViewDialog(false)
                    setShowRejectDialog(true)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Post-Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{postTestToProcess?.title}"? This will make it available to the student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostTestToProcess(null)} disabled={processing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprovePostTest} 
              className="bg-green-600 hover:bg-green-700"
              disabled={processing}
            >
              {processing ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Post-Test</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting "{postTestToProcess?.title}". This will be visible to the tutor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setPostTestToProcess(null)
                setRejectionComment("")
              }}
              disabled={processing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectPostTest}
              className="bg-red-600 hover:bg-red-700"
              disabled={processing || !rejectionComment.trim()}
            >
              {processing ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
