"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { apiUrl } from "@/lib/api-config"
export default function FeedbackRating() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  
  const [systemRating, setSystemRating] = useState(0)
  const [likedMost, setLikedMost] = useState("")
  const [suggestions, setSuggestions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [userFeedbackHistory, setUserFeedbackHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user's feedback history
  useEffect(() => {
    const loadUserFeedback = async () => {
      if (!currentUser?.user_id) {
        setIsLoading(false)
        return
      }

      try {
        // Initialize table first (this will be a no-op if table exists)
        await fetch(apiUrl('/api/system-feedback/init-table'))
        
        // Then load user's feedback history
        const response = await fetch(apiUrl(`/api/system-feedback/user/${currentUser.user_id}`))
        const data = await response.json()
        
        if (data.success) {
          setUserFeedbackHistory(data.feedback)
          
          // Check if user submitted feedback recently (within 24 hours)
          const recentFeedback = data.feedback.find((feedback: any) => {
            const feedbackDate = new Date(feedback.created_at)
            const now = new Date()
            const timeDiff = now.getTime() - feedbackDate.getTime()
            const hoursDiff = timeDiff / (1000 * 3600)
            return hoursDiff < 24
          })
          
          setHasSubmitted(!!recentFeedback)
        }
      } catch (error) {
        console.error('Error loading user feedback:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserFeedback()
  }, [currentUser])

  // Handle form submission
  const handleSubmitFeedback = async () => {
    if (!currentUser?.user_id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      })
      return
    }

    if (systemRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('apiUrl/api/system-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          rating: systemRating,
          liked_most: likedMost.trim() || null,
          suggestions: suggestions.trim() || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Thank You!",
          description: data.message,
          variant: "default",
        })
        
        setHasSubmitted(true)
        
        // Reset form
        setSystemRating(0)
        setLikedMost("")
        setSuggestions("")
        
        // Reload feedback history
        const historyResponse = await fetch(apiUrl(`/api/system-feedback/user/${currentUser.user_id}`))
        const historyData = await historyResponse.json()
        if (historyData.success) {
          setUserFeedbackHistory(historyData.feedback)
        }
      } else {
        toast({
          title: "Submission Failed",
          description: data.error || "Failed to submit feedback. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Network Error",
        description: "Unable to submit feedback. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({
    rating,
    setRating,
    label,
    disabled = false,
  }: { 
    rating: number; 
    setRating: (rating: number) => void; 
    label: string;
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 transition-colors ${
              disabled 
                ? "text-gray-300 cursor-not-allowed"
                : `cursor-pointer ${
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                  }`
            }`}
            onClick={() => !disabled && setRating(star)}
          />
        ))}
      </div>
      {rating > 0 && (
        <p className="text-sm text-gray-500">
          {rating === 1 && "Poor - Needs significant improvement"}
          {rating === 2 && "Fair - Some issues to address"}
          {rating === 3 && "Good - Meets expectations"}
          {rating === 4 && "Very Good - Exceeds expectations"}
          {rating === 5 && "Excellent - Outstanding experience"}
        </p>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading feedback form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback & Rating</h1>
        <p className="text-muted-foreground">Help us improve by sharing your experience</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feedback Form */}
          <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasSubmitted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Thank You for Your Feedback!
                  </>
                ) : (
                  "Rate the Platform"
                )}
              </CardTitle>
              <CardDescription>
                {hasSubmitted 
                  ? "You've already submitted feedback today. You can submit again tomorrow."
                  : "Share your experience with the CICT PEER LEARNING HUB"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentUser ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                  <p className="text-gray-500 mb-4">Please log in to submit feedback about the platform.</p>
                </div>
              ) : hasSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Feedback Submitted</h3>
                  <p className="text-gray-500 mb-4">Thank you for your valuable feedback! You can submit new feedback tomorrow.</p>
                </div>
              ) : (
                <>
                  <StarRating 
                    rating={systemRating} 
                    setRating={setSystemRating} 
                    label="Overall Platform Rating" 
                    disabled={isSubmitting}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="system-feedback">What did you like most?</Label>
                    <Textarea
                      id="system-feedback"
                      placeholder="Tell us about your experience with the platform..."
                      rows={4}
                      value={likedMost}
                      onChange={(e) => setLikedMost(e.target.value)}
                      disabled={isSubmitting}
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500">{likedMost.length}/1000 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="system-suggestions">Suggestions for improvement</Label>
                    <Textarea 
                      id="system-suggestions" 
                      placeholder="How can we make the platform better?" 
                      rows={3}
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      disabled={isSubmitting}
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500">{suggestions.length}/1000 characters</p>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50" 
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting || systemRating === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Platform Feedback
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Feedback History */}
          {currentUser && userFeedbackHistory.length > 0 && (
            <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
              <CardHeader>
                <CardTitle>Your Feedback History</CardTitle>
                <CardDescription>Your previous feedback submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {userFeedbackHistory.map((feedback: any) => (
                    <div key={feedback.feedback_id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
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
                          <span className="ml-2 font-semibold">{feedback.rating}/5</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {feedback.liked_most && (
                        <div>
                          <h4 className="text-sm font-medium text-green-600">Liked Most:</h4>
                          <p className="text-sm text-gray-600">{feedback.liked_most}</p>
                        </div>
                      )}
                      
                      {feedback.suggestions && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-600">Suggestions:</h4>
                          <p className="text-sm text-gray-600">{feedback.suggestions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
