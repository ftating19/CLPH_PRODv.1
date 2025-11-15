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
import { CICT_PROGRAMS } from "@/lib/constants"

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
  // Map of studentId -> assessment info for subjects
  // subjectPercentages: subject_id -> { percentage: number | null, name: string }
  const [studentAssessmentMap, setStudentAssessmentMap] = useState<Record<number, {
    subjectPercentages: Record<number, { percentage: number | null; name: string }>
  }>>({})
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [tutorSubjectId, setTutorSubjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  
  const { currentUser } = useUser()
  const { toast } = useToast()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const userProgram = currentUser?.program || ""
  
  // Use constants for programs
  const allPrograms = CICT_PROGRAMS

  // Debug logging for user info
  if (process.env.NODE_ENV === 'development') {
    console.log('Student Matching - Current User Info:', {
      role: userRole,
      program: userProgram,
      fullUser: currentUser
    })
  }

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

  // Fetch tutor profile (to get subject) and then fetch assessments for students if current user is a tutor
  useEffect(() => {
    const loadTutorAndAssessments = async () => {
      if (!currentUser || (currentUser.role || '').toLowerCase() !== 'tutor') return;

      try {
        // Get tutor record for current user
        const tutorsRes = await fetch('http://localhost:4000/api/tutors')
        const tutorsData = await tutorsRes.json()
        const myTutor = Array.isArray(tutorsData.tutors) ? tutorsData.tutors.find((t: any) => t.user_id === currentUser.user_id) : null
        const foundTutorSubjectId = myTutor?.subject_id
        setTutorSubjectId(foundTutorSubjectId || null)

        if (!foundTutorSubjectId) {
          // No subject assigned - nothing to do
          return
        }

        // For each student fetch their most recent pre-assessment and compute per-subject percentages
        setLoadingAssessments(true)

        // Limit to students currently loaded to avoid overloading the backend
        const studentsToCheck = students.slice(0, 200) // safety cap

        const assessments = await Promise.all(studentsToCheck.map(async (s) => {
          try {
            const res = await fetch(`http://localhost:4000/api/pre-assessment-results/user/${s.user_id}?_t=${Date.now()}`)
            if (!res.ok) return { user_id: s.user_id, percentage: null }
            const data = await res.json()
            const latest = Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : null
            if (!latest || !Array.isArray(latest.answers) || latest.answers.length === 0) {
              return { user_id: s.user_id, subjects: {} }
            }

            // Compute per-subject percentages from answers
            const bySubject: Record<number, { correct: number; total: number; name: string }> = {}
            latest.answers.forEach((ans: any) => {
              const sid = Number(ans.subject_id) || 0
              if (!bySubject[sid]) bySubject[sid] = { correct: 0, total: 0, name: ans.subject_name || '' }
              bySubject[sid].total++
              if (ans.is_correct) bySubject[sid].correct++
            })

            const subjectsResult: Record<number, { percentage: number | null; name: string }> = {}
            Object.keys(bySubject).forEach((k) => {
              const sid = Number(k)
              const data = bySubject[sid]
              const pct = data.total > 0 ? (data.correct / data.total) * 100 : null
              subjectsResult[sid] = { percentage: pct, name: data.name }
            })

            return { user_id: s.user_id, subjects: subjectsResult }
          } catch (e) {
            return { user_id: s.user_id, subjects: {} }
          }
        }))
        const map: Record<number, { subjectPercentages: Record<number, { percentage: number | null; name: string }> }> = {}
        assessments.forEach((a: any) => {
          map[a.user_id] = { subjectPercentages: a.subjects || {} }
        })

        setStudentAssessmentMap(map)
      } catch (e) {
        console.error('Error loading tutor assessments:', e)
      } finally {
        setLoadingAssessments(false)
      }
    }

    loadTutorAndAssessments()
  }, [currentUser, students])

  useEffect(() => {
    fetchStudents()
  }, [])

  // Filter students based on search and program filter
  useEffect(() => {
    let filtered = students

    // Program-based access control
    if (userRole === "student") {
      // For students, only show students from their own program
      filtered = filtered.filter(student => 
        student.program && student.program === userProgram
      )
      
      // Debug logging for program filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`Student filtering: userProgram="${userProgram}", filtered count=${filtered.length}`)
      }
    } else if (userRole === "admin" && programFilter !== "all") {
      // For admins, apply the selected program filter
      filtered = filtered.filter(student => student.program === programFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }, [searchTerm, programFilter, students, userRole, userProgram])

  // Sort filteredStudents so that, for tutors, students who need help in the tutor's subject appear first
  useEffect(() => {
    if (!currentUser || (currentUser.role || '').toLowerCase() !== 'tutor') return

    // Try to determine tutor's subject from tutors API
    const sortForTutor = async () => {
      try {
        const tutorsRes = await fetch('http://localhost:4000/api/tutors')
        const tutorsData = await tutorsRes.json()
        const myTutor = Array.isArray(tutorsData.tutors) ? tutorsData.tutors.find((t: any) => t.user_id === currentUser.user_id) : null
        const tutorSubjectId = myTutor?.subject_id
        if (!tutorSubjectId) return

        const sorted = [...filteredStudents].sort((a, b) => {
          const aPctObj = studentAssessmentMap[a.user_id]?.subjectPercentages?.[tutorSubjectId]
          const bPctObj = studentAssessmentMap[b.user_id]?.subjectPercentages?.[tutorSubjectId]
          const aPct = aPctObj?.percentage
          const bPct = bPctObj?.percentage

          const aNeeds = typeof aPct === 'number' && aPct < 82.5 ? 1 : 0
          const bNeeds = typeof bPct === 'number' && bPct < 82.5 ? 1 : 0
          if (aNeeds !== bNeeds) return bNeeds - aNeeds
          // otherwise keep existing order
          return 0
        })

        setFilteredStudents(sorted)
      } catch (e) {
        console.error('Error sorting students for tutor view:', e)
      }
    }

    sortForTutor()
  }, [currentUser, studentAssessmentMap])

  // Get unique programs for filter - only for admins
  const programs = userRole === "admin" ? allPrograms : []

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
              <div className="flex items-center gap-2">
                {/* Tutor view: show assessment-based badges */}
                {currentUser && (currentUser.role || '').toLowerCase() === 'tutor' && (() => {
                  const assessment = studentAssessmentMap[student.user_id]
                  const subjId = tutorSubjectId
                  const pct = subjId ? assessment?.subjectPercentages?.[subjId]?.percentage ?? null : null

                  if (subjId == null) {
                    return (
                      <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-700 border-gray-200">
                        No Subject
                      </Badge>
                    )
                  }

                  if (pct === null || pct === undefined) {
                    return (
                      <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-700 border-gray-200">
                        No Assessment
                      </Badge>
                    )
                  }

                  if (typeof pct === 'number' && pct < 82.5) {
                    return (
                      <Badge variant="default" className="ml-2 bg-green-600">
                        Recommended
                      </Badge>
                    )
                  }

                  if (typeof pct === 'number' && pct < 90) {
                    return (
                      <Badge variant="outline" className="ml-2 bg-amber-100 border-amber-300 text-amber-800">
                        Suggested
                      </Badge>
                    )
                  }

                  return null
                })()}

                <Badge variant="default" className="ml-2 bg-green-600">
                  Active Student
                </Badge>
              </div>
            </div>
            <CardDescription className="text-base mt-1">
              {student.program}
            </CardDescription>
            {/* Tutor-only: show per-subject assessment breakdown */}
            {currentUser && (currentUser.role || '').toLowerCase() === 'tutor' && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-2">Assessment Results</div>
                {(() => {
                  const assessment = studentAssessmentMap[student.user_id]
                  if (!assessment || !assessment.subjectPercentages || Object.keys(assessment.subjectPercentages).length === 0) {
                    return <div className="text-xs text-muted-foreground">No assessment data</div>
                  }

                  return (
                    <div className="space-y-1">
                      {Object.entries(assessment.subjectPercentages).map(([sid, info]) => (
                        <div key={sid} className="flex items-center justify-between">
                          <div className="text-xs">{info.name || `Subject ${sid}`}</div>
                          <div className="text-xs font-semibold">
                            {typeof info.percentage === 'number' ? `${info.percentage.toFixed(1)}%` : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
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
          {/* Program Filter - Only show for admins */}
          {userRole === "admin" && (
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
          )}
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
