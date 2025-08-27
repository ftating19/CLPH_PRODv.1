"use client"

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
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCourses}</div>
            <p className="text-xs text-muted-foreground">{userCourses === 0 ? 'No courses enrolled' : 'Courses enrolled'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userGroups}</div>
            <p className="text-xs text-muted-foreground">{userGroups === 0 ? 'No active groups' : 'Active groups'}</p>
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No discussions yet</p>
              <Button variant="outline" className="bg-transparent" onClick={handleStartDiscussion}>
                Start a Discussion
              </Button>
            </div>
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No tutors available</p>
              <Button variant="outline" className="bg-transparent" onClick={handleFindTutors}>
                Find Tutors
              </Button>
            </div>
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
