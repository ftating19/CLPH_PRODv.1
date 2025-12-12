"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { CheckCircle, XCircle, Clock, Brain, Calendar, User, Search, Eye, Loader2, FileQuestion } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"

interface PendingQuiz {
  quizzes_id: number
  title: string
  subject_id: number
  subject_name: string
  description: string
  created_by: number
  quiz_type: string
  duration: number
  duration_unit: string
  difficulty: string
  item_counts: number
  program: string
  quiz_view: string
  status: string
  created_by_name: string
  creator_email?: string
  reviewed_by?: number
  reviewed_by_name?: string
  reviewed_at?: string
}

export default function PendingQuizzes() {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [currentQuiz, setCurrentQuiz] = useState<PendingQuiz | null>(null)
  const [quizzes, setQuizzes] = useState<PendingQuiz[]>([])
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentUser) {
      fetchPendingQuizzes()
    }
  }, [currentUser])

  const fetchPendingQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('https://api.cictpeerlearninghub.com/api/pending-quizzes/status/pending')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      let filtered = []
      if (data.success && data.quizzes) {
        // Admins see all, faculty see only their assigned subjects (based on subjects.user_id)
        if (currentUser?.role?.toLowerCase() === 'faculty') {
          // Fetch all subjects to find which ones belong to this faculty
          try {
            const subjectsResponse = await fetch('https://api.cictpeerlearninghub.com/api/subjects')
            if (subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json()
              
              console.log('DEBUG - Current User:', {
                user_id: currentUser.user_id,
                role: currentUser.role,
                email: currentUser.email
              })
              console.log('DEBUG - All Subjects:', subjectsData.subjects)
              
              // Filter subjects where user_id matches current faculty user_id
              // Note: subject.user_id can be a JSON array like ["35"] or an array [35]
              const facultySubjects = subjectsData.subjects
                ?.filter((subject: any) => {
                  let userIds = []
                  // Parse user_id if it's a JSON string
                  if (typeof subject.user_id === 'string') {
                    try {
                      userIds = JSON.parse(subject.user_id)
                    } catch {
                      userIds = [subject.user_id]
                    }
                  } else if (Array.isArray(subject.user_id)) {
                    userIds = subject.user_id
                  } else {
                    userIds = [subject.user_id]
                  }
                  // Convert to numbers for comparison
                  userIds = userIds.map((id: any) => parseInt(id))
                  const currentUserId = typeof currentUser.user_id === 'string' ? parseInt(currentUser.user_id) : currentUser.user_id
                  const matches = userIds.includes(currentUserId)
                  console.log(`DEBUG - Subject ${subject.subject_id} (${subject.subject_name}): user_id=${JSON.stringify(subject.user_id)}, parsed=${JSON.stringify(userIds)}, matches=${matches}`)
                  return matches
                }) || []
              
              const facultySubjectIds = facultySubjects.map((subject: any) => subject.subject_id)
              
              console.log('DEBUG - Faculty Subjects:', facultySubjects)
              console.log('DEBUG - Faculty Subject IDs:', facultySubjectIds)
              console.log('DEBUG - All Quizzes:', data.quizzes)
              
              // Filter quizzes where subject_id matches faculty's subjects
              filtered = data.quizzes.filter((quiz: PendingQuiz) => {
                const quizSubjectId = typeof quiz.subject_id === 'string' ? parseInt(quiz.subject_id) : quiz.subject_id
                const matches = facultySubjectIds.includes(quizSubjectId)
                console.log(`DEBUG - Quiz ${quiz.quizzes_id}: subject_id=${quiz.subject_id}, parsed=${quizSubjectId}, matches=${matches}`)
                return matches
              })
              
              console.log('Faculty filtering result:', {
                currentUserRole: currentUser.role,
                currentUserId: currentUser.user_id,
                totalQuizzes: data.quizzes.length,
                facultySubjectIds,
                filteredCount: filtered.length,
                filteredQuizzes: filtered
              })
            } else {
              filtered = []
            }
          } catch (error) {
            console.error('Error fetching subjects for faculty filter:', error)
            filtered = []
          }
        } else {
          // Admin or other roles see all
          console.log('Admin viewing all quizzes:', data.quizzes.length)
          filtered = data.quizzes
        }
        setQuizzes(filtered)
      } else {
        setQuizzes([])
      }
    } catch (error) {
      console.error('Error fetching pending quizzes:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch quizzes')
      toast({
        title: "Error",
        description: "Failed to load pending quizzes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (quiz: PendingQuiz) => {
    setCurrentQuiz(quiz)
    setShowApproveDialog(true)
  }

  const handleReject = (quiz: PendingQuiz) => {
    setCurrentQuiz(quiz)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (!currentQuiz || !currentUser) return
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pending-quizzes/${currentQuiz.quizzes_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: currentUser.user_id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve quiz')
      }

      toast({
        title: "Quiz Approved",
        description: `"${currentQuiz.title}" has been approved and is now available.`,
        duration: 5000,
      })

      await fetchPendingQuizzes()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowApproveDialog(false)
      setCurrentQuiz(null)
    }
  }

  const confirmRejection = async () => {
    if (!currentQuiz || !currentUser) return
    
    // Validate that rejection reason is provided
    if (!rejectionReason.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejecting this quiz.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pending-quizzes/${currentQuiz.quizzes_id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejected_by: currentUser.user_id,
          comment: rejectionReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject quiz')
      }

      toast({
        title: "Quiz Rejected",
        description: `"${currentQuiz.title}" has been rejected.`,
        duration: 5000,
      })

      await fetchPendingQuizzes()
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowRejectDialog(false)
      setCurrentQuiz(null)
      setRejectionReason("")
    }
  }

  const viewDetails = (quiz: PendingQuiz) => {
    setCurrentQuiz(quiz)
    setShowDetailsModal(true)
  }

  const viewQuizQuestions = async (quiz: PendingQuiz) => {
    setCurrentQuiz(quiz)
    setLoadingQuestions(true)
    setShowQuestionsModal(true)
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/questions/quiz/${quiz.quizzes_id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch quiz questions')
      }
      const data = await response.json()
      
      if (data.success) {
        setQuizQuestions(data.questions || [])
      } else {
        throw new Error(data.error || 'Failed to fetch questions')
      }
    } catch (error) {
      console.error('Error fetching quiz questions:', error)
      toast({
        title: "Error",
        description: "Failed to load quiz questions. Please try again.",
        variant: "destructive"
      })
      setQuizQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Quizzes</h1>
          <p className="text-muted-foreground">Review and approve quiz submissions</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {quizzes.length} Pending
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by title, subject, or creator..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No pending quizzes</h3>
            <p className="text-sm text-muted-foreground">
              There are no quizzes awaiting review at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.quizzes_id} className="hover:shadow-lg transition-shadow flex flex-col">
              {/* Pending Approval Banner */}
              <div className="bg-amber-100 text-amber-800 border-b border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 px-4 py-2 text-sm font-medium rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>⏳ Pending Approval</span>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="mb-2">{quiz.subject_name}</Badge>
                  <Badge variant="secondary">{quiz.difficulty}</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-3 pb-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{quiz.created_by_name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>{quiz.item_counts} questions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{quiz.duration} {quiz.duration_unit}</span>
                  </div>
                  <div className="flex items-center space-x-1 col-span-2">
                    <span>Program: {quiz.program || 'N/A'}</span>
                  </div>
                </div>
                
                <Badge className="w-fit">{quiz.quiz_view}</Badge>
              </CardContent>
              
              <CardContent className="pt-0 pb-4 border-t">
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewDetails(quiz)}
                    className="w-full text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewQuizQuestions(quiz)}
                    className="w-full text-xs"
                  >
                    <FileQuestion className="w-3 h-3 mr-1" />
                    View Quiz
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleApprove(quiz)}
                    className="w-full text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleReject(quiz)}
                    className="w-full text-xs"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentQuiz?.title}</DialogTitle>
            <DialogDescription>Quiz Details</DialogDescription>
          </DialogHeader>
          {currentQuiz && (
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <p className="text-sm">{currentQuiz.subject_name}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{currentQuiz.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <p className="text-sm">{currentQuiz.difficulty}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="text-sm">{currentQuiz.duration} {currentQuiz.duration_unit}</p>
                </div>
                <div>
                  <Label>Questions</Label>
                  <p className="text-sm">{currentQuiz.item_counts}</p>
                </div>
                <div>
                  <Label>Quiz View</Label>
                  <p className="text-sm">{currentQuiz.quiz_view}</p>
                </div>
                <div>
                  <Label>Program</Label>
                  <p className="text-sm">{currentQuiz.program || 'N/A'}</p>
                </div>
                <div>
                  <Label>Created By</Label>
                  <p className="text-sm">{currentQuiz.created_by_name}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{currentQuiz?.title}"? This quiz will be made available to students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject "{currentQuiz?.title}"? You must provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="text-red-600">Rejection Reason (Required)*</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please explain why this quiz is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              The creator will see this feedback.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejection} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={!rejectionReason.trim()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Quiz Questions Modal */}
      <Dialog open={showQuestionsModal} onOpenChange={setShowQuestionsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentQuiz?.title} - Quiz Questions</DialogTitle>
            <DialogDescription>
              Review all questions before approving or rejecting this quiz
            </DialogDescription>
          </DialogHeader>
          
          {loadingQuestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : quizQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions found for this quiz.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground mb-4">
                Total Questions: {quizQuestions.length}
              </div>
              
              {quizQuestions.map((question, index) => (
                <Card key={question.question_id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium">
                        Question {index + 1}
                      </CardTitle>
                      <Badge variant="outline">{question.question_type || 'Multiple Choice'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Question:</Label>
                      <p className="text-sm mt-1">{question.question}</p>
                    </div>
                    
                    {question.question_type === 'enumeration' ? (
                      <div>
                        <Label className="text-sm font-semibold">Answers:</Label>
                        <div className="mt-2 space-y-2">
                          {(() => {
                            try {
                              let answers: string[] = []
                              if (Array.isArray(question.answer)) {
                                answers = question.answer
                              } else if (typeof question.answer === 'string') {
                                try {
                                  const parsed = JSON.parse(question.answer)
                                  if (Array.isArray(parsed)) {
                                    answers = parsed
                                  } else {
                                    answers = String(question.answer).split(',').map((s: string) => s.trim()).filter(Boolean)
                                  }
                                } catch (e) {
                                  answers = String(question.answer).split(',').map((s: string) => s.trim()).filter(Boolean)
                                }
                              } else if (question.choices && question.choices.length > 0) {
                                // fallback: if choices provided, use them
                                answers = question.choices
                              }

                              if (answers.length === 0) {
                                return <p className="text-sm text-muted-foreground">No accepted answers specified.</p>
                              }

                              return answers.map((ans: string, idx: number) => (
                                <div key={idx} className="p-3 rounded-md border bg-muted/50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">{ans}</span>
                                  </div>
                                </div>
                              ))
                            } catch (e) {
                              return <p className="text-sm text-destructive">Error parsing enumeration answers</p>
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      question.choices && question.choices.length > 0 && (
                        <div>
                          <Label className="text-sm font-semibold">Options:</Label>
                          <div className="mt-2 space-y-2">
                            {(() => {
                              try {
                                const choices = typeof question.choices === 'string' ? JSON.parse(question.choices) : question.choices
                                return (choices || []).map((choice: string, idx: number) => {
                                  const isCorrect = choice === question.answer
                                  return (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-md border ${
                                        isCorrect
                                          ? 'bg-green-50 border-green-500 dark:bg-green-950/30'
                                          : 'bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm">{String.fromCharCode(65 + idx)}. {choice}</span>
                                        {isCorrect && (
                                          <Badge className="bg-green-600">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Correct Answer
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })
                              } catch (e) {
                                return <p className="text-sm text-muted-foreground">Error parsing choices</p>
                              }
                            })()}
                          </div>
                        </div>
                      )
                    )}
                    
                    {!question.choices && (
                      <div>
                        {question.question_type === 'enumeration' ? (
                          <>
                            <Label className="text-sm font-semibold">Accepted Answers:</Label>
                            <div className="mt-2 space-y-2">
                              {(() => {
                                try {
                                  let answers: string[] = []
                                  if (Array.isArray(question.answer)) {
                                    answers = question.answer
                                  } else if (typeof question.answer === 'string') {
                                    // Try parse JSON array first, fallback to comma-split
                                    try {
                                      const parsed = JSON.parse(question.answer)
                                      if (Array.isArray(parsed)) {
                                        answers = parsed
                                      } else {
                                        answers = String(question.answer).split(',').map((s: string) => s.trim()).filter(Boolean)
                                      }
                                    } catch (e) {
                                      answers = String(question.answer).split(',').map((s: string) => s.trim()).filter(Boolean)
                                    }
                                  } else {
                                    answers = [String(question.answer || '')]
                                  }

                                  if (answers.length === 0) {
                                    return <p className="text-sm text-muted-foreground">No accepted answers specified.</p>
                                  }

                                  return answers.map((ans: string, idx: number) => (
                                    <div key={idx} className="p-3 rounded-md border bg-muted/50">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm">{ans}</span>
                                      </div>
                                    </div>
                                  ))
                                } catch (e) {
                                  return <p className="text-sm text-destructive">Error parsing enumeration answers</p>
                                }
                              })()}
                            </div>
                          </>
                        ) : (
                          <>
                            <Label className="text-sm font-semibold">Correct Answer:</Label>
                            <p className="text-sm mt-1 p-3 rounded-md bg-green-50 border border-green-500 dark:bg-green-950/30">
                              {question.answer}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
