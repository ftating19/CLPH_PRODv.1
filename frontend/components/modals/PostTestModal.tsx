"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, Plus, Trash2, XCircle, Clock, Target, BookOpen, Send } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"

interface PostTestQuestion {
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  correct_answer: string
  explanation?: string
  points: number
}

interface Booking {
  booking_id: number
  tutor_id: number
  tutor_name: string
  student_id: number
  student_name: string
  status?: string
  subject_id?: number
  subject_name?: string
  subject_code?: string
}

interface PostTestModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
}

export default function PostTestModal({ isOpen, onClose, booking }: PostTestModalProps) {
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Questions, 3: Review
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { currentUser } = useUser()
  const { toast } = useToast()

  // Basic info state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [timeLimit, setTimeLimit] = useState(30)
  const [passingScore, setPassingScore] = useState(70)
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [subjectName, setSubjectName] = useState("")
  
  // Questions state
  const [questions, setQuestions] = useState<PostTestQuestion[]>([
    {
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      points: 1
    }
  ])

  // Subjects list
  const [subjects, setSubjects] = useState<any[]>([])

  // Fetch subjects on mount
  useEffect(() => {
    if (isOpen) {
      fetchSubjects()
      // Reset form when modal opens and pre-fill subject from booking
      resetForm()
    }
  }, [isOpen, booking])

  const resetForm = () => {
    setStep(1)
    setTitle(`${booking.student_name} - Session Post-Test`)
    setDescription("")
    setTimeLimit(30)
    setPassingScore(70)
    // Pre-fill subject from booking if available
    if (booking.subject_id) {
      setSubjectId(booking.subject_id)
      setSubjectName(booking.subject_name || "")
    } else {
      setSubjectId(null)
      setSubjectName("")
    }
    setQuestions([{
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      points: 1
    }])
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/subjects')
      const data = await response.json()
      if (data.success) {
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  // Add a new question
  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      points: 1
    }])
  }

  // Remove a question
  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  // Update question
  const updateQuestion = (index: number, field: keyof PostTestQuestion, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  // Update option for multiple choice
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = ["", "", "", ""]
    }
    updated[questionIndex].options![optionIndex] = value
    setQuestions(updated)
  }

  // Validate form
  const validateStep = () => {
    if (step === 1) {
      return title.trim() !== "" && timeLimit >= 5 && timeLimit <= 180 && passingScore >= 1 && passingScore <= 100
    }
    
    if (step === 2) {
      return questions.every(q => {
        // Check if question text is filled
        if (q.question_text.trim() === "") return false
        
        // For essay questions, require both question text and answer
        if (q.question_type === 'short_answer') {
          return q.explanation && q.explanation.trim() !== "" // Answer is required for essays
        }
        
        // For multiple choice and true/false, check if correct answer is filled
        if (q.correct_answer.trim() === "") return false
        
        // For multiple choice, check if all options are filled
        if (q.question_type === 'multiple_choice') {
          return q.options && q.options.every(opt => opt.trim() !== "")
        }
        
        // For true/false, basic validation is enough
        return true
      })
    }
    
    return true
  }

  // Save post-test
  const savePostTest = async () => {
    if (!validateStep()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('http://localhost:4000/api/post-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          tutor_id: currentUser?.user_id,
          student_id: booking.student_id,
          title,
          description,
          subject_id: subjectId,
          subject_name: subjectName,
          time_limit: timeLimit,
          passing_score: passingScore,
          questions: questions.map((q, index) => ({
            ...q,
            order_number: index + 1
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Post-test submitted for faculty approval. You'll be notified once it's reviewed.",
          duration: 4000,
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create post-test",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving post-test:', error)
      toast({
        title: "Error",
        description: "An error occurred while creating the post-test",
        variant: "destructive",
      })
    }
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Create Post-Test</h2>
                <p className="text-purple-100">
                  Session with {booking.student_name} - Step {step} of 3
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <XCircle className="w-6 h-6" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-purple-600/30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Post-Test Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post-test title"
                      className="mt-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter post-test description (optional)"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject {booking.subject_id ? "" : "(Optional)"}</Label>
                    <Select 
                      value={subjectId?.toString() || ""} 
                      onValueChange={(value) => {
                        const id = value ? parseInt(value) : null
                        setSubjectId(id)
                        const subject = subjects.find(s => s.subject_id === id)
                        setSubjectName(subject?.subject_name || "")
                      }}
                      disabled={!!booking.subject_id}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={booking.subject_id ? `${booking.subject_code || ''} - ${booking.subject_name || 'Subject'}` : "Select subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                            {subject.subject_code} - {subject.subject_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {booking.subject_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Subject is pre-filled based on your tutoring application
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="timeLimit" className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Time Limit (minutes) *
                    </Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={timeLimit === 0 ? "" : timeLimit}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          setTimeLimit(0) // Internal representation of empty
                        } else {
                          const numValue = parseInt(value)
                          if (!isNaN(numValue) && numValue > 0) {
                            setTimeLimit(numValue)
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Set default if field is empty on blur
                        if (timeLimit === 0) {
                          setTimeLimit(30)
                        }
                      }}
                      min="5"
                      max="180"
                      className="mt-2"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passingScore" className="flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Passing Score (%) *
                    </Label>
                    <Input
                      id="passingScore"
                      type="number"
                      value={passingScore === 0 ? "" : passingScore}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          setPassingScore(0) // Internal representation of empty
                        } else {
                          const numValue = parseInt(value)
                          if (!isNaN(numValue) && numValue > 0) {
                            setPassingScore(numValue)
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Set default if field is empty on blur
                        if (passingScore === 0) {
                          setPassingScore(70)
                        } else if (passingScore > 100) {
                          setPassingScore(100)
                        }
                      }}
                      min="1"
                      max="100"
                      className="mt-2"
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Questions ({questions.length})
                </h3>
                <Button onClick={addQuestion} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        {questions.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Question Type */}
                      <div>
                        <Label>Question Type</Label>
                        <Select
                          key={`question-type-${index}-${question.question_type}`}
                          value={question.question_type}
                          onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => {
                            const updated = [...questions]
                            updated[index] = { 
                              ...updated[index], 
                              question_type: value,
                              correct_answer: '' // Reset correct answer when changing types
                            }
                            
                            // Set appropriate options based on question type
                            if (value === 'short_answer') {
                              updated[index].options = undefined
                            } else if (value === 'true_false') {
                              updated[index].options = ['True', 'False']
                            } else if (value === 'multiple_choice') {
                              updated[index].options = ['', '', '', '']
                            }
                            
                            setQuestions(updated)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="short_answer">Essay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Question Text */}
                      <div>
                        <Label>Question Text *</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          placeholder="Enter your question"
                          className="mt-2"
                          rows={2}
                        />
                      </div>

                      {/* Options for Multiple Choice and True/False display */}
                      {question.question_type === 'multiple_choice' && (
                        <div>
                          <Label>Answer Options *</Label>
                          <div className="space-y-2 mt-2">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.question_type === 'true_false' && (
                        <div>
                          <Label>Answer Options</Label>
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                                A
                              </span>
                              <Input value="True" disabled className="bg-gray-50" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                                B
                              </span>
                              <Input value="False" disabled className="bg-gray-50" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Correct Answer - Only for Multiple Choice and True/False */}
                      {question.question_type !== 'short_answer' && (
                        <div>
                          <Label>Correct Answer *</Label>
                          {question.question_type === 'multiple_choice' ? (
                            <Select
                              value={question.correct_answer}
                              onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                              <SelectContent>
                                {question.options?.map((option, optIndex) => (
                                  option.trim() && (
                                    <SelectItem key={optIndex} value={option}>
                                      {String.fromCharCode(65 + optIndex)} - {option}
                                    </SelectItem>
                                  )
                                ))}
                              </SelectContent>
                            </Select>
                          ) : question.question_type === 'true_false' ? (
                            <Select
                              value={question.correct_answer}
                              onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="True">True</SelectItem>
                                <SelectItem value="False">False</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : null}
                        </div>
                      )}

                      {/* Explanation/Answer */}
                      <div>
                        <Label>
                          {question.question_type === 'short_answer' ? 'Answer *' : 'Explanation (Optional)'}
                        </Label>
                        <Textarea
                          value={question.explanation || ""}
                          onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                          placeholder={
                            question.question_type === 'short_answer' 
                              ? "Enter the complete answer to this essay question"
                              : "Explain why this is the correct answer"
                          }
                          className="mt-2"
                          rows={question.question_type === 'short_answer' ? 4 : 2}
                        />
                      </div>

                      {/* Points */}
                      <div className="w-32">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Review & Publish
              </h3>

              <Card>
                <CardHeader>
                  <CardTitle>Post-Test Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Title:</Label>
                      <p>{title}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Student:</Label>
                      <p>{booking.student_name}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Time Limit:</Label>
                      <p>{timeLimit} minutes</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Passing Score:</Label>
                      <p>{passingScore}%</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Total Questions:</Label>
                      <p>{questions.length}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Total Points:</Label>
                      <p>{questions.reduce((sum, q) => sum + q.points, 0)}</p>
                    </div>
                  </div>

                  {description && (
                    <div>
                      <Label className="font-semibold">Description:</Label>
                      <p className="text-gray-600">{description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Ready to Publish</h4>
                <p className="text-blue-700 text-sm">
                  Once approved by faculty, the student ({booking.student_name}) will be notified and can take the post-test. 
                  The test will be available until completed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 rounded-b-xl">
          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
            </div>
            
            <div className="space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={!validateStep()}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={savePostTest}
                  disabled={saving || !validateStep()}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Publishing...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}