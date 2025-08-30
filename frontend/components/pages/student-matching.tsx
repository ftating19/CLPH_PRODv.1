"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Calendar, Mail, Search, Filter, GraduationCap, Loader2, MessageSquare } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"

// TypeScript interface for student data
interface Student {
  user_id: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  program: string
  role: string
  status: string
  created_at: string
}

export default function StudentMatching() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  
  const { currentUser } = useUser()
  const { toast } = useToast()

  // Fetch students from API
  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:4000/api/students')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.students || [])
        setFilteredStudents(data.students || [])
      } else {
        throw new Error('Failed to fetch students')
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students. Please try again later.')
      setStudents([])
      setFilteredStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Filter students based on search and program filter
  useEffect(() => {
    let filtered = students

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Program filter
    if (programFilter !== "all") {
      filtered = filtered.filter(student => student.program === programFilter)
    }

    setFilteredStudents(filtered)
  }, [searchTerm, programFilter, students])

  // Get unique programs for filter
  const programs = [...new Set(students.map(student => student.program))].filter(Boolean)

  const handleContactStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowContactModal(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const StudentCard = ({ student }: { student: Student }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="/placeholder-user.jpg" alt={`${student.first_name} ${student.last_name}`} />
            <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
              {getInitials(student.first_name, student.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}
              </CardTitle>
              <Badge variant="default" className="ml-2 bg-green-600">
                Active Student
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">
              {student.program}
            </CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                ID: {student.user_id}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Joined: {formatDate(student.created_at)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contact Email</Label>
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm truncate">{student.email}</span>
          </div>
        </div>

        {/* Program */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Academic Program</Label>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{student.program}</span>
          </div>
        </div>

        {/* Student Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
            {student.status.charAt(0).toUpperCase() + student.status.slice(1)} Student
          </Badge>
        </div>

        <div className="flex items-center justify-end pt-4 border-t">
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSelectedStudent(student)}
            >
              View Profile
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => handleContactStudent(student)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Student
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading students...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <User className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error Loading Students</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStudents}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Matching</h1>
          <p className="text-muted-foreground">Connect with students who need your tutoring expertise</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Programs</p>
                <p className="text-2xl font-bold">{programs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students by name, email, or program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program} value={program}>
                  {program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStudents}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || programFilter !== "all" 
              ? "Try adjusting your search or filters." 
              : "No students are currently available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard key={student.user_id} student={student} />
          ))}
        </div>
      )}

      {/* Contact Student Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Student</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Reach out to ${selectedStudent.first_name} ${selectedStudent.last_name} to offer tutoring services`}
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder-user.jpg" alt={`${selectedStudent.first_name} ${selectedStudent.last_name}`} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">
                    {selectedStudent.first_name} {selectedStudent.middle_name ? `${selectedStudent.middle_name} ` : ""}{selectedStudent.last_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStudent.program}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Student ID: {selectedStudent.user_id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={selectedStudent.email} readOnly className="flex-1" />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedStudent.email)
                        toast({
                          title: "Copied!",
                          description: "Email address copied to clipboard"
                        })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      const subject = `Tutoring Services Available - ${currentUser?.first_name} ${currentUser?.last_name}`
                      const body = `Hi ${selectedStudent.first_name},\n\nI hope this email finds you well. I am a tutor offering academic support in various subjects and would like to reach out to see if you might be interested in tutoring services.\n\nAs a fellow ${selectedStudent.program} student/graduate, I understand the challenges you might be facing and would be happy to help you succeed in your studies.\n\nPlease let me know if you would like to discuss this further.\n\nBest regards,\n${currentUser?.first_name} ${currentUser?.last_name}`
                      window.location.href = `mailto:${selectedStudent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowContactModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
