"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Download, Filter, Calendar, User, TrendingUp, MessageCircle } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"

export default function AdminFeedbackManagement() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  
  const [feedbackStats, setFeedbackStats] = useState<any>(null)
  const [allFeedback, setAllFeedback] = useState<any[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')

  useEffect(() => {
    const loadFeedbackData = async () => {
      if (!currentUser?.user_id) {
        setIsLoading(false)
        return
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (currentUser.role) headers['x-user-role'] = currentUser.role

      try {
        const response = await fetch('https://api.cictpeerlearninghub.com/api/system-feedback/stats', { headers })
        const data = await response.json()
        
        if (data.success) {
          setFeedbackStats(data.stats)
          setAllFeedback(data.recent_feedback || [])
          setFilteredFeedback(data.recent_feedback || [])
        } else {
          toast({
            title: "Access Error",
            description: data.error || "Unable to load feedback data",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error loading feedback data:', error)
        toast({
          title: "Network Error",
          description: "Unable to connect to server",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadFeedbackData()
  }, [currentUser, toast])

  // Filter and sort feedback
  useEffect(() => {
    let filtered = [...allFeedback]
    
    // Apply rating filter
    if (filterRating !== null) {
      filtered = filtered.filter(f => f.rating === filterRating)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    
    setFilteredFeedback(filtered)
  }, [allFeedback, filterRating, sortBy])

  const exportFeedback = () => {
    const csvData = filteredFeedback.map(feedback => ({
      'Date': new Date(feedback.created_at).toLocaleDateString(),
      'User': feedback.user_name,
      'Role': feedback.role,
      'Rating': feedback.rating,
      'Liked Most': feedback.liked_most || '',
      'Suggestions': feedback.suggestions || ''
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-feedback-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Export Complete",
      description: "Feedback data has been downloaded as CSV",
      variant: "default",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Loading feedback data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Feedback Management</h1>
          <p className="text-muted-foreground">Monitor and analyze user feedback</p>
        </div>
        <Button onClick={exportFeedback} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats?.total_feedback || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats?.average_rating ? `${parseFloat(feedbackStats.average_rating).toFixed(1)}★` : "N/A"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats?.five_star_count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Suggestions</CardTitle>
            <User className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats?.has_suggestions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter by Rating:</span>
              <div className="flex gap-1">
                <Button
                  variant={filterRating === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(null)}
                >
                  All
                </Button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <Button
                    key={rating}
                    variant={filterRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRating(rating)}
                    className="flex items-center gap-1"
                  >
                    {rating} <Star className="w-3 h-3" />
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Button
                variant={sortBy === 'date' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('date')}
                className="flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" /> Date
              </Button>
              <Button
                variant={sortBy === 'rating' ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy('rating')}
                className="flex items-center gap-1"
              >
                <Star className="w-3 h-3" /> Rating
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedback ({filteredFeedback.length})</CardTitle>
          <CardDescription>Detailed view of user feedback and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No feedback matches the current filters</p>
            ) : (
              filteredFeedback.map((feedback) => (
                <div key={feedback.feedback_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= feedback.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <Badge variant={feedback.rating >= 4 ? "default" : feedback.rating >= 3 ? "secondary" : "destructive"}>
                        {feedback.rating}/5
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{feedback.role}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">{feedback.user_name}</h4>
                  </div>
                  
                  {feedback.liked_most && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <h5 className="text-sm font-medium text-green-800 mb-1">What they liked most:</h5>
                      <p className="text-sm text-green-700">{feedback.liked_most}</p>
                    </div>
                  )}
                  
                  {feedback.suggestions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h5 className="text-sm font-medium text-blue-800 mb-1">Suggestions for improvement:</h5>
                      <p className="text-sm text-blue-700">{feedback.suggestions}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}