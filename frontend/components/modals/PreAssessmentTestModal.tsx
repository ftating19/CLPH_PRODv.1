"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, XCircle, AlertCircle, BookOpen, Loader2, ArrowRight, RotateCcw } from "lucide-react"
import { usePreAssessmentsByProgramAndYear } from "@/hooks/use-pre-assessments"
import { useToast } from "@/hooks/use-toast"

interface User {
  user_id: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  program: string
  role: string
  status: string
  year_level?: string
  first_login: number
  created_at: string
  description?: string
}

interface PreAssessment {
  id: number
  title: string
  description: string
  program: string
  year_level: string
  duration: number
  duration_unit: string
  difficulty: "Easy" | "Medium" | "Hard"
  question_count?: number
}

interface Question {
  id: number
  question: string  // Backend returns 'question' not 'question_text'
  question_type: 'multiple_choice' | 'multiple-choice' | 'true_false' | 'true-false' | 'identification'
  options?: string[]
  correct_answer: string
  points: number
  subject_id?: number
  subject_name?: string
  subject_code?: string
  explanation?: string
}

interface PreAssessmentTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User | null
}

type TestStage = 'selection' | 'taking' | 'completed'

export default function PreAssessmentTestModal({ open, onOpenChange, currentUser }: PreAssessmentTestModalProps) {
  const [testStage, setTestStage] = useState<TestStage>('selection')
  const [selectedAssessment, setSelectedAssessment] = useState<PreAssessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [testStartTime, setTestStartTime] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [alreadyTakenAssessments, setAlreadyTakenAssessments] = useState<Set<number>>(new Set())
  const [checkingExistingResults, setCheckingExistingResults] = useState(false)

  const { toast } = useToast()

  // Fetch pre-assessments based on user's program and year level
  const { preAssessments, loading: assessmentsLoading, error: assessmentsError } = usePreAssessmentsByProgramAndYear(
    currentUser?.program || null,
    currentUser?.year_level || null
  )

  // Timer effect
  useEffect(() => {
    if (testStage === 'taking' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [testStage, timeRemaining])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setTestStage('selection')
      setSelectedAssessment(null)
      setQuestions([])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setTimeRemaining(0)
      setTestStartTime(null)
      setScore(0)
      setTotalPoints(0)
    } else if (open && currentUser) {
      // Check for existing results when modal opens
      checkExistingResults()
    }
  }, [open, currentUser])

  // Check if user has already taken any assessments
  const checkExistingResults = async () => {
    if (!currentUser) return

    try {
      setCheckingExistingResults(true)
      const response = await fetch(`http://localhost:4000/api/pre-assessment-results/user/${currentUser.user_id}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.results) {
          const takenIds = new Set<number>(data.results.map((result: any) => result.pre_assessment_id))
          setAlreadyTakenAssessments(takenIds)
        }
      }
    } catch (error) {
      console.error('Error checking existing results:', error)
    } finally {
      setCheckingExistingResults(false)
    }
  }

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const fetchQuestions = async (assessmentId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/api/pre-assessment-questions/pre-assessment/${assessmentId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        const fetchedQuestions = data.questions || []
        console.log('Raw questions from backend:', fetchedQuestions)
        
        // Shuffle questions for randomization
        const shuffledQuestions = shuffleArray(fetchedQuestions)
        
        // For multiple choice questions, also shuffle the options
        const questionsWithShuffledOptions = shuffledQuestions.map((question: any) => {
          console.log('Processing question:', {
            id: question.id,
            type: question.question_type,
            options: question.options,
            optionsType: typeof question.options
          })
          
          if (question.question_type === 'multiple_choice' && question.options) {
            let optionsArray;
            
            // Handle both string (JSON) and array options
            if (typeof question.options === 'string') {
              try {
                // Handle case where options might be stored as stringified JSON
                optionsArray = JSON.parse(question.options);
                if (!Array.isArray(optionsArray)) {
                  // If parsed result is not an array, try to split by common delimiters
                  optionsArray = question.options.split(/[,|\n|;]/).map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);
                }
              } catch (e) {
                console.error('Error parsing options JSON:', e);
                // Try splitting by common delimiters as fallback
                optionsArray = question.options.split(/[,|\n|;]/).map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);
              }
            } else if (Array.isArray(question.options)) {
              optionsArray = question.options;
            } else {
              console.warn('Options is neither string nor array:', question.options);
              optionsArray = [];
            }
            
            console.log('Question options processing:', {
              questionId: question.id,
              originalOptions: question.options,
              optionsType: typeof question.options,
              processedOptions: optionsArray,
              isArray: Array.isArray(optionsArray)
            });
            
            const shuffledOptions = shuffleArray(optionsArray);
            return {
              ...question,
              options: shuffledOptions
            };
          }
          return question;
        });
        
        console.log('Final processed questions:', questionsWithShuffledOptions)
        setQuestions(questionsWithShuffledOptions)
        setTotalPoints(questionsWithShuffledOptions.reduce((sum, q) => sum + (q.points || 1), 0))
      } else {
        throw new Error(data.error || 'Failed to fetch questions')
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
      toast({
        title: "Error",
        description: "Failed to load test questions. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async (assessment: PreAssessment) => {
    setSelectedAssessment(assessment)
    await fetchQuestions(assessment.id)
    
    // Set timer duration
    const durationInMinutes = assessment.duration_unit === 'hours' ? assessment.duration * 60 : assessment.duration
    setTimeRemaining(durationInMinutes * 60) // Convert to seconds
    setTestStartTime(new Date())
    setTestStage('taking')
  }

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const calculateScore = () => {
    let correctAnswers = 0
    let totalScore = 0

    questions.forEach(question => {
      const userAnswer = answers[question.id]
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()) {
        correctAnswers++
        totalScore += question.points || 1
      }
    })

    return { correctAnswers, totalScore }
  }

  const handleSubmitTest = async () => {
    const { correctAnswers, totalScore } = calculateScore()
    setScore(totalScore)
    setTestStage('completed')

    // Submit results to backend
    if (currentUser && selectedAssessment && testStartTime) {
      try {
        const timeTakenSeconds = Math.floor((Date.now() - testStartTime.getTime()) / 1000)
        const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0

        // Format answers with detailed information
        const formattedAnswers = questions.map(question => {
          const userAnswer = answers[question.id] || ''
          const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()
          
          return {
            question_id: question.id,
            question_text: question.question,
            question: question.question,
            user_answer: userAnswer,
            selected_answer: userAnswer,
            correct_answer: question.correct_answer,
            is_correct: isCorrect,
            subject_id: question.subject_id || null,
            subject_name: question.subject_name || '',
            explanation: question.explanation || '',
            points: question.points || 1
          }
        })

        console.log('📊 Submitting Pre-Assessment Results:', {
          totalQuestions: questions.length,
          correctAnswers: correctAnswers,
          totalScore: totalScore,
          totalPoints: totalPoints,
          percentage: percentage,
          answersCount: formattedAnswers.length,
          correctInAnswers: formattedAnswers.filter(a => a.is_correct).length,
          incorrectInAnswers: formattedAnswers.filter(a => !a.is_correct).length
        })
        console.log('📝 Sample formatted answers:', formattedAnswers.slice(0, 3))
        console.log('🔍 Checking first answer has subject_id:', formattedAnswers[0]?.subject_id ? 'YES ✅' : 'NO ❌')
        console.log('🔍 Checking first answer has is_correct:', formattedAnswers[0]?.hasOwnProperty('is_correct') ? 'YES ✅' : 'NO ❌')

        const resultData = {
          user_id: currentUser.user_id,
          pre_assessment_id: selectedAssessment.id,
          score: totalScore,
          total_points: totalPoints,
          correct_answers: correctAnswers,
          total_questions: questions.length,
          time_taken_seconds: timeTakenSeconds,
          started_at: testStartTime.toISOString(),
          answers: formattedAnswers
        }

        const response = await fetch('http://localhost:4000/api/pre-assessment-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resultData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to submit results')
        }

        const data = await response.json()
        console.log('Test results submitted successfully:', data)

        toast({
          title: "Test Completed & Saved",
          description: `You scored ${totalScore} out of ${totalPoints} points (${correctAnswers}/${questions.length} correct). Results have been saved.`,
        })
      } catch (error) {
        console.error('Error submitting test results:', error)
        
        toast({
          title: "Test Completed",
          description: `You scored ${totalScore} out of ${totalPoints} points (${correctAnswers}/${questions.length} correct). Note: Results could not be saved.`,
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Test Completed",
        description: `You scored ${totalScore} out of ${totalPoints} points (${correctAnswers}/${questions.length} correct)`,
      })
    }
  }

  const handleSkipPreAssessment = () => {
    if (!currentUser) return
    
    // Store skip status in localStorage
    localStorage.setItem(`preAssessmentSkipped_${currentUser.user_id}`, 'true')
    localStorage.setItem(`preAssessmentSkippedDate_${currentUser.user_id}`, new Date().toISOString())
    
    toast({
      title: "Pre-Assessment Skipped",
      description: "You can access the system, but tutor matching will not be available. You can take the assessment later to unlock tutor matching.",
    })
    
    // Close the modal
    onOpenChange(false)
    
    // Trigger an event to notify other components
    window.dispatchEvent(new CustomEvent('preAssessmentSkipped', { 
      detail: { userId: currentUser.user_id } 
    }))
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const answeredQuestions = Object.keys(answers).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Pre-Assessment Test
          </DialogTitle>
          <DialogDescription>
            {testStage === 'selection' && 'Choose a test that matches your program and year level'}
            {testStage === 'taking' && selectedAssessment && `Taking: ${selectedAssessment.title}`}
            {testStage === 'completed' && 'Test completed! View your results below.'}
          </DialogDescription>
        </DialogHeader>

        {/* Selection Stage */}
        {testStage === 'selection' && (
          <div className="space-y-4">
            {!currentUser && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">Please log in to take a test</p>
              </div>
            )}

            {currentUser && !currentUser.program && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">Program not specified</p>
                <p className="text-muted-foreground">Please update your profile with your program information.</p>
              </div>
            )}

            {currentUser && !currentUser.year_level && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">Year level not specified</p>
                <p className="text-muted-foreground">Please update your profile with your year level information.</p>
              </div>
            )}

            {currentUser && currentUser.program && currentUser.year_level && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Available Tests for:</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">{currentUser.program}</Badge>
                    <Badge variant="outline">{currentUser.year_level}</Badge>
                  </div>
                </div>

                {assessmentsLoading && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading available tests...</p>
                  </div>
                )}

                {checkingExistingResults && !assessmentsLoading && (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Checking your test history...</p>
                  </div>
                )}

                {assessmentsError && (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-red-600">Error loading tests</p>
                    <p className="text-muted-foreground">{assessmentsError}</p>
                  </div>
                )}

                {!assessmentsLoading && !assessmentsError && preAssessments.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold">No tests available</p>
                    <p className="text-muted-foreground">
                      There are currently no pre-assessment tests available for {currentUser.program} - {currentUser.year_level}.
                    </p>
                  </div>
                )}

                {!assessmentsLoading && !assessmentsError && preAssessments.length > 0 && (
                  <div className="grid gap-4">
                    {preAssessments.map((assessment) => {
                      const alreadyTaken = alreadyTakenAssessments.has(assessment.id)
                      return (
                        <Card key={assessment.id} className={`transition-shadow ${alreadyTaken ? 'border-green-300 bg-green-50/30 dark:bg-green-950/20' : 'cursor-pointer hover:shadow-md'}`}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-xl">{assessment.title}</CardTitle>
                                  {alreadyTaken && (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription className="mt-2">{assessment.description}</CardDescription>
                              </div>
                              <Badge className={getDifficultyColor(assessment.difficulty)}>
                                {assessment.difficulty}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {alreadyTaken && (
                              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                  ✓ You have already completed this pre-assessment.
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  You cannot retake this assessment. Your results have been saved.
                                </p>
                              </div>
                            )}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {assessment.duration} {assessment.duration_unit}
                                  </div>
                                  {assessment.question_count && (
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="w-4 h-4" />
                                      {assessment.question_count} questions
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  onClick={() => {
                                    if (alreadyTaken) {
                                      toast({
                                        title: "Already Completed",
                                        description: "You have already taken this pre-assessment. You cannot retake it.",
                                        variant: "destructive"
                                      })
                                    } else {
                                      handleStartTest(assessment)
                                    }
                                  }}
                                  className={alreadyTaken ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                                  disabled={alreadyTaken}
                                >
                                  {alreadyTaken ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Completed
                                    </>
                                  ) : (
                                    <>
                                      Start Test
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {/* Skip Button below Start Test button */}
                              {!alreadyTaken && (
                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSkipPreAssessment}
                                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30"
                                  >
                                    Skip Pre-Assessment
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Taking Stage */}
        {testStage === 'taking' && currentQuestion && (
          <div className="space-y-6">
            {/* Header with timer and progress */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-red-600 border-red-200">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              <Badge variant="outline">
                {answeredQuestions}/{questions.length} answered
              </Badge>
            </div>

            <Progress value={progress} className="w-full" />

            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {currentQuestion.question}
                  </CardTitle>
                  <div className="flex gap-2">
                    {currentQuestion.subject_code && (
                      <Badge variant="outline" className="text-xs">
                        {currentQuestion.subject_code}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {currentQuestion.points || 1} point{(currentQuestion.points || 1) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'multiple-choice') ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      Select your answer:
                    </div>
                    
                    {currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                      <>
                        {currentQuestion.options.map((option: string, optionIndex: number) => (
                          <div key={optionIndex} className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-all ${
                            answers[currentQuestion.id] === option 
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-500 dark:border-blue-700 shadow-md"
                              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          }`}>
                            <input
                              type="radio"
                              id={`option-${optionIndex}`}
                              name={`question-${currentQuestion.id}`}
                              value={option}
                              checked={answers[currentQuestion.id] === option}
                              onChange={(e) => handleAnswerChange(e.target.value)}
                              className="w-5 h-5 cursor-pointer"
                            />
                            <Label 
                              htmlFor={`option-${optionIndex}`}
                              className="flex-1 cursor-pointer text-base"
                              onClick={() => handleAnswerChange(option)}
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 border-2 border-red-500 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="font-bold text-red-700 dark:text-red-300 mb-2">❌ Error: No options to display</p>
                        <p className="text-sm text-red-600 dark:text-red-400">Options data: {JSON.stringify(currentQuestion.options)}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">Options type: {typeof currentQuestion.options}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">Is Array: {Array.isArray(currentQuestion.options) ? 'Yes' : 'No'}</p>
                        {currentQuestion.options && !Array.isArray(currentQuestion.options) && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2">⚠️ Options exists but is not an array!</p>
                        )}
                        {Array.isArray(currentQuestion.options) && currentQuestion.options.length === 0 && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2">⚠️ Options array is empty!</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (currentQuestion.question_type === 'true_false' || currentQuestion.question_type === 'true-false') ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      Select your answer:
                    </div>
                    
                    {['True', 'False'].map((option, optionIndex) => (
                      <div key={optionIndex} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        answers[currentQuestion.id] === option 
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                          : "hover:bg-muted cursor-pointer"
                      }`}>
                        <input
                          type="radio"
                          id={`tf-option-${optionIndex}`}
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          className="w-4 h-4"
                        />
                        <Label 
                          htmlFor={`tf-option-${optionIndex}`}
                          className="flex-1 cursor-pointer"
                          onClick={() => handleAnswerChange(option)}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : currentQuestion.question_type === 'identification' ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      Type your answer below:
                    </div>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your answer..."
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitTest}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completed Stage */}
        {testStage === 'completed' && (
          <div className="space-y-6 text-center">
            <div>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Test Completed!</h2>
              <p className="text-muted-foreground">Thank you for taking the pre-assessment test.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{score}</p>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalPoints}</p>
                    <p className="text-sm text-muted-foreground">Possible Points</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-lg">
                    Percentage: <span className="font-semibold">{Math.round((score / totalPoints) * 100)}%</span>
                  </p>
                </div>

                {selectedAssessment && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Test Information</h3>
                    <p className="text-sm"><strong>Test:</strong> {selectedAssessment.title}</p>
                    <p className="text-sm"><strong>Difficulty:</strong> {selectedAssessment.difficulty}</p>
                    <p className="text-sm"><strong>Questions:</strong> {questions.length}</p>
                    <p className="text-sm"><strong>Time Taken:</strong> {testStartTime && formatTime(Math.floor((Date.now() - testStartTime.getTime()) / 1000))}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setTestStage('selection')
                  setSelectedAssessment(null)
                  setQuestions([])
                  setCurrentQuestionIndex(0)
                  setAnswers({})
                  setScore(0)
                  setTotalPoints(0)
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Take Another Test
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading test questions...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}