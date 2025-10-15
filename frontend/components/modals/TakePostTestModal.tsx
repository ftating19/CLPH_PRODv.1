"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, XCircle, Award, Timer, Send } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

interface PostTestQuestion {
  id: number
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  points: number
}

interface PostTest {
  id: number
  title: string
  description: string
  time_limit: number
  passing_score: number
  total_points: number
  questions: PostTestQuestion[]
}

interface Booking {
  booking_id: number
  tutor_id: number
  tutor_name: string
  student_id: number
  student_name: string
  status?: string
}

interface TakePostTestModalProps {
  isOpen: boolean
  onClose: () => void
  postTestId: number
  booking: Booking
}

export default function TakePostTestModal({ isOpen, onClose, postTestId, booking }: TakePostTestModalProps) {
  const [postTest, setPostTest] = useState<PostTest | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{[questionId: number]: string}>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [startTime, setStartTime] = useState<number>(0)
  const [timeTakenSeconds, setTimeTakenSeconds] = useState<number>(0)
  const { currentUser } = useUser()

  // Fetch post-test details
  useEffect(() => {
    if (isOpen && postTestId) {
      fetchPostTest()
    }
  }, [isOpen, postTestId])

  // Timer effect
  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimeUp(true)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [testStarted, timeRemaining, testCompleted])

  const fetchPostTest = async () => {
    if (!postTestId || postTestId === 0) {
      console.warn('Invalid postTestId:', postTestId);
      return;
    }

    setLoading(true)
    try {
      console.log('Fetching post-test with ID:', postTestId);
      
      // Fetch post-test details
      const postTestResponse = await fetch(`http://localhost:4000/api/post-tests/${postTestId}`)
      const postTestData = await postTestResponse.json()

      if (!postTestData.success) {
        throw new Error('Failed to fetch post-test')
      }

      // Fetch questions
      const questionsResponse = await fetch(`http://localhost:4000/api/post-tests/${postTestId}/questions`)
      const questionsData = await questionsResponse.json()
      console.log('Questions response:', questionsData);

      if (questionsData.success) {
        const postTestWithQuestions = {
          ...postTestData.postTest,
          questions: questionsData.questions || []
        }
        console.log('Post-test with questions:', postTestWithQuestions);
        setPostTest(postTestWithQuestions)
        setTimeRemaining(postTestWithQuestions.time_limit * 60) // Convert minutes to seconds
      } else {
        console.error('Failed to fetch questions:', questionsData);
      }
    } catch (error) {
      console.error('Error fetching post-test:', error)
    }
    setLoading(false)
  }

  const startTest = () => {
    const now = Date.now()
    setStartTime(now)
    setTestStarted(true)
    setCurrentQuestionIndex(0)
  }

  const handleAnswerChange = (questionId: number, answer: string) => {
    console.log('Answer changed:', { questionId, answer });
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < (postTest?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    
    // Calculate time taken
    const endTime = Date.now()
    const timeTaken = Math.floor((endTime - startTime) / 1000) // seconds
    setTimeTakenSeconds(timeTaken)
    
    setSubmitting(true)
    try {
      const response = await fetch(`http://localhost:4000/api/post-tests/${postTestId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: currentUser?.user_id,
          booking_id: booking.booking_id,
          time_taken: timeTaken,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            question_id: parseInt(questionId),
            answer
          }))
        })
      })

      const data = await response.json()
      if (data.success) {
        setResult(data.result)
        setTestCompleted(true)
      } else {
        throw new Error(data.error || 'Failed to submit test')
      }
    } catch (error) {
      console.error('Error submitting test:', error)
      alert('Failed to submit test. Please try again.')
    }
    setSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = postTest ? ((currentQuestionIndex + 1) / postTest.questions.length) * 100 : 0

  if (!isOpen) return null

  console.log('TakePostTestModal rendering with:', { isOpen, postTestId, booking, postTest });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading post-test...</p>
          </div>
        ) : testCompleted ? (
          // Results view
          <div className="p-8">
            <div className="text-center mb-6">
              <div className={`rounded-full p-4 w-16 h-16 mx-auto mb-4 ${
                result?.percentage >= (postTest?.passing_score ?? 0) ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result?.percentage >= (postTest?.passing_score ?? 0) ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {result?.percentage >= (postTest?.passing_score ?? 0) ? 'Congratulations!' : 'Test Complete'}
              </h3>
              <p className="text-gray-600">
                {result?.percentage >= (postTest?.passing_score ?? 0)
                  ? 'You passed the post-test!' 
                  : 'You did not meet the passing score this time.'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{result?.correctAnswers || 0}/{result?.totalQuestions || 0}</div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{result?.percentage || 0}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatTime(timeTakenSeconds)}</div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-semibold text-gray-700">
                    Passing Score: {postTest?.passing_score}% | 
                    Your Score: {result?.percentage}% | 
                    Status: <span className={result?.passed ? 'text-green-600' : 'text-red-600'}>
                      {result?.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : !testStarted ? (
          // Test instructions
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{postTest?.title}</h3>
              <p className="text-gray-600">{postTest?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold">Time Limit</div>
                      <div className="text-sm text-gray-600">{postTest?.time_limit} minutes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-semibold">Passing Score</div>
                      <div className="text-sm text-gray-600">{postTest?.passing_score}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">Instructions:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Read each question carefully before answering</li>
                <li>• You can navigate between questions using the Next/Previous buttons</li>
                <li>• Make sure to answer all questions before submitting</li>
                <li>• The test will automatically submit when time runs out</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={startTest}>Start Test</Button>
            </div>
          </div>
        ) : (
          // Test taking view
          <div className="flex flex-col h-[90vh]">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{postTest?.title}</h3>
                <div className="flex items-center space-x-2 text-lg font-mono">
                  <Timer className="w-5 h-5" />
                  <span className={timeRemaining < 300 ? 'text-red-600' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-gray-600 mt-2">
                Question {currentQuestionIndex + 1} of {postTest?.questions.length}
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 p-6 overflow-y-auto">
              {(() => {
                console.log('Rendering questions section:', {
                  postTest: postTest,
                  currentQuestionIndex: currentQuestionIndex,
                  hasQuestions: (postTest?.questions?.length ?? 0) > 0,
                  currentQuestion: postTest?.questions?.[currentQuestionIndex]
                });
                return null;
              })()}
              
              {postTest?.questions?.[currentQuestionIndex] ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {postTest.questions[currentQuestionIndex].question_text}
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      Points: {postTest.questions[currentQuestionIndex].points}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {postTest.questions[currentQuestionIndex].question_type === 'multiple_choice' && (
                      <RadioGroup
                        value={answers[postTest.questions[currentQuestionIndex].id] || ""}
                        onValueChange={(value) => handleAnswerChange(postTest.questions[currentQuestionIndex].id, value)}
                      >
                        {postTest.questions[currentQuestionIndex].options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {postTest.questions[currentQuestionIndex].question_type === 'true_false' && (
                      <RadioGroup
                        value={answers[postTest.questions[currentQuestionIndex].id] || ""}
                        onValueChange={(value) => handleAnswerChange(postTest.questions[currentQuestionIndex].id, value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="True" id="true" />
                          <Label htmlFor="true" className="cursor-pointer">True</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="False" id="false" />
                          <Label htmlFor="false" className="cursor-pointer">False</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {postTest.questions[currentQuestionIndex].question_type === 'short_answer' && (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={answers[postTest.questions[currentQuestionIndex].id] || ""}
                        onChange={(e) => handleAnswerChange(postTest.questions[currentQuestionIndex].id, e.target.value)}
                        rows={4}
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {!postTest ? 'Loading post-test...' : 
                     !postTest.questions?.length ? 'No questions available for this post-test.' :
                     'Question not found.'}
                  </p>
                  {postTest && (
                    <div className="mt-4 text-sm text-gray-400">
                      <p>Post-test: {postTest.title}</p>
                      <p>Questions loaded: {postTest.questions?.length || 0}</p>
                      <p>Current index: {currentQuestionIndex}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="border-t p-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentQuestionIndex === (postTest?.questions.length || 0) - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || isTimeUp}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? 'Submitting...' : 'Submit Test'}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextQuestion}
                      disabled={currentQuestionIndex === (postTest?.questions.length || 0) - 1}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}