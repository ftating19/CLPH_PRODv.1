"use client"

import { useState, useEffect } from "react"
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
import { CheckCircle, XCircle, Clock, BookOpen, Calendar, User, Search, Filter, GraduationCap, Eye, Loader2, Award, AlertTriangle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"

interface TutorApplication {
  application_id: number
  user_id: number
  name: string
  email: string
  subject_id: number
  subject_name: string
  application_date: string
  status: string
  validatedby: number | null
  tutor_information: string
  program: string
  year_level: string
  specialties: string
  avatar?: string
  // Assessment fields
  assessment_result_id?: number
  assessment_score?: number
  assessment_percentage?: number
  assessment_passed?: boolean
}

export default function PendingApplicants() {
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentApplicant, setCurrentApplicant] = useState<TutorApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [applicants, setApplicants] = useState<TutorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch tutor applications from database
  const { currentUser } = useUser();
  useEffect(() => {
    if (currentUser) {
      fetchTutorApplications()
    }
  }, [currentUser])

  const fetchTutorApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('https://api.cictpeerlearninghub.com/api/tutor-applications?status=pending', {
        headers: {
          'x-user-id': currentUser?.user_id ? String(currentUser.user_id) : '',
          'x-user-role': currentUser?.role || '',
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      let filtered = []
      if (data.success && data.applications) {
  setApplicants(data.applications)
      } else {
        setApplicants([])
      }
    } catch (error) {
      console.error('Error fetching tutor applications:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch applications')
      toast({
        title: "Error",
        description: "Failed to load tutor applications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (applicant: TutorApplication) => {
    setCurrentApplicant(applicant)
    setShowApproveDialog(true)
  }

  const handleReject = (applicant: TutorApplication) => {
    setCurrentApplicant(applicant)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (!currentApplicant) return
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/tutor-applications/${currentApplicant.application_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validatedby: 1 // This should be the current admin's user ID
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve application')
      }

      toast({
        title: "Application Approved",
        description: `${currentApplicant.name} has been approved as a tutor and will be notified via email.`,
        duration: 5000,
      })

      // Refresh the applications list
      await fetchTutorApplications()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowApproveDialog(false)
      setCurrentApplicant(null)
    }
  }

  const confirmRejection = async () => {
    if (!currentApplicant) return
    
    // Validate that rejection reason is provided
    if (!rejectionReason.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/tutor-applications/${currentApplicant.application_id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validatedby: 1, // This should be the current admin's user ID
          comment: rejectionReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject application')
      }

      toast({
        title: "Application Rejected",
        description: `${currentApplicant.name}'s application has been rejected. They will be notified via email.`,
        duration: 5000,
      })

      // Refresh the applications list
      await fetchTutorApplications()
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowRejectDialog(false)
      setCurrentApplicant(null)
      setRejectionReason("")
    }
  }

  const viewDetails = (applicant: TutorApplication) => {
    setCurrentApplicant(applicant)
    setShowDetailsModal(true)
  }

  const ApplicantCard = ({ applicant }: { applicant: TutorApplication }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={applicant.avatar || "/placeholder.svg"} alt={applicant.name || 'Applicant'} />
            <AvatarFallback className="text-lg font-semibold">
              {applicant.name
                ? applicant.name.split(" ").map((n) => n[0]).join("")
                : 'N/A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{applicant.name || 'Name not provided'}</CardTitle>
              <Badge variant="secondary" className="ml-2">
                <Clock className="w-3 h-3 mr-1" />
                {applicant.status ? applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1) : 'Pending'}
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">{applicant.subject_name || 'Subject not specified'}</CardDescription>
            
            {/* Assessment Results - Prominent Display */}
            {applicant.assessment_result_id ? (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Pre-Assessment</div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>{applicant.assessment_score} points</span>
                        <span>•</span>
                        <span>{applicant.assessment_percentage?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={applicant.assessment_passed ? "default" : "destructive"}
                    className={applicant.assessment_passed 
                      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300" 
                      : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300"
                    }
                  >
                    {applicant.assessment_passed ? (
                      <>
                        <Award className="w-3 h-3 mr-1" />
                        Passed
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Failed
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Assessment Pending</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                  This applicant hasn't completed the pre-assessment yet.
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                Year {applicant.year_level || 'Not specified'}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Applied: {applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : 'Date not available'}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm">
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          <span>Program: {applicant.program || 'Program not specified'}</span>
        </div>

        {/* Subject Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Subject Expertise</Label>
          <Badge variant="outline" className="text-sm">
            {applicant.subject_name || 'Subject not specified'}
          </Badge>
        </div>

        {/* Specialties */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specialties & Experience</Label>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {applicant.specialties || 'No specialties or experience provided'}
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
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            `${applicants.length} Pending`
          )}
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading applications...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading applications</div>
          <Button onClick={fetchTutorApplications} variant="outline">
            Try Again
          </Button>
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No pending applications found</div>
          <p className="text-sm text-muted-foreground">Applications will appear here when students apply to become tutors.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applicants.map((applicant) => (
            <ApplicantCard key={applicant.application_id} applicant={applicant} />
          ))}
        </div>
      )}

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
                  <Label className="text-sm font-medium">Year Level</Label>
                  <p className="text-sm">{currentApplicant.year_level || 'Not available'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Application Date</Label>
                  <p className="text-sm">{new Date(currentApplicant.application_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Subject to Tutor</Label>
                <p className="text-sm">{currentApplicant.subject_name || 'Subject not specified'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Program</Label>
                <p className="text-sm">{currentApplicant.program || 'Program not specified'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Specialties & Experience</Label>
                <p className="text-sm text-muted-foreground">{currentApplicant.specialties || 'No specialties or experience provided'}</p>
              </div>
              
              {/* Assessment Results in Details Modal */}
              {currentApplicant.assessment_result_id ? (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <Label className="text-sm font-medium flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Pre-Assessment Results
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Score</Label>
                      <p className="text-lg font-semibold">{currentApplicant.assessment_score} points</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Percentage</Label>
                      <p className="text-lg font-semibold">{currentApplicant.assessment_percentage?.toFixed(1)}%</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge 
                        variant={currentApplicant.assessment_passed ? "default" : "destructive"}
                        className={currentApplicant.assessment_passed 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {currentApplicant.assessment_passed ? (
                          <>
                            <Award className="w-3 h-3 mr-1" />
                            Passed
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-yellow-800 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Assessment Status
                  </Label>
                  <p className="text-sm text-yellow-700 mt-1">
                    This applicant hasn't completed the pre-assessment yet. They need to take the assessment before their application can be properly evaluated.
                  </p>
                </div>
              )}
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
          
          {/* Assessment Summary in Approval Dialog */}
          {currentApplicant?.assessment_result_id && (
            <div className="py-4">
              <Label className="text-sm font-medium mb-2 block">Assessment Results Summary</Label>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="font-medium">{currentApplicant.assessment_score} points</span>
                    <span className="text-muted-foreground"> ({currentApplicant.assessment_percentage?.toFixed(1)}%)</span>
                  </div>
                  <Badge 
                    variant={currentApplicant.assessment_passed ? "default" : "destructive"}
                    className={currentApplicant.assessment_passed 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {currentApplicant.assessment_passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
              </div>
              {!currentApplicant.assessment_passed && (
                <p className="text-xs text-yellow-600 mt-2">
                  ⚠️ Note: This applicant did not pass the pre-assessment. Consider this when making your decision.
                </p>
              )}
            </div>
          )}
          
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
              They will be notified via email with the rejection reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="text-sm font-medium text-red-600">
              Rejection Reason (Required)*
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please explain why this application is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              The applicant will see this feedback.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejection} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason.trim()}
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
