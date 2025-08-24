"use client"

import { useState } from "react"
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
import { Library, Plus, Search, Filter, Edit, Trash2, BookOpen, Users, Calendar, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

const subjects = [
  {
    id: "1",
    name: "Data Structures and Algorithms",
    code: "CS201",
    description: "Fundamental concepts of data structures including arrays, linked lists, stacks, queues, trees, and graphs. Algorithm analysis and design techniques.",
    department: "Computer Science",
    credits: 3,
    prerequisites: ["Programming Fundamentals", "Discrete Mathematics"],
    totalTutors: 8,
    activeTutors: 6,
    totalQuizzes: 15,
    totalFlashcards: 12,
    createdDate: "2024-01-15",
    lastUpdated: "2024-08-20",
    status: "Active"
  },
  {
    id: "2",
    name: "Database Systems",
    code: "CS301",
    description: "Design and implementation of database systems. Covers relational models, SQL, normalization, indexing, and database optimization.",
    department: "Computer Science", 
    credits: 3,
    prerequisites: ["Data Structures and Algorithms"],
    totalTutors: 5,
    activeTutors: 4,
    totalQuizzes: 12,
    totalFlashcards: 8,
    createdDate: "2024-01-20",
    lastUpdated: "2024-08-18",
    status: "Active"
  },
  {
    id: "3",
    name: "Calculus I",
    code: "MATH101",
    description: "Differential and integral calculus of functions of one variable. Limits, derivatives, applications of derivatives, and basic integration.",
    department: "Mathematics",
    credits: 4,
    prerequisites: ["College Algebra", "Trigonometry"],
    totalTutors: 12,
    activeTutors: 10,
    totalQuizzes: 20,
    totalFlashcards: 15,
    createdDate: "2024-01-10",
    lastUpdated: "2024-08-22",
    status: "Active"
  },
  {
    id: "4",
    name: "Mobile Application Development",
    code: "IT401",
    description: "Development of mobile applications for iOS and Android platforms. Covers native and cross-platform development frameworks.",
    department: "Information Technology",
    credits: 3,
    prerequisites: ["Object-Oriented Programming", "Web Development"],
    totalTutors: 3,
    activeTutors: 2,
    totalQuizzes: 8,
    totalFlashcards: 6,
    createdDate: "2024-02-01",
    lastUpdated: "2024-08-15",
    status: "Active"
  },
  {
    id: "5",
    name: "Network Security",
    code: "CS450",
    description: "Principles and practices of network security. Cryptography, authentication, access control, and security protocols.",
    department: "Computer Science",
    credits: 3,
    prerequisites: ["Computer Networks", "Operating Systems"],
    totalTutors: 2,
    activeTutors: 1,
    totalQuizzes: 5,
    totalFlashcards: 4,
    createdDate: "2024-02-15",
    lastUpdated: "2024-07-30",
    status: "Inactive"
  },
]

export default function ManageSubjects() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const handleCreateSubject = () => {
    toast({
      title: "Subject Created",
      description: "New subject has been successfully created.",
      duration: 3000,
    })
    setShowCreateDialog(false)
  }

  const handleEditSubject = (subject: any) => {
    setSelectedSubject(subject)
    setShowEditDialog(true)
  }

  const handleUpdateSubject = () => {
    toast({
      title: "Subject Updated",
      description: `${selectedSubject?.name} has been successfully updated.`,
      duration: 3000,
    })
    setShowEditDialog(false)
    setSelectedSubject(null)
  }

  const handleDeleteSubject = (subject: any) => {
    setSelectedSubject(subject)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    toast({
      title: "Subject Deleted",
      description: `${selectedSubject?.name} has been successfully deleted.`,
      variant: "destructive",
      duration: 3000,
    })
    setShowDeleteDialog(false)
    setSelectedSubject(null)
  }

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const SubjectCard = ({ subject }: { subject: (typeof subjects)[0] }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-xl">{subject.name}</CardTitle>
              <Badge variant={subject.status === "Active" ? "default" : "secondary"}>
                {subject.status}
              </Badge>
            </div>
            <CardDescription className="text-base mt-1">
              {subject.code} • {subject.department} • {subject.credits} Credits
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditSubject(subject)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Subject
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteSubject(subject)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Subject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{subject.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{subject.activeTutors}/{subject.totalTutors} Active Tutors</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{subject.totalQuizzes} Quizzes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Library className="w-4 h-4 text-muted-foreground" />
            <span>{subject.totalFlashcards} Flashcard Sets</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Updated: {new Date(subject.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {subject.prerequisites.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prerequisites</Label>
            <div className="flex flex-wrap gap-1">
              {subject.prerequisites.map((prereq) => (
                <Badge key={prereq} variant="outline" className="text-xs">
                  {prereq}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Subjects</h1>
          <p className="text-muted-foreground">Create and manage academic subjects for the learning platform</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Add a new subject to the learning platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input id="name" placeholder="Enter subject name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input id="code" placeholder="e.g., CS201" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="e.g., Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input id="credits" type="number" placeholder="3" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter subject description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prerequisites (comma-separated)</Label>
                <Input id="prerequisites" placeholder="Programming Fundamentals, Discrete Mathematics" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubject}>
                  Create Subject
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
            placeholder="Search subjects by name, code, or department..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Subject Name</Label>
                  <Input id="edit-name" defaultValue={selectedSubject.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Subject Code</Label>
                  <Input id="edit-code" defaultValue={selectedSubject.code} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input id="edit-department" defaultValue={selectedSubject.department} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-credits">Credits</Label>
                  <Input id="edit-credits" type="number" defaultValue={selectedSubject.credits} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" defaultValue={selectedSubject.description} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prerequisites">Prerequisites (comma-separated)</Label>
                <Input id="edit-prerequisites" defaultValue={selectedSubject.prerequisites.join(", ")} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubject}>
                  Update Subject
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
              Are you sure you want to delete <strong>{selectedSubject?.name}</strong>?
              <br /><br />
              This will permanently remove the subject and all associated:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Quizzes ({selectedSubject?.totalQuizzes})</li>
                <li>Flashcard sets ({selectedSubject?.totalFlashcards})</li>
                <li>Tutor assignments ({selectedSubject?.totalTutors})</li>
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Subject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
