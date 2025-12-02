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

export default function PendingApplicants() {
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentApplicant, setCurrentApplicant] = useState<any>(null)
  const [rejectionComment, setRejectionComment] = useState('')
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch pending tutor applications from backend
  useEffect(() => {
    const fetchPendingApplicants = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('http://localhost:4000/api/tutor-applications?status=pending')
        if (!response.ok) {
          throw new Error('Failed to fetch pending applicants')
        }

        const data = await response.json()
        if (data.success && Array.isArray(data.applications)) {
          console.log('Pending applicants loaded:', data.applications)
          setApplicants(data.applications)
        } else {
          throw new Error(data.error || 'Invalid response format')
        }
      } catch (err) {
        console.error('Error fetching pending applicants:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        toast({
          title: "Error",
          description: "Failed to load pending applicants",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPendingApplicants()
  }, [toast])

  // Fallback hardcoded applicants if needed (keep as reference)
  const fallbackApplicants = [
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
    setRejectionComment('')
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (currentApplicant) {
      try {
        const response = await fetch(`http://localhost:4000/api/tutor-applications/${currentApplicant.application_id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error('Failed to approve applicant')
        }

        // Remove from pending list
        setApplicants(prev => prev.filter(a => a.application_id !== currentApplicant.application_id))
        
        toast({
          title: "Application Approved",
          description: `${currentApplicant?.name} has been approved as a tutor and will be notified via email.`,
          duration: 5000,
        })
        setShowApproveDialog(false)
        setCurrentApplicant(null)
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to approve applicant',
          variant: "destructive"
        })
      }
    }
  }

  const confirmRejection = async () => {
    if (currentApplicant) {
      try {
        const response = await fetch(`http://localhost:4000/api/tutor-applications/${currentApplicant.application_id}/reject`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            comment: rejectionComment.trim() || 'No reason provided',
            validatedby: '1' // Default admin user ID - should be replaced with actual user context
          })
        })

        if (!response.ok) {
          throw new Error('Failed to reject applicant')
        }

        // Remove from pending list
        setApplicants(prev => prev.filter(a => a.application_id !== currentApplicant.application_id))
        
        toast({
          title: "Application Rejected",
          description: `${currentApplicant?.name}'s application has been rejected. They will be notified via email.`,
          duration: 5000,
        })
        setShowRejectDialog(false)
        setCurrentApplicant(null)
        setRejectionComment('')
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to reject applicant',
          variant: "destructive"
        })
      }
    }
  }

  const viewDetails = (applicant: any) => {
    console.log('Viewing applicant details:', applicant)
    console.log('Class card image URL:', applicant.class_card_image_url)
    setCurrentApplicant(applicant)
    setShowDetailsModal(true)
  }

  const ApplicantCard = ({ applicant }: { applicant: (typeof applicants)[0] }) => (
    <Card className="hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-white dark:bg-gray-800">
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="w-14 h-14 border-2 border-gray-100">
              <AvatarImage src={applicant.avatar || "/placeholder.svg"} alt={applicant.name} />
              <AvatarFallback className="text-base font-semibold bg-blue-100 text-blue-700">
                {applicant.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {applicant.name}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Review
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {applicant.subject_name}
                  </span>
                </div>
              </div>
              
              {/* Professional Details Row */}
              <div className="flex items-start space-x-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>{applicant.year_level}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(applicant.application_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>
              
              {/* Assessment Status */}
              <div className="mt-3">
                {applicant.assessment_result_id ? (
                  <div className="flex items-start space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span>Assessment completed</span>
                    </div>
                    <Badge 
                      variant={parseFloat(applicant.assessment_score) >= 70 ? "default" : "destructive"}
                      className={parseFloat(applicant.assessment_score) >= 70
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300" 
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                      }
                    >
                      {parseFloat(applicant.assessment_score) >= 70 ? (
                        <>
                          <Award className="w-3 h-3 mr-1" />
                          Qualified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Below Threshold
                        </>
                      )}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Awaiting Assessment</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Program Information */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <GraduationCap className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 text-left">Academic Program</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left">{applicant.program}</p>
            </div>
          </div>
        </div>

        {/* Experience Summary */}
        {(applicant.specialties || applicant.tutor_information) && (
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block text-left">
              Teaching Experience & Qualifications
            </Label>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed text-left">
                {applicant.specialties || applicant.tutor_information}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => viewDetails(applicant)}
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 justify-start text-left"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleReject(applicant)}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleApprove(applicant)}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
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
          <p className="text-muted-foreground">Review and approve tutor applications</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {applicants.length} Pending
        </Badge>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Loading pending applicants...</span>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && applicants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending applications at this time</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {applicants.map((applicant) => (
              <ApplicantCard key={applicant.application_id} applicant={applicant} />
            ))}
          </div>
        </>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tutor Application Details</DialogTitle>
            <DialogDescription>
              Detailed information about the tutor application
            </DialogDescription>
          </DialogHeader>
          {currentApplicant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Applicant Name</Label>
                  <p className="text-sm">{currentApplicant.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{currentApplicant.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year Level</Label>
                  <p className="text-sm">{currentApplicant.year_level || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Application Date</Label>
                  <p className="text-sm">{new Date(currentApplicant.application_date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Subject to Tutor</Label>
                <p className="text-sm">{currentApplicant.subject_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Program</Label>
                <p className="text-sm">{currentApplicant.program || 'N/A'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Specialties</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentApplicant.specialties || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Teaching Experience & Information</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentApplicant.tutor_information || 'N/A'}</p>
              </div>

              {/* Assessment Results */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">Pre-Assessment Results</Label>
                {currentApplicant.assessment_result_id ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <Label className="text-xs text-gray-500">Score</Label>
                        <p className="text-lg font-semibold">{currentApplicant.assessment_score} points</p>
                      </div>
                      {currentApplicant.assessment_percentage && (
                        <div>
                          <Label className="text-xs text-gray-500">Percentage</Label>
                          <p className="text-lg font-semibold">{parseFloat(currentApplicant.assessment_percentage).toFixed(1)}%</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Result:</span>
                      <Badge 
                        variant={parseFloat(currentApplicant.assessment_score) >= 70 ? "default" : "destructive"}
                        className={parseFloat(currentApplicant.assessment_score) >= 70
                          ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300" 
                          : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {parseFloat(currentApplicant.assessment_score) >= 70 ? (
                          <>
                            <Award className="w-3 h-3 mr-1" />
                            Passed (70%+ required)
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Failed (Below 70%)
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Assessment Not Completed</span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                      This applicant needs to complete the pre-assessment before approval.
                    </p>
                  </div>
                )}
              </div>

              {/* Class Card Image Viewer */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">Class Card Image</Label>
                {currentApplicant.class_card_image_url ? (
                  <div className="space-y-3">
                    {/* Image Preview */}
                    <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border p-4">
                      <img 
                        src={currentApplicant.class_card_image_url} 
                        alt="Class card for verification" 
                        className="w-full h-auto max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          // Create full-screen image viewer
                          const overlay = document.createElement('div');
                          overlay.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
                          overlay.style.zIndex = '9999';
                          
                          const imageContainer = document.createElement('div');
                          imageContainer.className = 'relative max-w-full max-h-full';
                          
                          const fullImg = document.createElement('img');
                          fullImg.src = currentApplicant.class_card_image_url;
                          fullImg.className = 'max-w-full max-h-full object-contain rounded-lg';
                          fullImg.alt = 'Class card full view';
                          
                          const closeBtn = document.createElement('button');
                          closeBtn.innerHTML = '✕';
                          closeBtn.className = 'absolute -top-2 -right-2 bg-white dark:bg-gray-800 text-black dark:text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
                          closeBtn.onclick = () => document.body.removeChild(overlay);
                          
                          imageContainer.appendChild(fullImg);
                          imageContainer.appendChild(closeBtn);
                          overlay.appendChild(imageContainer);
                          
                          // Close on overlay click
                          overlay.onclick = (e) => {
                            if (e.target === overlay) document.body.removeChild(overlay);
                          };
                          
                          // Close on escape key
                          const handleEscape = (e: KeyboardEvent) => {
                            if (e.key === 'Escape') {
                              document.body.removeChild(overlay);
                              document.removeEventListener('keydown', handleEscape);
                            }
                          };
                          document.addEventListener('keydown', handleEscape);
                          
                          document.body.appendChild(overlay);
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', currentApplicant.class_card_image_url);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex flex-col items-center justify-center py-8 text-red-600">
                                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <p class="text-sm font-medium">Failed to load image</p>
                                <p class="text-xs text-muted-foreground mt-1">The image file may be corrupted or unavailable</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    
                    {/* Image Actions */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>📷 Click image to view full size</span>
                      <a 
                        href={currentApplicant.class_card_image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8">
                    <div className="flex flex-col items-center text-center text-muted-foreground">
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">No class card image provided</p>
                      <p className="text-xs mt-1">The applicant did not upload their class card</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 text-xs text-muted-foreground">
                <p>Application Date: {new Date(currentApplicant.application_date).toLocaleDateString()}</p>
                <p>Status: {currentApplicant.status}</p>
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
              You can optionally provide a reason for rejecting {currentApplicant?.name}'s application. 
              They will be notified via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionComment">Rejection Reason (Optional)</Label>
            <Textarea
              id="rejectionComment"
              placeholder="Optional: Explain why this application is being rejected..."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionComment('')}>Cancel</AlertDialogCancel>
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
