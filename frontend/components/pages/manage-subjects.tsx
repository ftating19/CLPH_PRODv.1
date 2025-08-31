"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Library, Plus, Search, Edit, Trash2, Loader2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// TypeScript interface for subject data
interface Subject {
  subject_id: number
  subject_name: string
  description: string
  subject_code: string
}

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form states
  const [createForm, setCreateForm] = useState({
    subject_name: "",
    description: "",
    subject_code: ""
  })
  
  const [editForm, setEditForm] = useState({
    subject_name: "",
    description: "",
    subject_code: ""
  })
  
  const { toast } = useToast()

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:4000/api/subjects')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSubjects(data.subjects || [])
      } else {
        throw new Error('Failed to fetch subjects')
      }
    } catch (err) {
      console.error('Error fetching subjects:', err)
      setError('Failed to load subjects. Please try again later.')
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const handleCreateSubject = async () => {
    if (!createForm.subject_name.trim() || !createForm.description.trim() || !createForm.subject_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('http://localhost:4000/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject')
      }
      
      if (data.success) {
        toast({
          title: "Subject Created",
          description: `${createForm.subject_name} has been successfully created.`,
          duration: 3000,
        })
        
        setCreateForm({ subject_name: "", description: "", subject_code: "" })
        setShowCreateDialog(false)
        fetchSubjects() // Refresh the list
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subject'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setEditForm({
      subject_name: subject.subject_name,
      description: subject.description,
      subject_code: subject.subject_code
    })
    setShowEditDialog(true)
  }

  const handleUpdateSubject = async () => {
    if (!selectedSubject) return
    
    if (!editForm.subject_name.trim() || !editForm.description.trim() || !editForm.subject_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`http://localhost:4000/api/subjects/${selectedSubject.subject_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject')
      }
      
      if (data.success) {
        toast({
          title: "Subject Updated",
          description: `${editForm.subject_name} has been successfully updated.`,
          duration: 3000,
        })
        
        setShowEditDialog(false)
        setSelectedSubject(null)
        fetchSubjects() // Refresh the list
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subject'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedSubject) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`http://localhost:4000/api/subjects/${selectedSubject.subject_id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subject')
      }
      
      if (data.success) {
        toast({
          title: "Subject Deleted",
          description: `${selectedSubject.subject_name} has been successfully deleted.`,
          variant: "destructive",
          duration: 3000,
        })
        
        setShowDeleteDialog(false)
        setSelectedSubject(null)
        fetchSubjects() // Refresh the list
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete subject'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSubjects = subjects.filter(subject =>
    subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const SubjectCard = ({ subject }: { subject: Subject }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-xl">{subject.subject_name}</CardTitle>
              <Badge variant="default">Active</Badge>
            </div>
            <CardDescription className="text-base mt-1">
              {subject.subject_code}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Subject ID: {subject.subject_id}
        </div>
        <div className="flex gap-2 pt-4">
          <Button size="sm" variant="outline" onClick={() => handleEditSubject(subject)} className="flex items-center text-black border-black hover:bg-black hover:text-white">
            <Edit className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDeleteSubject(subject)} className="flex items-center text-black border-black hover:bg-black hover:text-white">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading subjects...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Library className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error Loading Subjects</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSubjects}>
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
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground">Create and manage academic subjects for the learning platform</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (open) setSelectedSubject(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSubject(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
              <DialogDescription>
                {selectedSubject ? "Update subject information" : "Add a new subject to the learning platform"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject_name">Subject Name *</Label>
                <Input 
                  id="subject_name" 
                  placeholder="Enter subject name" 
                  value={selectedSubject ? editForm.subject_name : createForm.subject_name}
                  onChange={(e) => selectedSubject
                    ? setEditForm({...editForm, subject_name: e.target.value})
                    : setCreateForm({...createForm, subject_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject_code">Subject Code *</Label>
                <Input 
                  id="subject_code" 
                  placeholder="e.g., CS201" 
                  value={selectedSubject ? editForm.subject_code : createForm.subject_code}
                  onChange={(e) => selectedSubject
                    ? setEditForm({...editForm, subject_code: e.target.value})
                    : setCreateForm({...createForm, subject_code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter subject description" 
                  rows={3} 
                  value={selectedSubject ? editForm.description : createForm.description}
                  onChange={(e) => selectedSubject
                    ? setEditForm({...editForm, description: e.target.value})
                    : setCreateForm({...createForm, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setSelectedSubject(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={selectedSubject ? handleUpdateSubject : handleCreateSubject} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {selectedSubject ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    selectedSubject ? "Update Subject" : "Create Subject"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search subjects by name, code, or description..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchSubjects}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <SubjectCard key={subject.subject_id} subject={subject} />
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-12">
          <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {searchQuery ? "No subjects found" : "No subjects created yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery 
              ? "Try adjusting your search terms to find subjects."
              : "Create your first subject to start building the course catalog."
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Subject
            </Button>
          )}
        </div>
      )}

      {/* Edit Subject Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information
            </DialogDescription>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject_name">Subject Name *</Label>
                <Input 
                  id="edit-subject_name" 
                  value={editForm.subject_name}
                  onChange={(e) => setEditForm({...editForm, subject_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject_code">Subject Code *</Label>
                <Input 
                  id="edit-subject_code" 
                  value={editForm.subject_code}
                  onChange={(e) => setEditForm({...editForm, subject_code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea 
                  id="edit-description" 
                  rows={3} 
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubject} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Subject"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedSubject?.subject_name}</strong>?
              <br /><br />
              This action cannot be undone and will permanently remove the subject from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Subject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
