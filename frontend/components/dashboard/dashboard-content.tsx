"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Users,
  MessageSquare,
  Star,
  Brain,
  UserCheck,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  BookMarked,
  Target,
  Award,
  Calendar,
} from "lucide-react"

export default function DashboardContent({ currentUser }: { currentUser: any }) {
  // Active users count
  const [activeUserCount, setActiveUserCount] = useState(0);
  // Forum post count
  const [forumPostCount, setForumPostCount] = useState(0);
  // Recent discussions
  const [recentForums, setRecentForums] = useState<any[]>([]);
  // Recommended tutors (5 stars)
  const [recommendedTutors, setRecommendedTutors] = useState<any[]>([]);
  // Pre-assessment data
  const [preAssessmentData, setPreAssessmentData] = useState<any>(null);
  const [preAssessmentLoading, setPreAssessmentLoading] = useState(true);
  // Learning materials count
  const [materialsCount, setMaterialsCount] = useState(0);
  // Quiz attempts
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  // Post-test data
  const [postTestsData, setPostTestsData] = useState<any[]>([]);
  // Upcoming bookings/sessions
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/users?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.users)) {
          setActiveUserCount(data.users.length);
        } else if (typeof data.total === "number") {
          setActiveUserCount(data.total);
        } else {
          setActiveUserCount(0);
        }
      })
      .catch(() => setActiveUserCount(0));
  }, []);

  useEffect(() => {
    // Fetch forums data
    fetch("http://localhost:4000/api/forums")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.forums)) {
          setForumPostCount(data.forums.length);
        } else {
          setForumPostCount(0);
        }
      })
      .catch(() => setForumPostCount(0));
  }, []);

  useEffect(() => {
    // Fetch recent forums and tutors
    fetch("http://localhost:4000/api/forums")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.forums)) {
          // Sort by created_at descending, take 5
          const sorted = [...data.forums].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentForums(sorted.slice(0, 5));
        } else {
          setRecentForums([]);
        }
      })
      .catch(() => setRecentForums([]));

    // Fetch recommended tutors (5 stars or high ratings)
    console.log('🔍 Dashboard: Fetching tutors...');
    fetch("http://localhost:4000/api/tutors")
      .then((res) => res.json())
      .then((data) => {
        console.log('👨‍🏫 Dashboard: Tutors data received:', data);
        
        if (data.success && Array.isArray(data.tutors)) {
          console.log('👨‍🏫 Dashboard: Total tutors:', data.tutors.length);
          console.log('👨‍🏫 Dashboard: Sample tutor:', data.tutors[0]);
          
          // Filter tutors with ratings >= 4 (since 5-star might be too restrictive)
          // and sort by ratings descending
          const recommended = data.tutors
            .filter((t: any) => {
              const rating = Number(t.ratings);
              console.log(`Tutor ${t.name}: rating = ${rating}, type = ${typeof t.ratings}`);
              return !isNaN(rating) && rating >= 4;
            })
            .sort((a: any, b: any) => Number(b.ratings) - Number(a.ratings))
            .slice(0, 5);
            
          console.log('👨‍🏫 Dashboard: Recommended tutors:', recommended);
          setRecommendedTutors(recommended);
        } else {
          console.log('👨‍🏫 Dashboard: No tutors data or invalid format');
          setRecommendedTutors([]);
        }
      })
      .catch((error) => {
        console.error('❌ Dashboard: Error fetching tutors:', error);
        setRecommendedTutors([]);
      });
  }, []);

  // Fetch pre-assessment data
  useEffect(() => {
    if (!currentUser?.user_id) {
      setPreAssessmentLoading(false);
      return;
    }
    
    console.log('🔍 Dashboard: Fetching pre-assessment for user:', currentUser.user_id);
    
    fetch(`http://localhost:4000/api/pre-assessment-results/user/${currentUser.user_id}?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('📊 Dashboard: Pre-assessment raw data received:', data);
        
        // The API returns { success: true, results: [...] }
        if (data.success && data.results && data.results.length > 0) {
          // Get the most recent result
          const latestResult = data.results[0];
          console.log('📊 Dashboard: Latest result:', latestResult);
          
          // Calculate overall statistics from answers with subject breakdown
          const answers = latestResult.answers || [];
          const bySubject: Record<string, { correct: number; total: number; percentage?: number }> = {};
          
          answers.forEach((answer: any) => {
            const subjectName = answer.subject_name || 'Unknown';
            if (!bySubject[subjectName]) {
              bySubject[subjectName] = { correct: 0, total: 0 };
            }
            bySubject[subjectName].total++;
            if (answer.is_correct) {
              bySubject[subjectName].correct++;
            }
          });
          
          // Add percentage to each subject
          Object.keys(bySubject).forEach(subject => {
            const data = bySubject[subject];
            data.percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
          });
          
          // Calculate overall percentage
          const totalCorrect = answers.filter((a: any) => a.is_correct).length;
          const totalQuestions = answers.length;
          const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
          
          console.log('📊 Dashboard: Calculated stats:', {
            overall_percentage: overallPercentage,
            by_subject: bySubject,
            total_correct: totalCorrect,
            total_questions: totalQuestions
          });
          
          // Set the processed data
          setPreAssessmentData({
            ...latestResult,
            overall_percentage: overallPercentage,
            by_subject: bySubject,
            total_correct: totalCorrect,
            total_questions: totalQuestions
          });
        } else {
          console.log('📊 Dashboard: No pre-assessment results found');
          setPreAssessmentData(null);
        }
        setPreAssessmentLoading(false);
      })
      .catch((error) => {
        console.error('❌ Dashboard: Error fetching pre-assessment:', error);
        setPreAssessmentData(null);
        setPreAssessmentLoading(false);
      });
  }, [currentUser]);

  // Fetch learning materials
  useEffect(() => {
    fetch("http://localhost:4000/api/materials")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.materials)) {
          setMaterialsCount(data.materials.length);
        }
      })
      .catch(() => setMaterialsCount(0));
  }, []);

  // Fetch quiz attempts for current user
  useEffect(() => {
    if (!currentUser?.user_id) return;
    
    fetch(`http://localhost:4000/api/quiz-attempts/user/${currentUser.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.attempts)) {
          setQuizAttempts(data.attempts.slice(0, 5));
        }
      })
      .catch(() => setQuizAttempts([]));
  }, [currentUser]);

  // Fetch post-test data for students
  useEffect(() => {
    if (!currentUser?.user_id || currentUser?.role?.toLowerCase() !== 'student') return;
    
    fetch(`http://localhost:4000/api/post-tests/student/${currentUser.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.postTests)) {
          setPostTestsData(data.postTests.slice(0, 5));
        }
      })
      .catch(() => setPostTestsData([]));
  }, [currentUser]);

  // Fetch upcoming sessions
  useEffect(() => {
    if (!currentUser?.user_id) return;
    
    fetch(`http://localhost:4000/api/bookings/user/${currentUser.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.bookings)) {
          // Filter for upcoming sessions (status = confirmed or pending)
          const upcoming = data.bookings
            .filter((b: any) => ['confirmed', 'pending'].includes(b.status?.toLowerCase()))
            .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .slice(0, 5);
          setUpcomingSessions(upcoming);
        }
      })
      .catch(() => setUpcomingSessions([]));
  }, [currentUser]);

  // Calculate pre-assessment status
  const preAssessmentStatus = preAssessmentData?.overall_percentage 
    ? preAssessmentData.overall_percentage >= 82.5 
      ? 'Passed' 
      : 'Needs Improvement'
    : 'Not Taken';

  // Button handlers (replace with router push or modals as needed)
  const handleFindTutor = () => window.location.href = '/tutor-matching'
  const handleJoinDiscussion = () => window.location.href = '/discussion-forums'
  const handleStartDiscussion = () => window.location.href = '/discussion-forums'
  const handleFindTutors = () => window.location.href = '/tutor-matching'
  const handleStartLearning = () => window.location.href = '/learning-resources'
  const handleViewQuizzes = () => window.location.href = '/quizzes-flashcards'
  const handleTakeAssessment = () => window.location.href = '/pre-assessments'
  const handleViewPostTests = () => window.location.href = '/manage-post-test'
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900/20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to CICT PEER LEARNING HUB</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Connect, collaborate, and excel in your academic journey with peer-to-peer learning.
        </p>
        <div className="flex gap-3">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleFindTutor}>
            Find a Tutor
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent" onClick={handleJoinDiscussion}>
            Join Discussion
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUserCount}</div>
            <p className="text-xs text-muted-foreground">{activeUserCount === 0 ? 'No active users' : 'Currently active users'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Posts</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forumPostCount}</div>
            <p className="text-xs text-muted-foreground">{forumPostCount === 0 ? 'No posts yet' : 'Total forum posts'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommended Tutors</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendedTutors.length}</div>
            <p className="text-xs text-muted-foreground">{recommendedTutors.length === 0 ? 'No tutors available' : 'Top-rated tutors'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pre-Assessment</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {preAssessmentLoading ? '...' : preAssessmentData?.overall_percentage ? `${preAssessmentData.overall_percentage.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {preAssessmentStatus === 'Passed' && <span className="text-green-600">✓ Passed (82.5%+)</span>}
              {preAssessmentStatus === 'Needs Improvement' && <span className="text-yellow-600">⚠ Needs Improvement</span>}
              {preAssessmentStatus === 'Not Taken' && <span className="text-gray-600">Not taken yet</span>}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recent Discussions
            </CardTitle>
            <CardDescription>Latest academic discussions and Q&A sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentForums.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No discussions yet</p>
                <Button variant="outline" className="bg-transparent" onClick={handleStartDiscussion}>
                  Start a Discussion
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentForums.map((forum) => (
                  <li key={forum.forum_id} className="border-b pb-2">
                    <a
                      href={`/discussion-forums?forum_id=${forum.forum_id}`}
                      className="font-semibold text-blue-700 hover:underline cursor-pointer"
                      title="View discussion"
                    >
                      {forum.title}
                    </a>
                    <div className="text-xs text-gray-500">{forum.topic}</div>
                    <div className="text-xs text-muted-foreground">{forum.subject_name} • {new Date(forum.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              Recommended Tutors
            </CardTitle>
            <CardDescription>Top-rated tutors for your courses</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendedTutors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No tutors available</p>
                <Button variant="outline" className="bg-transparent" onClick={handleFindTutors}>
                  Find Tutors
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {recommendedTutors.map((tutor, idx) => (
                  <li key={tutor.user_id || tutor.application_id || idx} className="border-b pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          {tutor.name}
                        </div>
                        {tutor.subject_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            📚 {tutor.subject_name}
                          </div>
                        )}
                        {tutor.specialties && (
                          <div className="text-xs text-muted-foreground mt-1">
                            🎯 {tutor.specialties}
                          </div>
                        )}
                        {tutor.program && (
                          <div className="text-xs text-muted-foreground mt-1">
                            🎓 {tutor.program}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end ml-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold text-sm">{Number(tutor.ratings).toFixed(1)}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.location.href = '/tutor-matching'}
                        >
                          Book
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Quiz & Learning Progress
            </CardTitle>
            <CardDescription>Recent quiz attempts and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {quizAttempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No quiz attempts yet</p>
                <Button variant="outline" className="bg-transparent" onClick={handleViewQuizzes}>
                  View Quizzes
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Recent Attempts</span>
                  <Badge variant="outline">{quizAttempts.length} total</Badge>
                </div>
                <ul className="space-y-3">
                  {quizAttempts.map((attempt, idx) => (
                    <li key={attempt.id || idx} className="border-b pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{attempt.quiz_title || 'Quiz'}</span>
                        <Badge variant={attempt.score >= 80 ? "default" : "secondary"}>
                          {attempt.score}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {attempt.subject_name} • {new Date(attempt.created_at).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4" onClick={handleViewQuizzes}>
                  View All Quizzes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription>Your scheduled tutoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No upcoming sessions</p>
                <Button variant="outline" className="bg-transparent" onClick={handleFindTutor}>
                  Find a Tutor
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <ul className="space-y-3">
                  {upcomingSessions.map((session, idx) => (
                    <li key={session.booking_id || idx} className="border-b pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{session.subject_name || 'Tutoring Session'}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {session.tutor_name && `with ${session.tutor_name}`}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(session.start_date).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4" onClick={handleFindTutor}>
                  Schedule More Sessions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional sections for students */}
      {currentUser?.role?.toLowerCase() === 'student' && postTestsData.length > 0 && (
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Assigned Post-Tests
            </CardTitle>
            <CardDescription>Tests assigned by your tutors</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {postTestsData.map((test, idx) => (
                <li key={test.id || idx} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-semibold">{test.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {test.subject_name} • {test.question_count} questions • {test.time_limit} mins
                    </div>
                  </div>
                  <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                    {test.status || 'pending'}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-4" onClick={handleViewPostTests}>
              View All Post-Tests
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Learning Resources section */}
      <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Learning Resources
          </CardTitle>
          <CardDescription>Available study materials and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{materialsCount}</div>
              <p className="text-sm text-muted-foreground">Materials available</p>
            </div>
            <Button variant="outline" onClick={handleStartLearning}>
              Browse Resources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Assessment Details for students */}
      {currentUser?.role?.toLowerCase() === 'student' && preAssessmentData && (
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Pre-Assessment Details
            </CardTitle>
            <CardDescription>Your performance by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Overall Score</span>
                <span className="text-2xl font-bold">{preAssessmentData.overall_percentage?.toFixed(1)}%</span>
              </div>
              {preAssessmentData.by_subject && Object.entries(preAssessmentData.by_subject).map(([subject, data]: [string, any]) => (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{subject}</span>
                    <span className="font-semibold">{data.correct}/{data.total} ({data.percentage?.toFixed(1)}%)</span>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                </div>
              ))}
              {preAssessmentStatus !== 'Passed' && (
                <Button variant="outline" className="w-full mt-4" onClick={handleTakeAssessment}>
                  Retake Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
