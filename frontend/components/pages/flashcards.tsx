"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Layers, Plus, RotateCcw, ChevronLeft, ChevronRight, BookOpen, Brain, Search, Filter, Star, Clock, Trash2, Edit } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useFlashcards, useCreateFlashcard, useUpdateFlashcard, useDeleteFlashcard } from "@/hooks/use-flashcards"
import { useSubjects } from "@/hooks/use-subjects"

export default function Flashcards() {
  const [selectedSet, setSelectedSet] = useState<any | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [viewMode, setViewMode] = useState<"sets" | "list">("sets")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFlashcard, setEditingFlashcard] = useState<any | null>(null)

  const { currentUser } = useUser()
  const { toast } = useToast()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'

  // Form states for flashcard creation
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  // Database hooks
  const { flashcards, loading: flashcardsLoading, error: flashcardsError, refetch: refetchFlashcards } = useFlashcards()
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { createFlashcard, creating } = useCreateFlashcard()
  const { updateFlashcard, updating } = useUpdateFlashcard()
  const { deleteFlashcard, deleting } = useDeleteFlashcard()

  // Group flashcards by subject to create sets
  const flashcardGroupedSets = flashcards.reduce((sets: any[], flashcard: any) => {
    const existingSet = sets.find(set => set.subject === flashcard.subject_name)
    
    if (existingSet) {
      existingSet.cards.push({
        id: flashcard.flashcard_id,
        front: flashcard.question,
        back: flashcard.answer
      })
      existingSet.cardCount = existingSet.cards.length
    } else {
      sets.push({
        id: flashcard.subject_id,
        title: `${flashcard.subject_name} Cards`,
        subject: flashcard.subject_name,
        cardCount: 1,
        description: `Study flashcards for ${flashcard.subject_name}`,
        difficulty: "Mixed",
        lastStudied: new Date().toISOString().split('T')[0],
        progress: 0,
        cards: [{
          id: flashcard.flashcard_id,
          front: flashcard.question,
          back: flashcard.answer
        }]
      })
    }
    return sets
  }, [])

  const handleCreateFlashcard = async () => {
    if (!question.trim() || !answer.trim() || !selectedSubject) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create flashcards.",
        variant: "destructive",
      })
      return
    }

    try {
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === selectedSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      await createFlashcard({
        question: question.trim(),
        answer: answer.trim(),
        subject_id: subject.subject_id,
        created_by: currentUser.user_id
      })

      toast({
        title: "Success",
        description: "Flashcard created successfully!",
        duration: 3000,
      })

      // Reset form
      setQuestion("")
      setAnswer("")
      setSelectedSubject("")
      setShowCreateDialog(false)
      
      // Refresh flashcards
      refetchFlashcards()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditFlashcard = async () => {
    if (!editingFlashcard || !question.trim() || !answer.trim() || !selectedSubject) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    try {
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === selectedSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      await updateFlashcard(editingFlashcard.flashcard_id, {
        question: question.trim(),
        answer: answer.trim(),
        subject_id: subject.subject_id
      })

      toast({
        title: "Success",
        description: "Flashcard updated successfully!",
        duration: 3000,
      })

      // Reset form
      setQuestion("")
      setAnswer("")
      setSelectedSubject("")
      setEditingFlashcard(null)
      setShowCreateDialog(false)
      
      // Refresh flashcards
      refetchFlashcards()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFlashcard = async (flashcardId: number) => {
    try {
      await deleteFlashcard(flashcardId)

      toast({
        title: "Success",
        description: "Flashcard deleted successfully!",
        duration: 3000,
      })

      // Refresh flashcards
      refetchFlashcards()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (flashcard: any) => {
    setEditingFlashcard(flashcard)
    setQuestion(flashcard.question)
    setAnswer(flashcard.answer)
    setSelectedSubject(flashcard.subject_name)
    setShowCreateDialog(true)
  }

  const closeDialog = () => {
    setShowCreateDialog(false)
    setEditingFlashcard(null)
    setQuestion("")
    setAnswer("")
    setSelectedSubject("")
  }

  const startStudying = (set: any) => {
    setSelectedSet(set)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setStudyMode(true)
  }

  const nextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const FlashcardSetCard = ({ set }: { set: any }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{set.title}</CardTitle>
            <CardDescription className="text-base mt-1">{set.subject}</CardDescription>
          </div>
          <Badge variant={set.difficulty === "Beginner" ? "secondary" : set.difficulty === "Intermediate" ? "default" : "destructive"}>
            {set.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{set.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Layers className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>{set.cardCount} cards</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>Last studied: {new Date(set.lastStudied).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label>Progress</Label>
            <span>{set.progress}%</span>
          </div>
          <Progress value={set.progress} className="h-2" />
        </div>

        <div className="flex space-x-2 pt-2">
          <Button 
            className="flex-1" 
            onClick={() => startStudying(set)}
          >
            <Brain className="w-4 h-4 mr-2" />
            Study Now
          </Button>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Edit first card in the set or create new if no cards
              if (set.cards.length > 0) {
                const firstCard = set.cards[0];
                const flashcard = {
                  flashcard_id: firstCard.id,
                  question: firstCard.front,
                      answer: firstCard.back,
                      subject_name: set.subject
                    };
                    openEditDialog(flashcard);
                  }
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (set.cards.length > 0 && confirm(`Are you sure you want to delete all flashcards in ${set.title}?`)) {
                    set.cards.forEach((card: any) => handleDeleteFlashcard(card.id));
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (studyMode && selectedSet) {
    const currentCard = selectedSet.cards[currentCardIndex]
    const progress = ((currentCardIndex + 1) / selectedSet.cards.length) * 100

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStudyMode(false)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Sets
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{selectedSet.title}</h2>
              <p className="text-sm text-muted-foreground">
                Card {currentCardIndex + 1} of {selectedSet.cards.length}
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsFlipped(false)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <Card 
            className="min-h-[300px] cursor-pointer hover:shadow-lg transition-all duration-200"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <CardContent className="flex items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  {isFlipped ? "Answer" : "Question"}
                </div>
                <div className="text-xl font-medium">
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>
                <div className="text-sm text-muted-foreground">
                  Click to {isFlipped ? "show question" : "reveal answer"}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevCard}
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Hard
              </Button>
              <Button variant="outline" size="sm">
                Good
              </Button>
              <Button variant="outline" size="sm">
                Easy
              </Button>
            </div>

            <Button 
              onClick={nextCard}
              disabled={currentCardIndex === selectedSet.cards.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (flashcardsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading flashcards...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">Study with interactive flashcard sets</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Flashcard
        </Button>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search flashcards..." className="pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === "sets" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("sets")}
          >
            <Layers className="w-4 h-4 mr-2" />
            Sets
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {viewMode === "sets" ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {flashcardGroupedSets.map((set) => (
              <FlashcardSetCard key={set.id} set={set} />
            ))}
          </div>

          {flashcardGroupedSets.length === 0 && (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first flashcard to start studying
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Flashcard
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-4">
            {flashcards.map((flashcard: any) => (
              <Card key={flashcard.flashcard_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{flashcard.subject_name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        by {flashcard.creator_name}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Question:</Label>
                        <p className="text-sm">{flashcard.question}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Answer:</Label>
                        <p className="text-sm">{flashcard.answer}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(flashcard)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFlashcard(flashcard.flashcard_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {flashcards.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first flashcard to start studying
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Flashcard
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Flashcard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFlashcard ? "Edit Flashcard" : "Create New Flashcard"}</DialogTitle>
            <DialogDescription>
              {editingFlashcard ? "Update your flashcard" : "Create a new flashcard to study with"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_name}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea 
                id="question" 
                placeholder="Enter the question" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea 
                id="answer" 
                placeholder="Enter the answer" 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button 
                onClick={editingFlashcard ? handleEditFlashcard : handleCreateFlashcard}
                disabled={creating || updating}
              >
                {editingFlashcard ? (updating ? "Updating..." : "Update") : (creating ? "Creating..." : "Create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
