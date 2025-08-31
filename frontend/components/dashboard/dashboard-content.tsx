"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Users,
  MessageSquare,
  Star,
  Brain,
  UserCheck,
} from "lucide-react"

export default function DashboardContent({ currentUser }: { currentUser: any }) {
  // Forum post count
  const [forumPostCount, setForumPostCount] = useState(0);

  useEffect(() => {
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
  // Recent discussions
  const [recentForums, setRecentForums] = useState<any[]>([]);
  // Recommended tutors (5 stars)
  const [recommendedTutors, setRecommendedTutors] = useState<any[]>([]);

  useEffect(() => {
    // Fetch recent forums
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

    // Fetch recommended tutors (5 stars)
    fetch("http://localhost:4000/api/tutors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tutors)) {
          // Filter tutors with ratings === 5
          const recommended = data.tutors.filter((t: any) => Number(t.ratings) === 5).slice(0, 5);
          setRecommendedTutors(recommended);
        } else {
          setRecommendedTutors([]);
        }
      })
      .catch(() => setRecommendedTutors([]));
  }, []);
  // Example user data (replace with real queries)
  const userCourses = currentUser?.courses?.length || 0
  const userGroups = currentUser?.groups?.length || 0
  const userPosts = currentUser?.posts?.length || 0
  const userRating = currentUser?.average_rating || '-'
  // Button handlers (replace with router push or modals as needed)
  const handleFindTutor = () => window.location.href = '/tutor-matching'
  const handleJoinDiscussion = () => window.location.href = '/discussion-forums'
  const handleStartDiscussion = () => window.location.href = '/discussion-forums'
  const handleFindTutors = () => window.location.href = '/tutor-matching'
  const handleStartLearning = () => window.location.href = '/learning-resources'
  const handleScheduleEvent = () => window.location.href = '/dashboard/events'
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
            <CardTitle className="text-sm font-medium">Forum Posts</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPosts}</div>
            <p className="text-xs text-muted-foreground">{userPosts === 0 ? 'No posts yet' : 'Forum posts'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Star className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRating}</div>
            <p className="text-xs text-muted-foreground">{userRating === '-' ? 'No ratings yet' : 'Average rating'}</p>
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
                {recommendedTutors.map((tutor) => (
                  <li key={tutor.tutor_id} className="border-b pb-2 flex items-center gap-2">
                    <span className="font-semibold text-green-700">{tutor.name || tutor.tutor_name}</span>
                    <span className="text-xs text-muted-foreground">{tutor.specialization || tutor.subjects}</span>
                    <span className="flex items-center gap-1 ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-500">★</span>
                      ))}
                    </span>
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
              Learning Progress
            </CardTitle>
            <CardDescription>Your academic performance this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No progress data available</p>
              <Button variant="outline" className="bg-transparent" onClick={handleStartLearning}>
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Study sessions and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No upcoming events</p>
              <Button variant="outline" className="bg-transparent" onClick={handleScheduleEvent}>
                Schedule Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
