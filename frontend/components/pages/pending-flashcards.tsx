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

export default function PendingFlashcards() {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentFlashcard, setCurrentFlashcard] = useState<PendingFlashcard | null>(null)
  const [flashcards, setFlashcards] = useState<PendingFlashcard[]>([])
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
      const response = await fetch('https://api.cictpeerlearninghub.com/api/pending-flashcards/status/pending')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      let filteredFlashcards = []
      if (data.success && data.flashcards) {
        // Admins see all, faculty see only their assigned subjects (based on subjects.user_id)
        if (currentUser?.role?.toLowerCase() === 'faculty') {
          // Fetch all subjects to find which ones belong to this faculty
          try {
            const subjectsResponse = await fetch('https://api.cictpeerlearninghub.com/api/subjects')
            if (subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json()
              
              console.log('DEBUG - Current User:', {
                user_id: currentUser.user_id,
                role: currentUser.role,
                email: currentUser.email
              })
              console.log('DEBUG - All Subjects:', subjectsData.subjects)
              
              // Filter subjects where user_id matches current faculty user_id
              // Note: subject.user_id can be a JSON array like ["35"] or an array [35]
              const facultySubjects = subjectsData.subjects
                ?.filter((subject: any) => {
                  let userIds = []
                  // Parse user_id if it's a JSON string
                  if (typeof subject.user_id === 'string') {
                    try {
                      userIds = JSON.parse(subject.user_id)
                    } catch {
                      userIds = [subject.user_id]
                    }
                  } else if (Array.isArray(subject.user_id)) {
                    userIds = subject.user_id
                  } else {
                    userIds = [subject.user_id]
                  }
                  // Convert to numbers for comparison
                  userIds = userIds.map((id: any) => parseInt(id))
                  const currentUserId = typeof currentUser.user_id === 'string' ? parseInt(currentUser.user_id) : currentUser.user_id
                  const matches = userIds.includes(currentUserId)
                  console.log(`DEBUG - Subject ${subject.subject_id} (${subject.subject_name}): user_id=${JSON.stringify(subject.user_id)}, parsed=${JSON.stringify(userIds)}, matches=${matches}`)
                  return matches
                }) || []
              
              const facultySubjectIds = facultySubjects.map((subject: any) => subject.subject_id)
              
              console.log('DEBUG - Faculty Subjects:', facultySubjects)
              console.log('DEBUG - Faculty Subject IDs:', facultySubjectIds)
              console.log('DEBUG - All Flashcards:', data.flashcards)
              
              // Filter flashcards where subject_id matches faculty's subjects
              filteredFlashcards = data.flashcards.filter((flashcard: PendingFlashcard) => {
                const flashcardSubjectId = typeof flashcard.subject_id === 'string' ? parseInt(flashcard.subject_id) : flashcard.subject_id
                const matches = facultySubjectIds.includes(flashcardSubjectId)
                console.log(`DEBUG - Flashcard ${flashcard.flashcard_id}: subject_id=${flashcard.subject_id}, parsed=${flashcardSubjectId}, matches=${matches}`)
                return matches
              })
              
              console.log('Faculty filtering result (flashcards):', {
                currentUserRole: currentUser.role,
                currentUserId: currentUser.user_id,
                totalFlashcards: data.flashcards.length,
                facultySubjectIds,
                filteredCount: filteredFlashcards.length,
                filteredFlashcards
              })
            } else {
              filteredFlashcards = []
            }
          } catch (error) {
            console.error('Error fetching subjects for faculty filter:', error)
            filteredFlashcards = []
          }
        } else {
          // Admin or other roles see all
          console.log('Admin viewing all flashcards:', data.flashcards.length)
          filteredFlashcards = data.flashcards
        }
        
        setFlashcards(filteredFlashcards)
      } else {
        setFlashcards([])
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

  const handleApprove = (flashcard: PendingFlashcard) => {
    setCurrentFlashcard(flashcard)
    setShowApproveDialog(true)
  }

  const handleReject = (flashcard: PendingFlashcard) => {
    setCurrentFlashcard(flashcard)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const confirmApproval = async () => {
    if (!currentFlashcard || !currentUser) return
    
    try {
      // Approve individual flashcard
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pending-flashcards/${currentFlashcard.flashcard_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: currentUser.user_id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve flashcard')
      }

      toast({
        title: "Flashcard Approved",
        description: `The flashcard has been approved and is now available.`,
        duration: 5000,
      })

      await fetchPendingFlashcards()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve flashcard. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowApproveDialog(false)
      setCurrentFlashcard(null)
    }
  }

  const confirmRejection = async () => {
    if (!currentFlashcard || !currentUser) return
    
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
      // Reject entire flashcard group by sub_id
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/pending-flashcards/${currentFlashcard.flashcard_id}/reject`, {
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
        throw new Error(errorData.error || 'Failed to reject flashcard set')
      }

      const result = await response.json()
      const rejectedCount = result.rejectedCount || 1

      toast({
        title: "Flashcard Set Rejected",
        description: `${rejectedCount} flashcard(s) in this set have been rejected.`,
        duration: 5000,
      })

      await fetchPendingFlashcards()
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject flashcard set. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowRejectDialog(false)
      setCurrentFlashcard(null)
      setRejectionReason("")
    }
  }

  const viewDetails = (flashcard: PendingFlashcard) => {
    setCurrentFlashcard(flashcard)
    setShowDetailsModal(true)
  }

  // Filter flashcards by search term
  const filteredFlashcards = flashcards.filter(flashcard =>
    flashcard.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flashcard.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flashcard.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flashcard.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group flashcards by sub_id (flashcard sets)
  const flashcardsBySubId = filteredFlashcards.reduce((acc: any, flashcard: any) => {
    const subId = flashcard.sub_id || flashcard.flashcard_id;
    if (!acc[subId]) {
      acc[subId] = [];
    }
    acc[subId].push(flashcard);
    return acc;
  }, {});

  // Convert grouped flashcards to sets for display
  const flashcardSets = Object.keys(flashcardsBySubId).map((subId) => {
    const cards = flashcardsBySubId[subId];
    const firstCard = cards[0];
    
    return {
      sub_id: subId,
      flashcard_id: firstCard.flashcard_id, // Keep first card's ID for operations
      subject_id: firstCard.subject_id,
      subject_name: firstCard.subject_name,
      created_by: firstCard.created_by,
      created_by_name: firstCard.created_by_name,
      status: firstCard.status,
      cardCount: cards.length,
      title: cards.length > 1 
        ? `Flashcard Set #${subId} (${cards.length} cards)`
        : firstCard.question,
      question: firstCard.question,
      answer: firstCard.answer,
      cards: cards
    };
  });

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
          {flashcards.length} Flashcards Pending
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

      {flashcardSets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No pending flashcards</h3>
            <p className="text-sm text-muted-foreground">
              There are no flashcards awaiting review at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcardSets.map((set: any) => (
            <Card key={set.sub_id} className="hover:shadow-lg transition-shadow flex flex-col">
              {/* Pending Approval Banner */}
              <div className="bg-amber-100 text-amber-800 border-b border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 px-4 py-2 text-sm font-medium rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>⏳ Pending Approval</span>
                  {set.cardCount > 1 && (
                    <Badge variant="secondary" className="ml-auto">
                      <Layers className="w-3 h-3 mr-1" />
                      {set.cardCount} cards
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="flex-1">
                <div className="space-y-3">
                  <div>
                    <CardTitle className="text-lg flex items-center mb-2">
                      <BookOpen className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="line-clamp-2">{set.title}</span>
                    </CardTitle>
                  </div>
                  <CardDescription>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{set.created_by_name}</span>
                      </div>
                      <Badge variant="outline" className="w-fit">{set.subject_name}</Badge>
                      {set.cardCount > 1 && (
                        <p className="text-xs text-muted-foreground">
                          First card: {set.question.substring(0, 60)}{set.question.length > 60 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewDetails(set.cards[0])}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View {set.cardCount > 1 ? 'Set' : 'Details'}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApprove(set.cards[0])}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleReject(set.cards[0])}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
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
              {currentFlashcard?.subject_name}
            </DialogDescription>
          </DialogHeader>
          {currentFlashcard && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <p className="text-sm">{currentFlashcard.subject_name}</p>
                </div>
                <div>
                  <Label>Created By</Label>
                  <p className="text-sm">{currentFlashcard.created_by_name}</p>
                </div>
              </div>
              <div>
                <Label className="text-lg">Flashcard Content</Label>
                {/* Find all cards with same sub_id */}
                {(() => {
                  const cardsInSet = flashcards.filter(
                    (fc) => fc.sub_id === currentFlashcard.sub_id
                  );
                  
                  return cardsInSet.length > 1 ? (
                    <div className="space-y-3 mt-2">
                      <p className="text-sm text-muted-foreground">
                        This set contains {cardsInSet.length} flashcards
                      </p>
                      {cardsInSet.map((card, index) => (
                        <Card key={card.flashcard_id} className="mt-2">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">
                                  Card {index + 1} of {cardsInSet.length}
                                </Label>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block">Question</Label>
                                <p className="text-sm font-medium mt-1">{card.question}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded inline-block">Answer</Label>
                                <p className="text-sm mt-1">{card.answer}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="mt-2">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block">Question</Label>
                            <p className="text-sm font-medium mt-1">{currentFlashcard.question}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded inline-block">Answer</Label>
                            <p className="text-sm mt-1">{currentFlashcard.answer}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Flashcard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this flashcard for {currentFlashcard?.subject_name}? 
              This flashcard will be made available to students.
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
              Are you sure you want to reject this entire flashcard set for {currentFlashcard?.subject_name}? All flashcards in this set will be rejected. You must provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="text-red-600">Rejection Reason (Required)*</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please explain why this flashcard set is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              The creator will see this feedback for all flashcards in the set.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejection} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={!rejectionReason.trim()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
