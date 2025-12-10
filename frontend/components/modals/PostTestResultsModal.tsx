"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, Award, User, BookOpen } from "lucide-react"

interface PostTestResult {
  result_id: number
  post_test_id: number
  student_id: number
  student_name: string
  post_test_title: string
  subject_name: string
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number
  passed: boolean
  completed_at: string
  passing_score: number
}

interface Booking {
  booking_id: number
  tutor_id: number
  tutor_name: string
  student_id: number
  student_name: string
  status?: string
}

interface PostTestResultsModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: number
  booking: Booking
  currentUserId: number
}

export default function PostTestResultsModal({ isOpen, onClose, bookingId, booking, currentUserId }: PostTestResultsModalProps) {
  const [results, setResults] = useState<PostTestResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchResults()
    }
  }, [isOpen, bookingId])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/post-test-results?booking_id=${bookingId}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    }
    setLoading(false)
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  const isStudent = currentUserId === booking.student_id
  const isTutor = currentUserId === booking.tutor_id

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            {isStudent ? 'Your Post-Test Results' : 'Student Post-Test Results'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-semibold">
                      {isStudent ? `Tutor: ${booking.tutor_name}` : `Student: ${booking.student_name}`}
                    </div>
                    <div className="text-sm text-gray-500">Session ID: {booking.booking_id}</div>
                  </div>
                </div>
                <Badge variant={booking.status === 'Completed' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading results...</p>
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Available</h3>
                <p className="text-gray-500">
                  {isStudent 
                    ? "You haven't completed any post-tests for this session yet." 
                    : "The student hasn't completed any post-tests for this session yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.result_id} className={`border-l-4 ${result.passed ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.post_test_title}</CardTitle>
                        <p className="text-sm text-gray-600">{result.subject_name}</p>
                      </div>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {result.score}%
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.correct_answers}/{result.total_questions}
                        </div>
                        <div className="text-xs text-gray-500">Correct</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatTime(result.time_taken)}
                        </div>
                        <div className="text-xs text-gray-500">Time Taken</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {result.passing_score}%
                        </div>
                        <div className="text-xs text-gray-500">Required</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Completed: {formatDate(result.completed_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                          {result.passed ? 'Meets requirements' : 'Below passing score'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}