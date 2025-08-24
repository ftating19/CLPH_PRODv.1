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
import { Star, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap } from "lucide-react"

export default function TutorMatching() {
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your.email@cict.edu" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Expertise</Label>
                <Input id="subject" placeholder="e.g., Computer Science, Mathematics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Input id="specialties" placeholder="e.g., Data Structures, Algorithms, Java" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Teaching Experience</Label>
                <Textarea id="experience" placeholder="Describe your teaching or tutoring experience..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell students about yourself and your teaching approach..." rows={4} />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">Submit Application</Button>
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
