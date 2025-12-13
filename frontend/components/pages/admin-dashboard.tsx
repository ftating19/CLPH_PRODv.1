"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  BookOpen,
  MessageSquare,
  Shield,
  Activity,
  UserCheck,
  Settings,
  BarChart3,
  Star,
  TrendingUp,
  MessageCircle,
  AlertTriangle,
  Eye
} from "lucide-react"

export default function AdminDashboard() {
  const { currentUser } = useUser()
  const [userCount, setUserCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [tutorCount, setTutorCount] = useState<number | null>(null);
  const [facultyCount, setFacultyCount] = useState<number | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [profanityViolations, setProfanityViolations] = useState<any[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  useEffect(() => {
    // Only fetch counts when we know the current user (and ideally only for admins)
    if (!currentUser) return

    // Add role header since the /api/users endpoint requires admin privileges
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (currentUser.role) headers['x-user-role'] = currentUser.role

    // Fetch users (admin-only endpoint)
    fetch("https://api.cictpeerlearninghub.com/api/users", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === "number") {
          setUserCount(data.total);
        } else if (Array.isArray(data.users)) {
          setUserCount(data.users.length);
        } else {
          setUserCount(0);
        }
        // Count students and faculty from returned users (if present)
        if (Array.isArray(data.users)) {
          setStudentCount(data.users.filter((u: any) => u.role && u.role.toLowerCase() === "student").length);
          setFacultyCount(data.users.filter((u: any) => u.role && u.role.toLowerCase() === "faculty").length);
        } else {
          setStudentCount(0);
          setFacultyCount(0);
        }
      })
      .catch((err) => {
        console.error('Error fetching users for admin dashboard:', err)
        setUserCount(null);
        setStudentCount(null);
        setFacultyCount(null);
      });

    // Fetch tutors count from tutors table (public endpoint)
    fetch("https://api.cictpeerlearninghub.com/api/tutors")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === "number") {
          setTutorCount(data.total);
        } else if (Array.isArray(data.tutors)) {
          setTutorCount(data.tutors.length);
        } else {
          setTutorCount(0);
        }
      })
      .catch((err) => {
        console.error('Error fetching tutors for admin dashboard:', err)
        setTutorCount(null);
      });

    // Fetch feedback statistics
    fetch("https://api.cictpeerlearninghub.com/api/system-feedback/stats", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFeedbackStats(data.stats);
          setRecentFeedback(data.recent_feedback || []);
        }
      })
      .catch((err) => console.error("Error fetching feedback stats:", err));

    // Fetch profanity violations
    fetchProfanityViolations();
  }, [currentUser]);

  const fetchProfanityViolations = async () => {
    if (!currentUser?.user_id) return;
    
    try {
      setLoadingViolations(true);
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/admin/profanity-violations?requesting_user_id=${currentUser.user_id}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setProfanityViolations(data.violations || []);
      } else {
        console.error('Error fetching profanity violations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching profanity violations:', error);
    } finally {
      setLoadingViolations(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform monitoring and management</p>
      </div>
      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCount === null ? "..." : userCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {userCount === null
                ? "Loading user count..."
                : userCount === 0
                ? "No users registered"
                : `${userCount} users registered`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentCount === null ? "..." : studentCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {studentCount === null
                ? "Loading student count..."
                : studentCount === 0
                ? "No students registered"
                : `${studentCount} students registered`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tutors</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tutorCount === null ? "..." : tutorCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {tutorCount === null
                ? "Loading tutor count..."
                : tutorCount === 0
                ? "No tutors registered"
                : `${tutorCount} tutors registered`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facultyCount === null ? "..." : facultyCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {facultyCount === null
                ? "Loading faculty count..."
                : facultyCount === 0
                ? "No faculty registered"
                : `${facultyCount} faculty registered`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Feedback Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats === null ? "..." : feedbackStats.total_feedback || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              User feedback submissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats === null 
                ? "..." 
                : feedbackStats.average_rating 
                ? `${parseFloat(feedbackStats.average_rating).toFixed(1)}★`
                : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats === null ? "..." : feedbackStats.five_star_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Excellent ratings received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Suggestions</CardTitle>
            <Settings className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackStats === null ? "..." : feedbackStats.has_suggestions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Feedback with improvements
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest user feedback and ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentFeedback.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No feedback submitted yet</p>
              ) : (
                recentFeedback.map((feedback) => (
                  <div key={feedback.feedback_id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                        <span className="font-semibold">{feedback.rating}/5</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <strong>{feedback.user_name}</strong> ({feedback.role})
                    </div>
                    
                    {feedback.liked_most && (
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">Liked: </span>
                        <span className="text-gray-700">{feedback.liked_most}</span>
                      </div>
                    )}
                    
                    {feedback.suggestions && (
                      <div className="text-sm">
                        <span className="text-blue-600 font-medium">Suggestions: </span>
                        <span className="text-gray-700">{feedback.suggestions}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of star ratings</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackStats ? (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = feedbackStats[`${rating === 5 ? 'five' : rating === 4 ? 'four' : rating === 3 ? 'three' : rating === 2 ? 'two' : 'one'}_star_count`] || 0;
                  const percentage = feedbackStats.total_feedback > 0 ? (count / feedbackStats.total_feedback * 100) : 0;
                  
                  return (
                    <div key={rating} className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">Loading rating distribution...</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Content Moderation - Profanity Violations */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Profanity Violations
            </CardTitle>
            <CardDescription>Monitor and manage inappropriate content attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingViolations ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : profanityViolations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No recent violations</p>
                <p className="text-xs text-muted-foreground">Platform content is clean!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Detected Words</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profanityViolations.slice(0, 10).map((violation) => (
                      <TableRow key={violation.violation_id}>
                        <TableCell>
                          <div className="font-medium">{violation.user_name || 'Unknown User'}</div>
                          <div className="text-xs text-muted-foreground">{violation.user_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {violation.context_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {violation.detected_words.slice(0, 3).map((word: string, idx: number) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {word}
                              </Badge>
                            ))}
                            {violation.detected_words.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{violation.detected_words.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={violation.severity === 'high' ? 'destructive' : 
                                   violation.severity === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {violation.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(violation.violation_timestamp).toLocaleDateString()}
                          <div className="text-xs">
                            {new Date(violation.violation_timestamp).toLocaleTimeString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {profanityViolations.length > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={fetchProfanityViolations}>
                      Load More Violations
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* System Analytics (removed) */}
    </>
  )
}
