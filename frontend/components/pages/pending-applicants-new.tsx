"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle, XCircle, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PendingApplicants() {
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentApplicant, setCurrentApplicant] = useState<any>(null)
  const { toast } = useToast()

  // Updated applicants based on your database schema
  const applicants = [
    {
      application_id: 1,
      user_id: 101,
      name: "John Michael Santos",
      subject_id: 1,
      subject_name: "Data Structures and Algorithms",
      application_date: "2024-08-20",
      status: "pending",
      validatedby: null,
      tutor_information: {
        program: "Bachelor of Science in Computer Science",
        specialties: "Advanced algorithms, dynamic programming, graph theory, competitive programming. Experience with Java, C++, and Python. Previously tutored 15+ students with 95% pass rate."
      },
      // Additional display info
      avatar: "/placeholder.svg?height=100&width=100&text=JS",
      email: "john.santos@cict.edu",
      studentId: "2022-00123",
      yearLevel: "4th Year",
      gpa: "3.85"
    },
    {
      application_id: 2,
      user_id: 102,
      name: "Maria Elena Cruz",
      subject_id: 7,
      subject_name: "Calculus I",
      application_date: "2024-08-19",
      status: "pending",
      validatedby: null,
      tutor_information: {
        program: "Bachelor of Science in Information Systems",
        specialties: "Differential calculus, limits, derivatives, optimization problems. Strong background in mathematical analysis. Available for both individual and group sessions."
      },
      avatar: "/placeholder.svg?height=100&width=100&text=MC",
      email: "maria.cruz@cict.edu",
      studentId: "2021-00456",
      yearLevel: "3rd Year",
      gpa: "3.92"
    },
    {
      application_id: 3,
      user_id: 103,
      name: "David Kim Lee",
      subject_id: 6,
      subject_name: "Mobile App Development",
      application_date: "2024-08-18",
      status: "pending",
      validatedby: null,
      tutor_information: {
        program: "Bachelor of Science in Information Technology",
        specialties: "Flutter, React Native, iOS Swift, Android Kotlin. Published 3 mobile apps on app stores. Expert in cross-platform development and UI/UX design."
      },
      avatar: "/placeholder.svg?height=100&width=100&text=DL",
      email: "david.lee@cict.edu",
      studentId: "2022-00789",
      yearLevel: "4th Year", 
      gpa: "3.78"
    },
    {
      application_id: 4,
      user_id: 104,
      name: "Sarah Jane Torres",
      subject_id: 3,
      subject_name: "Database Systems",
      application_date: "2024-08-17",
      status: "pending",
      validatedby: null,
      tutor_information: {
        program: "Bachelor of Science in Information Systems",
        specialties: "SQL optimization, database design, normalization, stored procedures, MongoDB, PostgreSQL. Internship experience at tech company working with large-scale databases."
      },
      avatar: "/placeholder.svg?height=100&width=100&text=ST",
      email: "sarah.torres@cict.edu",
      studentId: "2021-00234",
      yearLevel: "3rd Year",
      gpa: "3.89"
    },
    {
      application_id: 5,
      user_id: 105,
      name: "Alex Rodriguez",
      subject_id: 10,
      subject_name: "Statistics and Probability",
      application_date: "2024-08-16",
      status: "pending",
      validatedby: null,
      tutor_information: {
        program: "Bachelor of Science in Computer Science",
        specialties: "Statistical analysis, hypothesis testing, regression analysis, R programming, data visualization. Research experience in machine learning and data science."
      },
      avatar: "/placeholder.svg?height=100&width=100&text=AR",
      email: "alex.rodriguez@cict.edu",
      studentId: "2022-00567",
      yearLevel: "4th Year",
      gpa: "3.94"
    }
  ]

  const handleApprove = (applicant: any) => {
    setCurrentApplicant(applicant)
    setShowApproveDialog(true)
  }

  const handleReject = (applicant: any) => {
    setCurrentApplicant(applicant)
    setShowRejectDialog(true)
  }

  const confirmApproval = () => {
    toast({
      title: "Application Approved",
      description: `${currentApplicant?.name} has been approved as a tutor and will be notified via email.`,
      duration: 5000,
    })
    setShowApproveDialog(false)
    setCurrentApplicant(null)
  }

  const confirmRejection = () => {
    toast({
      title: "Application Rejected",
      description: `${currentApplicant?.name}'s application has been rejected. They will be notified via email.`,
      duration: 5000,
    })
    setShowRejectDialog(false)
    setCurrentApplicant(null)
  }

  const viewDetails = (applicant: any) => {
    setCurrentApplicant(applicant)
    setShowDetailsModal(true)
  }

  const ApplicantCard = ({ applicant }: { applicant: (typeof applicants)[0] }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={applicant.avatar || "/placeholder.svg"} alt={applicant.name} />
            <AvatarFallback className="text-lg font-semibold">
              {applicant.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{applicant.name}</CardTitle>
              <Badge variant="secondary" className="ml-2">
                <Clock className="w-3 h-3 mr-1" />
                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">{applicant.subject_name}</CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                ID: {applicant.user_id} • {applicant.yearLevel}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Applied: {new Date(applicant.application_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>GPA: {applicant.gpa}</span>
          </div>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span>{applicant.tutor_information.program}</span>
          </div>
        </div>

        {/* Subject Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Subject Expertise</Label>
          <Badge variant="outline" className="text-sm">
            {applicant.subject_name}
          </Badge>
        </div>

        {/* Specialties */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specialties & Experience</Label>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {applicant.tutor_information.specialties}
          </p>
        </div>

        <div className="flex items-center justify-end pt-4 border-t space-x-2">
          <Button size="sm" variant="outline" onClick={() => viewDetails(applicant)}>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleReject(applicant)}>
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(applicant)}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Tutor Applications</h1>
          <p className="text-muted-foreground">Review and approve tutor applications</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {applicants.length} Pending
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search applicants by name, subject, or specialty..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {applicants.map((applicant) => (
          <ApplicantCard key={applicant.application_id} applicant={applicant} />
        ))}
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tutor Application Details</DialogTitle>
            <DialogDescription>
              Detailed information about the tutor application
            </DialogDescription>
          </DialogHeader>
          {currentApplicant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Applicant Name</Label>
                  <p className="text-sm">{currentApplicant.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{currentApplicant.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Student ID</Label>
                  <p className="text-sm">{currentApplicant.studentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year Level</Label>
                  <p className="text-sm">{currentApplicant.yearLevel}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">GPA</Label>
                  <p className="text-sm">{currentApplicant.gpa}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Application Date</Label>
                  <p className="text-sm">{new Date(currentApplicant.application_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Subject to Tutor</Label>
                <p className="text-sm">{currentApplicant.subject_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Program</Label>
                <p className="text-sm">{currentApplicant.tutor_information.program}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Specialties & Experience</Label>
                <p className="text-sm text-muted-foreground">{currentApplicant.tutor_information.specialties}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Tutor Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {currentApplicant?.name}'s application to become a tutor for {currentApplicant?.subject_name}?
              They will be notified via email and granted tutor privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
              Approve Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Tutor Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {currentApplicant?.name}'s application? This action cannot be undone.
              They will be notified via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejection} className="bg-red-600 hover:bg-red-700">
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
