"use client"
import BookingForm from "@/components/modals/BookingForm"

import React, { useState, useEffect } from "react"
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
import { Star, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap, Loader2 } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useSubjects } from "@/hooks/use-subjects"
import { CICT_PROGRAMS } from "@/lib/constants"

// TypeScript interface for tutor data
interface Tutor {
  application_id: number
  user_id: number
  name: string
  email?: string
  subject_id: number
  subject_name: string
  application_date: string
  status: string
  validated_by: string
  tutor_information: string
  program: string
  specialties: string
}

export default function TutorMatching() {
  // Subject filter state
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useUser()
  const { toast } = useToast()
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    subject_id: "",
    program: "",
    specialties: "",
    tutor_information: ""
  })

  // Fetch tutors from API
  const fetchTutors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:4000/api/tutors')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTutors(data.tutors || [])
      } else {
        throw new Error('Failed to fetch tutors')
      }
    } catch (err) {
      console.error('Error fetching tutors:', err)
      setError('Failed to load tutors. Please try again later.')
      setTutors([])
    } finally {
      setLoading(false)
    }
  }

  // Load tutors on component mount
  useEffect(() => {
    fetchTutors()
  }, [])

  // Available programs (using constants)
  const programs = CICT_PROGRAMS

  const handleApplicationSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to apply as a tutor",
        variant: "destructive"
      })
      return
    }

    if (!applicationForm.subject_id || !applicationForm.program || !applicationForm.specialties.trim() || !applicationForm.tutor_information.trim()) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const selectedSubject = subjects.find(s => s.subject_id.toString() === applicationForm.subject_id)
    
    const applicationData = {
      user_id: currentUser.user_id,
      name: `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`,
      subject_id: parseInt(applicationForm.subject_id),
      subject_name: selectedSubject?.subject_name || "",
      tutor_information: applicationForm.tutor_information,
      program: applicationForm.program,
      specialties: applicationForm.specialties
    }

    console.log('Submitting tutor application:', applicationData)

    try {
      const response = await fetch('http://localhost:4000/api/tutor-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Application Submitted",
          description: "Your tutor application has been submitted successfully. You will be notified once it's reviewed.",
          variant: "default"
        })

        // Reset form and close modal
        setApplicationForm({
          subject_id: "",
          program: "",
          specialties: "",
          tutor_information: ""
        })
        setShowApplyModal(false)
      } else {
        throw new Error(result.message || 'Failed to submit application')
      }

    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    }
  }

  const TutorCard = ({ tutor }: { tutor: Tutor }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="/placeholder.svg" alt={tutor.name || 'Tutor'} />
            <AvatarFallback className="text-lg font-semibold">
              {tutor.name
                ? tutor.name.split(" ").map((n) => n[0]).join("")
                : 'T'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{tutor.name || 'Name not provided'}</CardTitle>
              <Badge variant={tutor.status === "approved" ? "default" : "secondary"} className="ml-2">
                {tutor.status === "approved" ? "Available" : "Unavailable"}
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">
              {tutor.program || 'Program not specified'}
            </CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                ID: {tutor.user_id || 'N/A'}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Since: {tutor.application_date ? new Date(tutor.application_date).toLocaleDateString() : 'Date not available'}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Subject Expertise</Label>
          <Badge variant="outline" className="text-sm">
            {tutor.subject_name || 'Subject not specified'}
          </Badge>
        </div>

        {/* Program */}
        {tutor.program && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Program</Label>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{tutor.program}</span>
            </div>
          </div>
        )}

        {/* Specialties */}
        {tutor.specialties && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Specialties</Label>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tutor.specialties}
            </p>
          </div>
        )}

        {/* Additional Information */}
        {tutor.tutor_information && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Additional Information</Label>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tutor.tutor_information}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end pt-4 border-t">
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedTutor(tutor)}>
              View Profile
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => { setSelectedTutor(tutor); setShowBookingModal(true); }}
              disabled={tutor.status !== 'approved'}
            >
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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Tutor Matching</h1>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowTestModal(true)}>
            Take our test
          </Button>
        </div>
        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sample Tutor Matching Test</DialogTitle>
              <DialogDescription>
                This test will help us match you with the best tutors based on your results. Click Start to begin the sample test.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => { setShowTestModal(false); /* TODO: Start sample test logic here */ }}>
                Start Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    disabled={subjectsLoading || !!subjectsError}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={subjectsLoading ? "Loading subjects..." : subjectsError ? "Error loading subjects" : "Select the subject you want to tutor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!subjectsLoading && !subjectsError && subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                          {subject.subject_code} - {subject.subject_name}
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
                    placeholder="List your specific skills and areas of expertise (e.g., Java Programming, Algorithm Design, Data Analysis, etc.)"
                    value={applicationForm.specialties}
                    onChange={(e) => setApplicationForm(prev => ({...prev, specialties: e.target.value}))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutor_information">Teaching Experience & Additional Information *</Label>
                  <Textarea 
                    id="tutor_information"
                    placeholder="Describe your teaching/tutoring experience, achievements, and any additional information that makes you a great tutor (e.g., tutoring experience, academic achievements, projects, etc.)"
                    value={applicationForm.tutor_information}
                    onChange={(e) => setApplicationForm(prev => ({...prev, tutor_information: e.target.value}))}
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
        <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.subject_id} value={subject.subject_id.toString()}>
                {subject.subject_code} - {subject.subject_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading tutors...</span>
            </div>
          </div>
        ) : error ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTutors} variant="outline">
              Try Again
            </Button>
          </div>
        ) : tutors.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-muted-foreground mb-4">No tutors available at the moment.</p>
            <Button onClick={fetchTutors} variant="outline">
              Refresh
            </Button>
          </div>
        ) : (
          tutors
            .filter((tutor) => selectedSubjectFilter === 'all' || tutor.subject_id.toString() === selectedSubjectFilter)
            .map((tutor) => (
              <TutorCard key={tutor.application_id} tutor={tutor} />
            ))
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Tutoring Session</DialogTitle>
            <DialogDescription>Schedule a session with your selected tutor.</DialogDescription>
          </DialogHeader>
          <BookingForm tutor={selectedTutor} currentUser={currentUser} onClose={() => setShowBookingModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
