"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock, BookOpen, User, Calendar, Search, GraduationCap, CheckCircle, AlertCircle } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"

interface PostTest {
  id: number
  title: string
  description: string
  booking_id: number
  tutor_id: number
  student_id: number
  subject_id: number
  subject_name: string
  total_questions: number
  time_limit: number
  passing_score: number
  status: string
  created_at: string
  tutor_name: string
  session_date: string
  question_count: number
  test_status: 'available' | 'completed'
}

export default function StudentSessions() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  
  const [postTests, setPostTests] = useState<PostTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch available post-tests for the student
  const fetchPostTests = async () => {
    if (!currentUser?.user_id) return
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/api/post-tests/student/${currentUser.user_id}`)
      
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
        description: "Failed to load available post-tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPostTests()
  }, [currentUser?.user_id])

  // Filter post-tests based on search query
  const filteredPostTests = postTests.filter(test =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.tutor_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separate available and completed tests
  const availableTests = filteredPostTests.filter(test => test.test_status === 'available')
  const completedTests = filteredPostTests.filter(test => test.test_status === 'completed')

  const handleTakeTest = (testId: number) => {
    // Navigate to take the test - you'll need to implement the test-taking interface
    window.location.href = `/sessions/take-post-test/${testId}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not set'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Sessions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and take available post-tests from your tutoring sessions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by test title, subject, or tutor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Available Tests */}
      {availableTests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Available Post-Tests ({availableTests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableTests.map((test) => (
              <Card key={test.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{test.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {test.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Ready
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Tutor: {test.tutor_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{test.subject_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Session: {formatDate(test.session_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{test.time_limit} minutes • {test.question_count} questions</span>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <Button 
                        onClick={() => handleTakeTest(test.id)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Take Post-Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Completed Post-Tests ({completedTests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedTests.map((test) => (
              <Card key={test.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{test.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {test.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Tutor: {test.tutor_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{test.subject_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Session: {formatDate(test.session_date)}</span>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <Button 
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Test Completed
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Tests Available */}
      {filteredPostTests.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Post-Tests Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery 
                ? "No post-tests match your search criteria." 
                : "You don't have any post-tests available at the moment."
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}