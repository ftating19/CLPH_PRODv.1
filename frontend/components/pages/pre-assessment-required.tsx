"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, BookOpen, Clock, Target, CheckCircle, MessageSquare, ArrowLeft, ArrowRight, Play, Trophy } from 'lucide-react'
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
import { useUser } from '@/contexts/UserContext'
import { useToast } from '@/hooks/use-toast'

interface PreAssessment {
  id: number
  title: string
  description: string
  program: string
  year_level: string
  duration: number
  duration_unit: string
  difficulty: "Easy" | "Medium" | "Hard"
  status: "active" | "inactive"
  question_count?: number
}

interface Question {
  id: number
  type: "multiple-choice" | "true-false" | "enumeration" | "essay"
  question: string
  options?: string[]
  correctAnswer?: string
  points: number
  subject_name?: string
  subject_code?: string
}

interface Answer {
  questionId: number
  answer: string
}

interface PreAssessmentRequiredProps {
  availablePreAssessments: PreAssessment[]
  onPreAssessmentComplete: () => void
}

export default function PreAssessmentRequired({ 
  availablePreAssessments, 
  onPreAssessmentComplete 
}: PreAssessmentRequiredProps) {
  const { currentUser } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedAssessment, setSelectedAssessment] = useState<PreAssessment | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && showAssessmentModal) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && selectedAssessment && showAssessmentModal) {
      handleSubmitAssessment()
    }
  }, [timeLeft, selectedAssessment, showAssessmentModal])

  const handleStartAssessment = async (assessment: PreAssessment) => {
    setSelectedAssessment(assessment)
    setShowStartDialog(true)
  }

  const handleConfirmStart = async () => {
    if (!selectedAssessment) return

    try {
      setIsLoadingQuestions(true)
      setShowStartDialog(false)

      // Fetch questions
      const questionsResponse = await fetch(`http://localhost:4000/api/pre-assessment-questions/pre-assessment/${selectedAssessment.id}`)
      if (!questionsResponse.ok) throw new Error('Failed to fetch questions')
      const questionsData = await questionsResponse.json()
      
      // Transform questions data to ensure options are properly parsed
      const transformedQuestions = (questionsData.questions || []).map((q: any) => ({
        id: q.id,
        type: q.question_type || q.type,
        question: q.question,
        options: typeof q.options === 'string' ? JSON.parse(q.options || '[]') : q.options,
        correctAnswer: q.correct_answer,
        points: q.points,
        subject_id: q.subject_id,
        subject_name: q.subject_name,
        subject_code: q.subject_code
      }))
      
      console.log('Transformed questions:', transformedQuestions)
      
      setQuestions(transformedQuestions)
      
      // Initialize answers array
      const initialAnswers = transformedQuestions.map((q: Question) => ({
        questionId: q.id,
        answer: ""
      }))
      setAnswers(initialAnswers)
      setCurrentQuestionIndex(0)

      // Set timer (convert to seconds)
      const durationInSeconds = selectedAssessment.duration_unit === 'hours' 
        ? selectedAssessment.duration * 3600
        : selectedAssessment.duration * 60
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

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true)
    try {
      // Calculate score and statistics
      let score = 0
      let correctAnswers = 0
      let totalPoints = 0
      
      questions.forEach((question, index) => {
        const userAnswer = answers[index]?.answer || ""
        totalPoints += question.points || 1
        
        if (question.type === "multiple-choice" || question.type === "true-false") {
          if (userAnswer === question.correctAnswer) {
            score += question.points || 1
            correctAnswers++
          }
        }
        // For essay and enumeration, we'll assume they need manual grading
        // So we don't add to score automatically
      })
      
      const timeTakenSeconds = timeLeft > 0 
        ? (selectedAssessment!.duration * (selectedAssessment!.duration_unit === 'hours' ? 3600 : 60)) - timeLeft 
        : selectedAssessment!.duration * (selectedAssessment!.duration_unit === 'hours' ? 3600 : 60)

      const submissionData = {
        user_id: currentUser?.user_id,
        pre_assessment_id: selectedAssessment!.id,
        score: score,
        total_points: totalPoints,
        correct_answers: correctAnswers,
        total_questions: questions.length,
        time_taken_seconds: timeTakenSeconds,
        started_at: new Date().toISOString(),
        answers: JSON.stringify(answers) // Convert answers to JSON string
      }

      console.log('Submitting assessment data:', submissionData)

      const response = await fetch('http://localhost:4000/api/pre-assessment-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Server response:', response.status, errorData)
        throw new Error(`Failed to submit assessment: ${response.status} ${errorData}`)
      }

      toast({
        title: "Assessment Completed!",
        description: "Your answers have been recorded successfully. You now have access to your dashboard.",
        variant: "default"
      })

      setShowAssessmentModal(false)
      onPreAssessmentComplete()
      router.push('/dashboard')

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'Hard':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  if (availablePreAssessments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">All Set!</CardTitle>
            <CardDescription>
              No pre-assessments are required for your program at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pre-Assessment Required
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Welcome, {currentUser?.first_name}! Before accessing your dashboard, please complete 
            one of the following pre-assessments to help us understand your current knowledge level.
          </p>
        </div>

        {/* Assessment Cards */}
        <div className={`grid gap-6 ${
          availablePreAssessments.length === 1 
            ? 'max-w-2xl mx-auto' 
            : 'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {availablePreAssessments.map((assessment) => (
            <Card 
              key={assessment.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAssessment?.id === assessment.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : ''
              } ${
                availablePreAssessments.length === 1 
                  ? 'p-2' 
                  : ''
              }`}
              onClick={() => setSelectedAssessment(assessment)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`mb-2 ${
                      availablePreAssessments.length === 1 ? 'text-2xl' : 'text-lg'
                    }`}>
                      {assessment.title}
                    </CardTitle>
                    <CardDescription className={`${
                      availablePreAssessments.length === 1 ? 'text-base' : 'text-sm'
                    } line-clamp-3`}>
                      {assessment.description}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assessment.difficulty)}`}>
                    {assessment.difficulty}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Assessment Details */}
                  <div className={`grid gap-4 ${
                    availablePreAssessments.length === 1 ? 'grid-cols-4 text-base' : 'grid-cols-2 text-sm'
                  }`}>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className={`mr-2 ${
                        availablePreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                      }`} />
                      {assessment.duration} {assessment.duration_unit}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <BookOpen className={`mr-2 ${
                        availablePreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                      }`} />
                      {assessment.question_count || 'N/A'} questions
                    </div>
                    {availablePreAssessments.length === 1 && (
                      <>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Target className="w-5 h-5 mr-2" />
                          {assessment.difficulty} Level
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-5 h-5 mr-2" />
                          {assessment.program}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Program & Year Level - only show if multiple assessments */}
                  {availablePreAssessments.length > 1 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {assessment.program} • Year {assessment.year_level}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartAssessment(assessment)
                    }}
                    disabled={isStarting}
                    className={`w-full mt-4 ${
                      availablePreAssessments.length === 1 ? 'h-12 text-lg' : ''
                    }`}
                    variant={selectedAssessment?.id === assessment.id ? "default" : "outline"}
                  >
                    {isStarting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <Target className={`mr-2 ${
                          availablePreAssessments.length === 1 ? 'w-5 h-5' : 'w-4 h-4'
                        }`} />
                        Start Assessment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              📝 What you need to know:
            </h3>
            <div className="max-w-3xl mx-auto">
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 text-left inline-block">
                <li>• You only need to complete <strong>one</strong> pre-assessment to proceed</li>
                <li>• Choose the assessment that best matches your current focus area</li>
                <li>• Assessment has a <strong>timer</strong> - ensure you have uninterrupted time</li>
                <li>• Complete all questions before time expires (auto-submit when timer ends)</li>
                <li>• Your results will help personalize your learning experience</li>
                <li>• Once completed, you'll have full access to your dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Having trouble? Contact your instructor or{' '}
            <Button variant="link" className="p-0 h-auto text-sm">
              visit our help center
            </Button>
          </p>
        </div>
      </div>

      {/* Start Assessment Confirmation Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Pre-Assessment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {selectedAssessment && (
                  <div className="space-y-3">
                    <div>You are about to start: <strong>{selectedAssessment.title}</strong></div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>• Duration: {selectedAssessment.duration} {selectedAssessment.duration_unit}</div>
                      <div>• Questions: {selectedAssessment.question_count || 'Multiple'}</div>
                      <div>• Difficulty: {selectedAssessment.difficulty}</div>
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
                    {selectedAssessment?.title}
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
                      onClick={handleSubmitAssessment}
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