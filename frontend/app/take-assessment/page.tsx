"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useToast } from '@/hooks/use-toast'
import { usePreAssessmentGuard } from '@/hooks/use-pre-assessment-guard'
import { apiUrl } from '@/lib/api-config'

interface Question {
  id: number
  type: "multiple-choice" | "true-false" | "enumeration" | "essay"
  question: string
  options?: string[]
  points: number
  subject_name?: string
  subject_code?: string
}

interface Answer {
  questionId: number
  answer: string
}

function TakeAssessmentContent() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkPreAssessmentStatus } = usePreAssessmentGuard()

  const assessmentId = searchParams?.get('id')
  const isRequired = searchParams?.get('required') === 'true'

  const [assessment, setAssessment] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && assessment) {
      handleSubmitAssessment()
    }
  }, [timeLeft, assessment])

  // Fetch assessment data
  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentData()
    }
  }, [assessmentId])

  const fetchAssessmentData = async () => {
    try {
      setIsLoading(true)

      // Fetch assessment details
      const assessmentResponse = await fetch(apiUrl(`/api/pre-assessments/${assessmentId}`))
      if (!assessmentResponse.ok) throw new Error('Failed to fetch assessment')
      const assessmentData = await assessmentResponse.json()
      
      // Fetch questions
      const questionsResponse = await fetch(apiUrl(`/api/pre-assessment-questions/pre-assessment/${assessmentId}`))
      if (!questionsResponse.ok) throw new Error('Failed to fetch questions')
      const questionsData = await questionsResponse.json()

      setAssessment(assessmentData.preAssessment)
      setQuestions(questionsData.questions || [])
      
      // Initialize answers array
      const initialAnswers = (questionsData.questions || []).map((q: Question) => ({
        questionId: q.id,
        answer: ""
      }))
      setAnswers(initialAnswers)

      // Set timer (convert to seconds)
      const durationInSeconds = assessmentData.preAssessment.duration_unit === 'hours' 
        ? assessmentData.preAssessment.duration * 3600
        : assessmentData.preAssessment.duration * 60
      setTimeLeft(durationInSeconds)

    } catch (error) {
      console.error('Error fetching assessment data:', error)
      toast({
        title: "Error",
        description: "Failed to load assessment. Please try again.",
        variant: "destructive"
      })
      router.push('/pre-assessments')
    } finally {
      setIsLoading(false)
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
      const submissionData = {
        pre_assessment_id: parseInt(assessmentId!),
        user_id: currentUser?.user_id,
        answers: answers,
        time_taken: timeLeft > 0 ? (assessment.duration * (assessment.duration_unit === 'hours' ? 3600 : 60)) - timeLeft : assessment.duration * (assessment.duration_unit === 'hours' ? 3600 : 60)
      }

      const response = await fetch(apiUrl('/api/pre-assessment-results'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) throw new Error('Failed to submit assessment')

      toast({
        title: "Assessment Submitted",
        description: "Your answers have been recorded successfully.",
        variant: "default"
      })

      // If this was a required assessment, refresh the guard status
      if (isRequired) {
        await checkPreAssessmentStatus()
        router.push('/dashboard')
      } else {
        router.push('/pre-assessments')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>
              The assessment you're trying to access is not available or has no questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/pre-assessments')}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {assessment.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
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
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {currentQuestion.subject_code && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded">
                    {currentQuestion.subject_code}
                  </span>
                )}
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <CardDescription className="text-base mt-2">
              {currentQuestion.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Multiple Choice */}
            {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
              <RadioGroup 
                value={currentAnswer?.answer || ""} 
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
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
            {currentQuestion.type === "true-false" && (
              <RadioGroup 
                value={currentAnswer?.answer || ""} 
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
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
            {(currentQuestion.type === "essay" || currentQuestion.type === "enumeration") && (
              <Textarea
                value={currentAnswer?.answer || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.type === "enumeration" 
                  ? "Enter your answers separated by commas..."
                  : "Enter your answer here..."
                }
                rows={currentQuestion.type === "essay" ? 6 : 3}
                className="w-full"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
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
  )
}

export default function TakeAssessment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TakeAssessmentContent />
    </Suspense>
  )
}