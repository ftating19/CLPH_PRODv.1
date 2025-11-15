"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  BookOpen,
  MessageSquare,
  Shield,
  Activity,
  UserCheck,
  Settings,
  BarChart3
} from "lucide-react"

export default function AdminDashboard() {
  const { currentUser } = useUser()
  const [userCount, setUserCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [tutorCount, setTutorCount] = useState<number | null>(null);
  const [facultyCount, setFacultyCount] = useState<number | null>(null);
  useEffect(() => {
    // Only fetch counts when we know the current user (and ideally only for admins)
    if (!currentUser) return

    // Add role header since the /api/users endpoint requires admin privileges
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (currentUser.role) headers['x-user-role'] = currentUser.role

    // Fetch users (admin-only endpoint)
    fetch("http://localhost:4000/api/users", { headers })
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
    fetch("http://localhost:4000/api/tutors")
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
  }, [currentUser]);

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
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Manage Uploaded Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Uploaded Resources</CardTitle>
            <CardDescription>View and moderate uploaded learning materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-12 w-12 text-blue-500 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Moderate, approve, or remove uploaded resources from students and faculty.</p>
              <Button variant="outline" className="bg-transparent">
                Go to Resource Management
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Content Moderation */}
        <Card>
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>Review and manage platform content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No content to moderate</p>
              <Button variant="outline" className="bg-transparent">
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* System Analytics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>Usage statistics and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Daily Active Users</span>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No activity today</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Forum Activity</span>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No posts today</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Resource Downloads</span>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No downloads this week</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Content Review</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">System Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
