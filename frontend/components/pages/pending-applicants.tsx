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
import { CheckCircle, XCircle, Clock, BookOpen, Calendar, User, Search, Filter, MapPin, GraduationCap, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PendingApplicants() {
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentApplicant, setCurrentApplicant] = useState<any>(null)
  const { toast } = useToast()

  const applicants = [
    {
      id: "1",
      name: "John Michael Santos",
      avatar: "/placeholder.svg?height=100&width=100&text=JS",
      subject: "Computer Science",
      specialties: ["Data Structures", "Algorithms", "Java", "Python", "Web Development"],
      appliedDate: "2024-08-20",
      studentId: "2022-00123",
      yearLevel: "4th Year",
      gpa: "3.85",
      location: "Manila Campus",
      education: "BS Computer Science, CICT",
      experience: "2 years of peer tutoring, Teaching Assistant for Programming Fundamentals",
      bio: "Passionate computer science student with strong programming skills and experience in helping fellow students. I've been a TA for Programming Fundamentals and have tutored over 20 students in various CS subjects.",
      languages: ["English", "Filipino"],
      email: "john.santos@cict.edu",
      phone: "+63 912 345 6789",
      references: "Prof. Maria Cruz (Programming), Prof. Robert Lee (Data Structures)",
      availability: "Weekdays 2-6 PM, Weekends 9 AM-5 PM",
      status: "pending"
    },
    {
      id: "2",
      name: "Maria Elena Rodriguez",
      avatar: "/placeholder.svg?height=100&width=100&text=MR",
      subject: "Mathematics",
      specialties: ["Calculus", "Linear Algebra", "Statistics", "Discrete Math", "Probability"],
      appliedDate: "2024-08-19",
      studentId: "2021-00456",
      yearLevel: "3rd Year",
      gpa: "3.92",
      location: "Quezon City Campus",
      education: "BS Mathematics, CICT",
      experience: "1.5 years tutoring high school students, Math tutor at local learning center",
      bio: "Mathematics enthusiast with a passion for helping students understand complex mathematical concepts. I believe in making math accessible and enjoyable for everyone.",
      languages: ["English", "Filipino", "Spanish"],
      email: "maria.rodriguez@cict.edu",
      phone: "+63 917 654 3210",
      references: "Prof. Ana Santos (Calculus), Dr. Jose Reyes (Statistics)",
      availability: "Monday-Friday 3-7 PM",
      status: "pending"
    },
    {
      id: "3",
      name: "Kevin Lim Wang",
      avatar: "/placeholder.svg?height=100&width=100&text=KW",
      subject: "Database Systems",
      specialties: ["SQL", "Database Design", "MongoDB", "Data Modeling", "Oracle"],
      appliedDate: "2024-08-18",
      studentId: "2020-00789",
      yearLevel: "Graduate Student",
      gpa: "3.95",
      location: "Manila Campus",
      education: "MS Information Systems, CICT",
      experience: "3 years as Database Administrator intern, TA for Database Systems course",
      bio: "Graduate student with hands-on database experience from internships at major tech companies. Specialized in both relational and NoSQL databases with real-world application knowledge.",
      languages: ["English", "Filipino", "Mandarin", "Hokkien"],
      email: "kevin.wang@cict.edu",
      phone: "+63 905 123 4567",
      references: "Prof. Lisa Chen (Database Systems), Dr. Michael Tan (Data Mining)",
      availability: "Flexible schedule, primarily evenings and weekends",
      status: "pending"
    },
    {
      id: "4",
      name: "Sophie Grace Martinez",
      avatar: "/placeholder.svg?height=100&width=100&text=SM",
      subject: "Mobile Development",
      specialties: ["Flutter", "React Native", "iOS", "Android", "UI/UX Design"],
      appliedDate: "2024-08-17",
      studentId: "2022-00321",
      yearLevel: "4th Year",
      gpa: "3.78",
      location: "Online Only",
      education: "BS Information Technology, CICT",
      experience: "Published 3 apps on Google Play Store, Freelance mobile developer for 2 years",
      bio: "Mobile development enthusiast with published applications and freelance experience. I love teaching others how to create beautiful and functional mobile applications.",
      languages: ["English", "Filipino"],
      email: "sophie.martinez@cict.edu",
      phone: "+63 920 987 6543",
      references: "Prof. David Kim (Mobile Development), Industry Mentor - Jane Doe (Senior Developer)",
      availability: "Evenings and weekends, flexible for online sessions",
      status: "pending"
    },
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
      description: `${currentApplicant?.name}'s application has been rejected and they will be notified via email.`,
      variant: "destructive",
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
                Pending
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">{applicant.subject}</CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                {applicant.studentId} • {applicant.yearLevel}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                {applicant.location}
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
            <span>{applicant.education}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Applied: {new Date(applicant.appliedDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Specialties</Label>
          <div className="flex flex-wrap gap-1">
            {applicant.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {applicant.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{applicant.specialties.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Experience</Label>
          <p className="text-sm text-muted-foreground line-clamp-2">{applicant.experience}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button size="sm" variant="outline" onClick={() => viewDetails(applicant)}>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleReject(applicant)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(applicant)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Tutor Applications</h1>
          <p className="text-muted-foreground">Review and manage tutor applications</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {applicants.length} Pending Applications
          </Badge>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search applicants by name, subject, or student ID..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {applicants.map((applicant) => (
          <ApplicantCard key={applicant.id} applicant={applicant} />
        ))}
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tutor Application Details</DialogTitle>
            <DialogDescription>
              Review complete application information for {currentApplicant?.name}
            </DialogDescription>
          </DialogHeader>
          {currentApplicant && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={currentApplicant.avatar || "/placeholder.svg"} alt={currentApplicant.name} />
                  <AvatarFallback className="text-xl font-semibold">
                    {currentApplicant.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{currentApplicant.name}</h3>
                  <p className="text-lg text-muted-foreground">{currentApplicant.subject}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{currentApplicant.studentId}</Badge>
                    <Badge variant="outline">{currentApplicant.yearLevel}</Badge>
                    <Badge variant="outline">GPA: {currentApplicant.gpa}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Contact Information</Label>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Email:</strong> {currentApplicant.email}</p>
                      <p><strong>Phone:</strong> {currentApplicant.phone}</p>
                      <p><strong>Location:</strong> {currentApplicant.location}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Academic Information</Label>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Education:</strong> {currentApplicant.education}</p>
                      <p><strong>Year Level:</strong> {currentApplicant.yearLevel}</p>
                      <p><strong>GPA:</strong> {currentApplicant.gpa}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Languages</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentApplicant.languages.map((language: string) => (
                        <Badge key={language} variant="secondary" className="text-xs">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Specialties</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentApplicant.specialties.map((specialty: string) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Availability</Label>
                    <p className="text-sm mt-2">{currentApplicant.availability}</p>
                  </div>

                  <div>
                    <Label className="font-semibold">Application Date</Label>
                    <p className="text-sm mt-2">{new Date(currentApplicant.appliedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Teaching Experience</Label>
                  <p className="text-sm mt-2">{currentApplicant.experience}</p>
                </div>

                <div>
                  <Label className="font-semibold">Bio</Label>
                  <p className="text-sm mt-2">{currentApplicant.bio}</p>
                </div>

                <div>
                  <Label className="font-semibold">References</Label>
                  <p className="text-sm mt-2">{currentApplicant.references}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleReject(currentApplicant)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleApprove(currentApplicant)
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Tutor Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{currentApplicant?.name}</strong>'s application to become a tutor?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Grant them tutor status in the system</li>
                <li>Send them a welcome email with next steps</li>
                <li>Make their profile visible to students seeking tutors</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Tutor Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject <strong>{currentApplicant?.name}</strong>'s application to become a tutor?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove their application from the pending list</li>
                <li>Send them a notification email about the decision</li>
                <li>Allow them to reapply in the future if desired</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejection}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
