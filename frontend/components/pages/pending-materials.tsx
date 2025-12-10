"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiUrl } from "@/lib/api-config"
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
import { CheckCircle, XCircle, Clock, BookOpen, Calendar, User, Search, Filter, FileText, Eye, Loader2, Download, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"

interface PendingMaterial {
  material_id: number
  title: string
  description: string
  file_path: string
  uploaded_by: number
  status: string
  download_count: number
  rating: number
  file_type: string
  view_count: number
  subject: string
  file_size: number
  uploaded_by_name: string
  email?: string
  reviewed_by?: number
  reviewed_by_name?: string
  reviewed_at?: string
  assigned_faculty?: string[]
}

export default function PendingMaterials() {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentMaterial, setCurrentMaterial] = useState<PendingMaterial | null>(null)
  const [materials, setMaterials] = useState<PendingMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { currentUser } = useUser()

  // Fetch pending materials only after currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      fetchPendingMaterials()
    }
  }, [currentUser])

  const fetchPendingMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('apiUrl/api/pending-materials/status/pending')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      let filtered = []
      if (data.success && data.materials) {
        // Admins see all, faculty see only assigned
        if (currentUser?.role?.toLowerCase() === 'faculty') {
          filtered = data.materials.filter((mat: any) => Array.isArray(mat.assigned_faculty) && mat.assigned_faculty.some((fac: string) => fac.includes(currentUser.email)))
        } else {
          filtered = data.materials
        }
        setMaterials(filtered)
      } else {
        setMaterials([])
      }
    } catch (error) {
      console.error('Error fetching pending materials:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch materials')
      toast({
        title: "Error",
        description: "Failed to load pending materials. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (material: PendingMaterial) => {
    setCurrentMaterial(material)
    setShowApproveDialog(true)
  }

  const handleReject = (material: PendingMaterial) => {
    setCurrentMaterial(material)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (!currentMaterial || !currentUser) return
    
    try {
      const response = await fetch(apiUrl(`/api/pending-materials/${currentMaterial.material_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: currentUser.user_id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve material')
      }

      toast({
        title: "Material Approved",
        description: `"${currentMaterial.title}" has been approved and is now available in learning resources. The uploader will be notified via email.`,
        duration: 5000,
      })

      // Refresh the materials list
      await fetchPendingMaterials()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve material. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowApproveDialog(false)
      setCurrentMaterial(null)
    }
  }

  const confirmRejection = async () => {
    if (!currentMaterial || !currentUser) return
    
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
      const response = await fetch(apiUrl(`/api/pending-materials/${currentMaterial.material_id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejected_by: currentUser.user_id,
          comment: rejectionReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject material')
      }

      toast({
        title: "Material Rejected",
        description: `"${currentMaterial.title}" has been rejected. The uploader will be notified via email.`,
        duration: 5000,
      })

      // Refresh the materials list
      await fetchPendingMaterials()
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject material. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowRejectDialog(false)
      setCurrentMaterial(null)
      setRejectionReason("")
    }
  }

  const viewDetails = (material: PendingMaterial) => {
    setCurrentMaterial(material)
    setShowDetailsModal(true)
  }

  const previewFile = (material: PendingMaterial) => {
    // Open PDF in new tab for preview
    const fileUrl = `http://localhost:3000${material.file_path}`
    window.open(fileUrl, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.uploaded_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.material_id.toString().includes(searchTerm.toLowerCase())
  )

  const MaterialCard = ({ material }: { material: PendingMaterial }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl truncate">{material.title}</CardTitle>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">{material.subject}</CardDescription>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-1" />
                {material.uploaded_by_name}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                ID: {material.material_id}
              </div>
            </div>
            {material.assigned_faculty && material.assigned_faculty.length > 0 && (
              <div className="mt-2">
                <Label className="text-xs font-medium">Assigned Faculty:</Label>
                <ul className="text-xs text-muted-foreground">
                  {material.assigned_faculty.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>Size: {formatFileSize(material.file_size)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>PDF Document</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {material.description || 'No description provided'}
          </p>
        </div>

        <div className="flex items-center justify-end pt-4 border-t space-x-2">
          <Button size="sm" variant="outline" onClick={() => previewFile(material)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={() => viewDetails(material)}>
            <Eye className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleReject(material)}>
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(material)}>
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
          <h1 className="text-3xl font-bold">Pending Learning Materials</h1>
          <p className="text-muted-foreground">Review and approve learning materials submissions</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            `${filteredMaterials.length} Pending`
          )}
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search materials by title, subject, description, uploader, or material ID..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading materials...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading materials</div>
          <Button onClick={fetchPendingMaterials} variant="outline">
            Try Again
          </Button>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            {materials.length === 0 ? "No pending materials found" : "No materials match your search"}
          </div>
          <p className="text-sm text-muted-foreground">
            {materials.length === 0 
              ? "New material submissions will appear here for review."
              : "Try adjusting your search terms or clearing filters."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredMaterials.map((material) => (
            <MaterialCard key={material.material_id} material={material} />
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Material Details</DialogTitle>
            <DialogDescription>
              Detailed information about the learning material submission
            </DialogDescription>
          </DialogHeader>
          {currentMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{currentMaterial.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm">{currentMaterial.subject}</p>
                  {currentMaterial.assigned_faculty && currentMaterial.assigned_faculty.length > 0 && (
                    <div className="mt-1">
                      <Label className="text-xs font-medium">Assigned Faculty:</Label>
                      <ul className="text-xs text-muted-foreground">
                        {currentMaterial.assigned_faculty.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Uploaded By</Label>
                  <p className="text-sm">{currentMaterial.uploaded_by_name} (ID: {currentMaterial.uploaded_by})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{currentMaterial.email || 'Not available'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm">{currentMaterial.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Type</Label>
                  <p className="text-sm">{currentMaterial.file_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Material ID</Label>
                  <p className="text-sm">{currentMaterial.material_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Size</Label>
                  <p className="text-sm">{formatFileSize(currentMaterial.file_size)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Downloads</Label>
                  <p className="text-sm">{currentMaterial.download_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Views</Label>
                  <p className="text-sm">{currentMaterial.view_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  <p className="text-sm">{currentMaterial.rating}/5.0</p>
                </div>
                {currentMaterial.reviewed_by && (
                  <div>
                    <Label className="text-sm font-medium">Reviewed By</Label>
                    <p className="text-sm">{currentMaterial.reviewed_by_name} (ID: {currentMaterial.reviewed_by})</p>
                  </div>
                )}
                {currentMaterial.reviewed_at && (
                  <div>
                    <Label className="text-sm font-medium">Reviewed At</Label>
                    <p className="text-sm">{new Date(currentMaterial.reviewed_at).toLocaleString()}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <Label className="text-sm font-medium">File Path</Label>
                  <p className="text-sm text-muted-foreground">{currentMaterial.file_path}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentMaterial.description || 'No description provided'}
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => previewFile(currentMaterial)} className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Learning Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{currentMaterial?.title}"? 
              This material will be made available in the learning resources section and the uploader will be notified via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
              Approve Material
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Learning Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject "{currentMaterial?.title}"? This action cannot be undone.
              The uploader will be notified via email with the rejection reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="text-sm font-medium text-red-600">
              Rejection Reason (Required)*
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please explain why this material is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              The uploader will see this feedback.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejection} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason.trim()}
            >
              Reject Material
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
