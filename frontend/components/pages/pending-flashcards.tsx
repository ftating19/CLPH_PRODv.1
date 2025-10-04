"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { CheckCircle, XCircle, Clock, BookOpen, User, Search, Eye, Loader2, Layers } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"

interface PendingFlashcard {
  flashcard_id: number
  sub_id: string
  question: string
  answer: string
  subject_id: number
  subject_name: string
  created_by: number
  status: string
  created_by_name: string
  creator_email?: string
  reviewed_by?: number
  reviewed_by_name?: string
  reviewed_at?: string
}

interface GroupedFlashcards {
  sub_id: string
  subject_id: number
  subject_name: string
  created_by: number
  created_by_name: string
  flashcards: PendingFlashcard[]
  status: string
}

export default function PendingFlashcards() {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<GroupedFlashcards | null>(null)
  const [groupedFlashcards, setGroupedFlashcards] = useState<GroupedFlashcards[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentUser) {
      fetchPendingFlashcards()
    }
  }, [currentUser])

  const fetchPendingFlashcards = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:4000/api/pending-flashcards/status/pending')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.flashcards) {
        // Group flashcards by sub_id
        const grouped = data.flashcards.reduce((acc: { [key: string]: GroupedFlashcards }, flashcard: PendingFlashcard) => {
          if (!acc[flashcard.sub_id]) {
            acc[flashcard.sub_id] = {
              sub_id: flashcard.sub_id,
              subject_id: flashcard.subject_id,
              subject_name: flashcard.subject_name,
              created_by: flashcard.created_by,
              created_by_name: flashcard.created_by_name,
              flashcards: [],
              status: flashcard.status
            }
          }
          acc[flashcard.sub_id].flashcards.push(flashcard)
          return acc
        }, {})
        setGroupedFlashcards(Object.values(grouped))
      } else {
        setGroupedFlashcards([])
      }
    } catch (error) {
      console.error('Error fetching pending flashcards:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch flashcards')
      toast({
        title: "Error",
        description: "Failed to load pending flashcards. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (group: GroupedFlashcards) => {
    setCurrentGroup(group)
    setShowApproveDialog(true)
  }

  const handleReject = (group: GroupedFlashcards) => {
    setCurrentGroup(group)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (!currentGroup || !currentUser) return
    
    try {
      // Approve all flashcards in the group
      const response = await fetch(`http://localhost:4000/api/pending-flashcards/sub/${currentGroup.sub_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: currentUser.user_id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve flashcard set')
      }

      toast({
        title: "Flashcard Set Approved",
        description: `${currentGroup.flashcards.length} flashcards have been approved and are now available.`,
        duration: 5000,
      })

      await fetchPendingFlashcards()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve flashcard set. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowApproveDialog(false)
      setCurrentGroup(null)
    }
  }

  const confirmRejection = async () => {
    if (!currentGroup || !currentUser) return
    
    try {
      // Reject all flashcards in the group
      const response = await fetch(`http://localhost:4000/api/pending-flashcards/sub/${currentGroup.sub_id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejected_by: currentUser.user_id,
          rejection_reason: rejectionReason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject flashcard set')
      }

      toast({
        title: "Flashcard Set Rejected",
        description: `${currentGroup.flashcards.length} flashcards have been rejected.`,
        duration: 5000,
      })

      await fetchPendingFlashcards()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject flashcard set. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowRejectDialog(false)
      setCurrentGroup(null)
      setRejectionReason("")
    }
  }

  const viewDetails = (group: GroupedFlashcards) => {
    setCurrentGroup(group)
    setShowDetailsModal(true)
  }

  const filteredGroups = groupedFlashcards.filter(group =>
    group.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.flashcards.some(fc => 
      fc.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fc.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Flashcards</h1>
          <p className="text-muted-foreground">Review and approve flashcard submissions</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {groupedFlashcards.length} Sets Pending
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by subject, creator, or flashcard content..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No pending flashcards</h3>
            <p className="text-sm text-muted-foreground">
              There are no flashcard sets awaiting review at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <Card key={group.sub_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl flex items-center">
                      <Layers className="w-5 h-5 mr-2" />
                      Flashcard Set - {group.subject_name}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {group.created_by_name}
                        </span>
                        <Badge variant="outline">{group.subject_name}</Badge>
                        <Badge variant="secondary">{group.flashcards.length} cards</Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => viewDetails(group)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApprove(group)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleReject(group)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Preview of first flashcard:
                  </p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">Q: {group.flashcards[0].question}</p>
                    <p className="text-sm text-muted-foreground mt-1">A: {group.flashcards[0].answer}</p>
                  </div>
                  {group.flashcards.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      +{group.flashcards.length - 1} more flashcard{group.flashcards.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flashcard Set Details</DialogTitle>
            <DialogDescription>
              {currentGroup?.subject_name} - {currentGroup?.flashcards.length} flashcards
            </DialogDescription>
          </DialogHeader>
          {currentGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <p className="text-sm">{currentGroup.subject_name}</p>
                </div>
                <div>
                  <Label>Created By</Label>
                  <p className="text-sm">{currentGroup.created_by_name}</p>
                </div>
              </div>
              <div>
                <Label className="text-lg">All Flashcards ({currentGroup.flashcards.length})</Label>
                <div className="space-y-3 mt-3">
                  {currentGroup.flashcards.map((flashcard, index) => (
                    <Card key={flashcard.flashcard_id}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Question {index + 1}</Label>
                            <p className="text-sm font-medium">{flashcard.question}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Answer</Label>
                            <p className="text-sm">{flashcard.answer}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Flashcard Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this set of {currentGroup?.flashcards.length} flashcards for {currentGroup?.subject_name}? 
              These flashcards will be made available to students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Flashcard Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this set of {currentGroup?.flashcards.length} flashcards for {currentGroup?.subject_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Provide a reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejection} className="bg-destructive hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
