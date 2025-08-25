"use client"

import { useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Brain, Clock, Trophy, Plus, Search, Filter, Star, Play, CheckCircle, Trash2, Edit } from "lucide-react"
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
  duration: string
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
  const { currentUser } = useUser()
  const { toast } = useToast()

  // Database hooks
  const { quizzes, loading: quizzesLoading, error: quizzesError, refetch: refetchQuizzes } = useQuizzes()
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { questions, loading: questionsLoading } = useQuizQuestions(currentQuiz?.id || currentQuiz?.quiz_id || null)
  const { createAttempt } = useQuizAttempts()

  // Convert database quiz to component Quiz format
  const quizList = quizzes.map(dbQuiz => ({
    id: dbQuiz.quizzes_id,
    quiz_id: dbQuiz.quizzes_id,
    title: dbQuiz.title,
    subject: dbQuiz.subject_name,
    questions: [], // Will be loaded separately when needed
    duration: `${dbQuiz.duration || 15} min`,
    difficulty: dbQuiz.difficulty || 'Medium',
    description: dbQuiz.description || 'Test your knowledge in this subject area',
    completedTimes: 0, // TODO: Get from attempts
    bestScore: null, // TODO: Get from attempts
    lastAttempt: null, // TODO: Get from attempts
  }))

  // Form states for quiz creation
  const [quizTitle, setQuizTitle] = useState("")
  const [quizSubject, setQuizSubject] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [quizDuration, setQuizDuration] = useState("")
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

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    // Here you would implement the quiz taking functionality
    console.log("Starting quiz:", quiz.title)
  }

  const handleCreateQuiz = async () => {
    if (!quizTitle.trim() || !quizSubject.trim() || !quizDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (quizQuestions.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one question",
        variant: "destructive"
      })
      return
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

      // Create quiz in database
      const quizData = {
        title: quizTitle,
        subject_id: subject.subject_id,
        description: quizDescription,
        created_by: currentUser?.user_id || 1, // TODO: Get actual user ID
        quiz_type: "practice",
        duration: parseInt(quizDuration) || 15,
        difficulty: quizDifficulty,
        item_counts: quizQuestions.length
      }

      const response = await fetch('http://localhost:4000/api/quizzes', {
        method: currentQuiz ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentQuiz ? { ...quizData, id: currentQuiz.id } : quizData)
      })

      const result = await response.json()

      if (result.success) {
        // Refresh quizzes list
        await refetchQuizzes()
        
        toast({
          title: "Success",
          description: currentQuiz ? "Quiz updated successfully" : "Quiz created successfully"
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

    // Reset form
    setQuizTitle("")
    setQuizSubject("")
    setQuizDescription("")
    setQuizDuration("")
    setQuizDifficulty("")
    setQuizQuestions([])
    setCurrentQuiz(null)
    setShowCreateDialog(false)
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

  const handleManageQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz)
    setQuizTitle(quiz.title)
    setQuizSubject(quiz.subject)
    setQuizDescription(quiz.description)
    setQuizDuration(quiz.duration)
    setQuizDifficulty(quiz.difficulty)
    setQuizQuestions(quiz.questions)
    setShowCreateDialog(true)
  }

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
            <span>{quiz.questions.length} questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{quiz.duration}</span>
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

        {quiz.lastAttempt && (
          <div className="text-xs text-muted-foreground">
            Last attempt: {new Date(quiz.lastAttempt).toLocaleDateString()}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          {userRole === "admin" ? (
            <>
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => handleManageQuiz(quiz)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Manage Quiz
              </Button>
              <Button 
                size="sm"
                onClick={() => startQuiz(quiz)}
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </>
          ) : (
            <>
              <Button 
                className="flex-1" 
                onClick={() => startQuiz(quiz)}
                disabled={quiz.questions.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                {quiz.completedTimes > 0 ? "Retake Quiz" : "Start Quiz"}
              </Button>
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        
        {quiz.questions.length === 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            No questions added yet. {userRole === "admin" ? "Click 'Manage Quiz' to add questions." : "This quiz is not available yet."}
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
        {userRole === "admin" && (
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
                        <Input 
                          id="duration" 
                          placeholder="15 min"
                          value={quizDuration}
                          onChange={(e) => setQuizDuration(e.target.value)}
                        />
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
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search quizzes by title or subject..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizList.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      {quizList.length === 0 && !quizzesLoading && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No quizzes available</h3>
          {userRole === "admin" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quiz to start testing knowledge
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              No quizzes have been created yet. Check back later for new content!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
