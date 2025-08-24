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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"

export default function TutorMatching() {
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const { currentUser } = useUser()
  const { toast } = useToast()

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    subject_id: "",
    program: "",
    specialties: ""
  })

  // Available subjects (based on manage-subjects data)
  const subjects = [
    { id: "1", name: "Data Structures and Algorithms", code: "CS201" },
    { id: "2", name: "Object-Oriented Programming", code: "CS202" },
    { id: "3", name: "Database Systems", code: "CS301" },
    { id: "4", name: "Software Engineering", code: "CS302" },
    { id: "5", name: "Web Development", code: "CS303" },
    { id: "6", name: "Mobile App Development", code: "CS401" },
    { id: "7", name: "Calculus I", code: "MATH101" },
    { id: "8", name: "Calculus II", code: "MATH102" },
    { id: "9", name: "Linear Algebra", code: "MATH201" },
    { id: "10", name: "Statistics and Probability", code: "MATH301" },
    { id: "11", name: "Discrete Mathematics", code: "MATH202" },
    { id: "12", name: "Computer Networks", code: "IT301" },
    { id: "13", name: "Information Systems Analysis", code: "IS201" },
    { id: "14", name: "System Administration", code: "IT201" },
    { id: "15", name: "Digital Logic Design", code: "ECE101" }
  ]

  // Available programs
  const programs = [
    "Bachelor of Science in Information Systems",
    "Bachelor of Science in Information Technology", 
    "Bachelor of Science in Computer Science",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ]

  const handleApplicationSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to apply as a tutor",
        variant: "destructive"
      })
      return
    }

    if (!applicationForm.subject_id || !applicationForm.program || !applicationForm.specialties.trim()) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const selectedSubject = subjects.find(s => s.id === applicationForm.subject_id)
    
    const applicationData = {
      user_id: currentUser.user_id,
      name: `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`,
      subject_id: parseInt(applicationForm.subject_id),
      subject_name: selectedSubject?.name || "",
      application_date: new Date().toISOString().split('T')[0],
      status: "pending",
      validatedby: null,
      tutor_information: {
        program: applicationForm.program,
        specialties: applicationForm.specialties
      }
    }

    try {
      // In a real app, this would be an API call
      console.log("Tutor application submitted:", applicationData)
      
      toast({
        title: "Application Submitted",
        description: "Your tutor application has been submitted successfully. You will be notified once it's reviewed.",
        variant: "default"
      })

      // Reset form and close modal
      setApplicationForm({
        subject_id: "",
        program: "",
        specialties: ""
      })
      setShowApplyModal(false)

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    }
  }

  const tutors = [
    {
      id: "1",
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=100&width=100&text=SC",
      program: "BS Computer Science",
      college: "CICT",
      yearLevel: "4th Year",
      courses: ["Data Structures & Algorithms", "Object-Oriented Programming", "Database Systems", "Software Engineering"],
      specialties: ["Java", "Python", "C++", "Web Development"],
      rating: 4.9,
      reviews: 127,
      reviewSummary: {
        excellent: 98,
        good: 24,
        average: 5,
        poor: 0
      },
      availability: "Available",
      experience: "3 years tutoring experience",
      location: "Manila Campus",
      gpa: "3.85",
      description: "Senior CS student specializing in algorithms and data structures. Helped 50+ students improve their programming skills with hands-on coding sessions.",
      languages: ["English", "Filipino"],
      responseTime: "Usually responds within 1 hour",
      successRate: "96%",
    },
    {
      id: "2",
      name: "Mark Rodriguez",
      avatar: "/placeholder.svg?height=100&width=100&text=MR",
      program: "BS Mathematics",
      college: "CICT",
      yearLevel: "3rd Year",
      courses: ["Calculus I & II", "Linear Algebra", "Statistics & Probability", "Discrete Mathematics"],
      specialties: ["Calculus", "Statistics", "Problem Solving", "Mathematical Proofs"],
      rating: 4.8,
      reviews: 89,
      reviewSummary: {
        excellent: 72,
        good: 15,
        average: 2,
        poor: 0
      },
      availability: "Busy until 3PM",
      experience: "2 years tutoring experience",
      location: "Quezon City Campus",
      gpa: "3.92",
      description: "Mathematics major with strong background in calculus and statistics. Patient teaching style with proven results in helping students understand complex concepts.",
      languages: ["English", "Filipino"],
      responseTime: "Usually responds within 2 hours",
      successRate: "94%",
    },
    {
      id: "3",
      name: "Lisa Wang",
      avatar: "/placeholder.svg?height=100&width=100&text=LW",
      program: "MS Information Systems",
      college: "CICT",
      yearLevel: "Graduate Student",
      courses: ["Database Design", "Data Mining", "System Analysis", "Advanced SQL"],
      specialties: ["SQL", "Database Design", "MongoDB", "Data Analytics"],
      rating: 5.0,
      reviews: 156,
      reviewSummary: {
        excellent: 152,
        good: 4,
        average: 0,
        poor: 0
      },
      availability: "Available",
      experience: "4 years tutoring experience",
      location: "Manila Campus",
      gpa: "3.96",
      description: "Graduate student and teaching assistant. Expert in database design and optimization with industry experience at tech companies.",
      languages: ["English", "Filipino", "Mandarin"],
      responseTime: "Usually responds within 30 minutes",
      successRate: "98%",
    },
    {
      id: "4",
      name: "Alex Kim",
      avatar: "/placeholder.svg?height=100&width=100&text=AK",
      program: "BS Information Technology",
      college: "CICT",
      yearLevel: "4th Year",
      courses: ["Mobile App Development", "iOS Programming", "Android Development", "UI/UX Design"],
      specialties: ["Flutter", "React Native", "iOS Development", "Android Development"],
      rating: 4.7,
      reviews: 73,
      reviewSummary: {
        excellent: 58,
        good: 12,
        average: 3,
        poor: 0
      },
      availability: "Available",
      experience: "2.5 years tutoring experience",
      location: "Online Only",
      gpa: "3.78",
      description: "Mobile development enthusiast with published apps on both iOS and Android stores. Specializes in cross-platform development.",
      languages: ["English", "Korean"],
      responseTime: "Usually responds within 1 hour",
      successRate: "95%",
    },
  ]

  const TutorCard = ({ tutor }: { tutor: (typeof tutors)[0] }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={tutor.avatar || "/placeholder.svg"} alt={tutor.name} />
            <AvatarFallback className="text-lg font-semibold">
              {tutor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{tutor.name}</CardTitle>
              <Badge variant={tutor.availability === "Available" ? "default" : "secondary"} className="ml-2">
                {tutor.availability}
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">
              {tutor.program} • {tutor.yearLevel}
            </CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium ml-1">{tutor.rating}</span>
                <span className="text-sm text-muted-foreground ml-1">({tutor.reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tutor Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <span>{tutor.college}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>GPA: {tutor.gpa}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{tutor.experience}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{tutor.successRate} success rate</span>
          </div>
        </div>

        {/* Courses Offered */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Courses Offered</Label>
          <div className="flex flex-wrap gap-1">
            {tutor.courses.slice(0, 3).map((course) => (
              <Badge key={course} variant="outline" className="text-xs">
                {course}
              </Badge>
            ))}
            {tutor.courses.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tutor.courses.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Specialties */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specialties</Label>
          <div className="flex flex-wrap gap-1">
            {tutor.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Reviews Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Reviews Breakdown</Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Excellent:</span>
              <span className="font-medium">{tutor.reviewSummary.excellent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Good:</span>
              <span className="font-medium">{tutor.reviewSummary.good}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average:</span>
              <span className="font-medium">{tutor.reviewSummary.average}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Poor:</span>
              <span className="font-medium">{tutor.reviewSummary.poor}</span>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Languages</Label>
          <div className="flex flex-wrap gap-1">
            {tutor.languages.map((language) => (
              <Badge key={language} variant="outline" className="text-xs">
                {language}
              </Badge>
            ))}
          </div>
        </div>

        {/* Response Time */}
        <div className="text-sm">
          <span className="text-muted-foreground">{tutor.responseTime}</span>
        </div>

        <p className="text-sm text-muted-foreground">{tutor.description}</p>

        <div className="flex items-center justify-end pt-4 border-t">
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedTutor(tutor.id)}>
              View Profile
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowBookingModal(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Book Session
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
          <h1 className="text-3xl font-bold">Tutor Matching</h1>
          <p className="text-muted-foreground">Find qualified tutors for your subjects</p>
        </div>
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <User className="w-4 h-4 mr-2" />
              Apply as Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Apply to Become a Tutor</DialogTitle>
              <DialogDescription>
                Share your expertise and help fellow students succeed in their academic journey.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* User Information Display */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">
                      {currentUser ? `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}` : 'Not logged in'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{currentUser?.email || 'Not logged in'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Program</Label>
                    <p className="font-medium">{currentUser?.program || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Application Date</Label>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Expertise *</Label>
                  <Select 
                    value={applicationForm.subject_id} 
                    onValueChange={(value) => setApplicationForm(prev => ({...prev, subject_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the subject you want to tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Select 
                    value={applicationForm.program} 
                    onValueChange={(value) => setApplicationForm(prev => ({...prev, program: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties *</Label>
                  <Textarea 
                    id="specialties"
                    placeholder="Describe your specific areas of expertise, skills, and specializations (e.g., Java Programming, Algorithm Design, Data Analysis, etc.)"
                    value={applicationForm.specialties}
                    onChange={(e) => setApplicationForm(prev => ({...prev, specialties: e.target.value}))}
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Application Process</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your application will be reviewed by administrators. You will be notified via email once your application is approved or if additional information is needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApplicationSubmit}
                  disabled={!currentUser}
                >
                  Submit Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search tutors by name, subject, or specialty..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {tutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Tutoring Session</DialogTitle>
            <DialogDescription>Schedule a session with your selected tutor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionDate">Preferred Date</Label>
              <Input id="sessionDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTime">Preferred Time</Label>
              <Input id="sessionTime" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Session Duration</Label>
              <Input id="duration" placeholder="e.g., 1 hour, 2 hours" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic/Subject</Label>
              <Input id="topic" placeholder="What would you like to learn?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Additional Message</Label>
              <Textarea id="message" placeholder="Any specific requirements or questions?" rows={3} />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Send Booking Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
