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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Layers, Plus, RotateCcw, ChevronLeft, ChevronRight, BookOpen, Brain, Search, Filter, Star, Clock, Trash2, Edit, List, User, ChevronDown } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { useFlashcards, useCreateFlashcard, useUpdateFlashcard, useDeleteFlashcard } from "@/hooks/use-flashcards"
import { useUpdateFlashcardProgress, useFlashcardProgress } from "@/hooks/use-flashcard-progress"
import { useSubjects } from "@/hooks/use-subjects"

export default function Flashcards() {
  // Program options
  const programOptionsRaw = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ];
  // Remove duplicates from program options
  const programOptions = Array.from(new Set(programOptionsRaw));

  const [selectedSet, setSelectedSet] = useState<any | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [viewMode, setViewMode] = useState<"sets" | "list">("sets")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFlashcard, setEditingFlashcard] = useState<any | null>(null)
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false)
  const [editingFlashcardIndex, setEditingFlashcardIndex] = useState<number | null>(null)
  const [editingFlashcardSet, setEditingFlashcardSet] = useState<any | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all")
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>("all")
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all")

  const { currentUser } = useUser()
  const { toast } = useToast()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const userProgram = currentUser?.program || ""
  const user_id = currentUser?.user_id
  
  // Program state for flashcard creation
  const [flashcardProgram, setFlashcardProgram] = useState(userRole === "admin" ? "" : userProgram)
  
  // Update flashcardProgram when currentUser loads or changes
  useEffect(() => {
    console.log('=== PROGRAM STATE INITIALIZATION DEBUG ===');
    console.log('currentUser:', currentUser);
    console.log('currentUser.program:', currentUser?.program);
    console.log('userRole:', userRole);
    console.log('userProgram:', userProgram);
    
    if (currentUser) {
      if (userRole === "admin") {
        console.log('Setting flashcardProgram to empty string (admin)');
        setFlashcardProgram("")
      } else {
        console.log('Setting flashcardProgram to:', currentUser.program || "");
        setFlashcardProgram(currentUser.program || "")
      }
    }
    console.log('=======================================');
  }, [currentUser, userRole])
  
  // Debug logging for user info and program state
  if (process.env.NODE_ENV === 'development') {
    console.log('Flashcards - Current User Info:', {
      role: userRole,
      program: userProgram,
      flashcardProgram: flashcardProgram,
      fullUser: currentUser
    })
  }

  // Permission helper functions
  // Permission logic for Students, Tutors, Faculty, Admin
  const canManageFlashcard = (flashcard: any) => {
    // Allow admin to manage any flashcard
    if (!currentUser) return false;
    if (userRole === 'admin') {
      return true;
    }
    // For student, tutor, faculty: only allow editing own sets
    return Number(flashcard.created_by) === Number(user_id);
  }

  const checkFlashcardPermissionAndEdit = (flashcard: any) => {
    if (canManageFlashcard(flashcard)) {
      openEditDialog(flashcard)
    } else {
      toast({
        title: "Access Denied",
        description: "You can only edit flashcards that you created.",
        variant: "destructive",
      })
    }
  }

  const checkFlashcardPermissionAndDelete = (flashcard: any) => {
    if (canManageFlashcard(flashcard)) {
      handleDeleteFlashcard(flashcard.flashcard_id)
    } else {
      toast({
        title: "Access Denied",
        description: "You can only delete flashcards that you created.",
        variant: "destructive",
      })
    }
  }

  const getCreatorIndicator = (flashcard: any) => {
  if (Number(flashcard.created_by) === Number(user_id)) return "You"
  if (flashcard.creator_name) return flashcard.creator_name
  if (flashcard.creator_role) return `${flashcard.creator_role}`
  if (flashcard.created_by) return `User #${flashcard.created_by}`
  return "Unknown"
  }

  // Form states for flashcard creation
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  // Multiple flashcards state (for bulk creation)
  const [flashcardSetTitle, setFlashcardSetTitle] = useState("")
  const [flashcardSetSubject, setFlashcardSetSubject] = useState("")
  const [flashcardsList, setFlashcardsList] = useState<Array<{id: string, question: string, answer: string}>>([])
  const [currentFlashcard, setCurrentFlashcard] = useState<any | null>(null)

  // Database hooks
  const { flashcards, loading: flashcardsLoading, error: flashcardsError, refetch: refetchFlashcards } = useFlashcards(user_id)
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { createFlashcard, creating } = useCreateFlashcard()
  const { updateFlashcard, updating } = useUpdateFlashcard()
  const { deleteFlashcard, deleting } = useDeleteFlashcard()
  
  // Progress hooks
  const { markCompleted, updating: updatingProgress } = useUpdateFlashcardProgress()
  const { progress: userProgress, stats: progressStats, refetch: refetchProgress } = useFlashcardProgress(user_id || null)

  // Filter flashcards based on search and filter criteria
  const filteredFlashcards = flashcards.filter((flashcard: any) => {
    // Search filter
    const matchesSearch = searchQuery.trim() === "" || 
      flashcard.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flashcard.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flashcard.subject_name.toLowerCase().includes(searchQuery.toLowerCase())

    // Subject filter
    const matchesSubject = selectedSubjectFilter === "all" || flashcard.subject_name === selectedSubjectFilter

    // Difficulty filter (assuming difficulty is available, otherwise always match)
    const matchesDifficulty = selectedDifficultyFilter === "all" || (flashcard.difficulty || "Mixed") === selectedDifficultyFilter

    // Program filter - for students, automatically filter by their program
    let matchesProgram = true
    if (userRole === "student") {
      // For students, only show flashcards that exactly match their program
      matchesProgram = flashcard.program && flashcard.program === userProgram
      
      // Debug logging for program filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`Flashcard "${flashcard.question}": program="${flashcard.program}", userProgram="${userProgram}", matches=${matchesProgram}`)
      }
    } else if (userRole === "admin" && selectedProgramFilter !== "all") {
      // For admins, apply the selected program filter
      matchesProgram = flashcard.program === selectedProgramFilter
    }

    return matchesSearch && matchesSubject && matchesDifficulty && matchesProgram
  })

  // Group by flashcard_id if single, group by sub_id if multiple
  const subIdGroups: { [key: string]: any[] } = {};
  filteredFlashcards.forEach((flashcard: any) => {
    if (!subIdGroups[flashcard.sub_id]) {
      subIdGroups[flashcard.sub_id] = [];
    }
    subIdGroups[flashcard.sub_id].push(flashcard);
  });

  let flashcardGroupedSets = Object.values(subIdGroups).map((group) => {
    if (group.length === 1) {
      // Single flashcard, group by flashcard_id
      const flashcard = group[0];
      const cardStatus = flashcard.status || 'not_started';
      const completedCards = cardStatus === 'completed' ? 1 : 0;
      return {
        id: flashcard.flashcard_id,
        sub_id: flashcard.sub_id,
        title: flashcard.question ? flashcard.question.substring(0, 32) + (flashcard.question.length > 32 ? '...' : '') : `Flashcard #${flashcard.flashcard_id}`,
        subject: flashcard.subject_name,
        creator_name: flashcard.creator_name,
        creator_role: flashcard.creator_role,
        created_by: flashcard.created_by,
        cardCount: 1,
        description: flashcard.answer ? flashcard.answer.substring(0, 64) + (flashcard.answer.length > 64 ? '...' : '') : '',
        difficulty: flashcard.difficulty || "Mixed",
        lastStudied: flashcard.completed_at || new Date().toISOString().split('T')[0],
        progress: completedCards * 100,
        completedCards: completedCards,
        created_at: flashcard.created_at,
        cards: [{
          id: flashcard.flashcard_id,
          front: flashcard.question,
          back: flashcard.answer,
          status: cardStatus,
          completed_at: flashcard.completed_at
        }]
      };
    } else {
      // Multiple flashcards, group by sub_id
      const first = group[0];
      const cards = group.map((flashcard: any) => ({
        id: flashcard.flashcard_id,
        front: flashcard.question,
        back: flashcard.answer,
        status: flashcard.status || 'not_started',
        completed_at: flashcard.completed_at
      }));
      const completedCards = cards.filter((card: any) => card.status === 'completed').length;
      // Use the latest created_at among the group
      const latestCreatedAt = group.reduce((latest: string, fc: any) => {
        if (!latest || (fc.created_at && fc.created_at > latest)) return fc.created_at;
        return latest;
      }, "");
      return {
        id: first.sub_id,
        sub_id: first.sub_id,
        title: `Set #${first.sub_id}`,
        subject: first.subject_name,
        creator_name: first.creator_name,
        creator_role: first.creator_role,
        created_by: first.created_by,
        cardCount: cards.length,
        description: `Flashcard set #${first.sub_id}`,
        difficulty: "Mixed",
        lastStudied: new Date().toISOString().split('T')[0],
        progress: Math.round((completedCards / cards.length) * 100),
        completedCards: completedCards,
        created_at: latestCreatedAt,
        cards: cards
      };
    }
  });

  // Sort by latest created_at (descending)
  flashcardGroupedSets = flashcardGroupedSets.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const handleCreateFlashcard = async () => {
    if (!question.trim()) {
      toast({ title: "Error", description: "Question is required.", variant: "destructive" });
      return;
    }
    if (!answer.trim()) {
      toast({ title: "Error", description: "Answer is required.", variant: "destructive" });
      return;
    }
    if (!selectedSubject) {
      toast({ title: "Error", description: "Subject is required.", variant: "destructive" });
      return;
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

      // Find the max sub_id from all flashcards to increment
      let maxSubId = 0;
      if (flashcards && flashcards.length > 0) {
        maxSubId = Math.max(...flashcards.map((fc: any) => fc.sub_id || 0));
      }
      const newSubId = maxSubId + 1;

      console.log('=== FLASHCARD CREATION DEBUG ===');
      console.log('Flashcard Program State:', flashcardProgram);
      console.log('User Program:', userProgram);
      console.log('User Role:', userRole);
      console.log('Current User:', currentUser);
      console.log('currentUser.program:', currentUser.program);
      
      // Use currentUser.program directly if flashcardProgram is empty for students
      const programToSend = userRole === "admin" ? flashcardProgram : (flashcardProgram || currentUser.program || userProgram);
      console.log('Final program value to send:', programToSend);
      console.log('Program value type:', typeof programToSend);
      console.log('Program value length:', programToSend ? programToSend.length : 'null/undefined');
      
      // Validate program is selected
      if (!programToSend || programToSend.trim() === '') {
        toast({
          title: "Error",
          description: "Please select a program.",
          variant: "destructive",
        });
        return;
      }
      
      // Create the flashcard data object first
      const flashcardData = {
        question: question.trim(),
        answer: answer.trim(),
        subject_id: subject.subject_id,
        created_by: currentUser.user_id,
        sub_id: newSubId,
        program: programToSend
      };
      
      console.log('Complete flashcard data object:', JSON.stringify(flashcardData, null, 2));
      console.log('====================================');

      await createFlashcard(flashcardData)

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
      
      // Refresh flashcards and progress
      refetchFlashcards()
      refetchProgress()
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
      
          // Refresh flashcards and progress
          refetchFlashcards()
          refetchProgress()
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
        subject_id: subject.subject_id,
        program: flashcardProgram
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
      
      // Refresh flashcards and progress
      refetchFlashcards()
      refetchProgress()
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

      // Refresh flashcards and progress
      refetchFlashcards()
      refetchProgress()
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

  // Functions for handling multiple flashcards
  const handleCreateFlashcardSet = async () => {
    if (!flashcardSetTitle.trim() || !flashcardSetSubject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in set title and subject.",
        variant: "destructive",
      })
      return
    }

    if (flashcardsList.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one flashcard",
        variant: "destructive"
      })
      return
    }

    try {
      // Find subject ID by name
      const subject = subjects.find(s => s.subject_name === flashcardSetSubject)
      if (!subject) {
        toast({
          title: "Error",
          description: "Invalid subject selected",
          variant: "destructive"
        })
        return
      }

      // Find the max sub_id from all flashcards to increment
      let maxSubId = 0;
      if (flashcards && flashcards.length > 0) {
        maxSubId = Math.max(...flashcards.map((fc: any) => fc.sub_id || 0));
      }
      const newSubId = maxSubId + 1;

      console.log('=== FLASHCARD SET CREATION DEBUG ===');
      console.log('Flashcard Program State:', flashcardProgram);
      console.log('User Program:', userProgram);
      console.log('User Role:', userRole);
      console.log('Current User:', currentUser);
      console.log('Set Title:', flashcardSetTitle);
      console.log('Set Subject:', flashcardSetSubject);
      console.log('Subject Object:', subject);
      console.log('Flashcards List:', flashcardsList);
      console.log('====================================');

      if (editingFlashcardSet) {
        // Update existing flashcard set
        // First, delete all existing flashcards in the set
        for (const card of editingFlashcardSet.cards) {
          try {
            await deleteFlashcard(card.id)
          } catch (deleteError) {
            console.error(`Error deleting flashcard ${card.id}:`, deleteError)
          }
        }

        // Then create new flashcards with the same sub_id
        for (const [index, flashcard] of flashcardsList.entries()) {
          try {
            console.log(`Creating flashcard ${index + 1} with program:`, flashcardProgram);
            await createFlashcard({
              question: flashcard.question.trim(),
              answer: flashcard.answer.trim(),
              subject_id: subject.subject_id,
              created_by: currentUser?.user_id || 1,
              sub_id: editingFlashcardSet.sub_id || newSubId,
              program: flashcardProgram
            })
          } catch (flashcardError) {
            console.error(`Error creating flashcard ${index + 1}:`, flashcardError)
          }
        }

        toast({
          title: "Success",
          description: `Updated flashcard set with ${flashcardsList.length} flashcards successfully!`
        })
      } else {
        // Create new flashcard set with new sub_id
        for (const [index, flashcard] of flashcardsList.entries()) {
          try {
            console.log(`Creating new flashcard ${index + 1} with program:`, flashcardProgram);
            await createFlashcard({
              question: flashcard.question.trim(),
              answer: flashcard.answer.trim(),
              subject_id: subject.subject_id,
              created_by: currentUser?.user_id || 1,
              sub_id: newSubId,
              program: flashcardProgram
            })
          } catch (flashcardError) {
            console.error(`Error creating flashcard ${index + 1}:`, flashcardError)
          }
        }

        toast({
          title: "Success",
          description: `Created ${flashcardsList.length} flashcards successfully!`
        })
      }
      
      // Refresh flashcards list and progress
      await refetchFlashcards()
      refetchProgress()
      
      // Reset form
      setFlashcardSetTitle("")
      setFlashcardSetSubject("")
      setFlashcardsList([])
      setCurrentFlashcard(null)
      setEditingFlashcardSet(null)
      setShowCreateDialog(false)
      
    } catch (error) {
      console.error('Error managing flashcard set:', error)
      toast({
        title: "Error",
        description: "Failed to save flashcard set. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddFlashcard = () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Error",
        description: "Please enter both question and answer.",
        variant: "destructive",
      })
      return
    }

    const newFlashcard = {
      id: `fc${Date.now()}`,
      question: question.trim(),
      answer: answer.trim()
    }

    if (editingFlashcardIndex !== null) {
      // Update existing flashcard
      setFlashcardsList(prev => prev.map((fc, index) => 
        index === editingFlashcardIndex ? newFlashcard : fc
      ))
      setEditingFlashcardIndex(null)
    } else {
      // Add new flashcard
      setFlashcardsList(prev => [...prev, newFlashcard])
    }

    // Reset flashcard form
    setQuestion("")
    setAnswer("")
    setShowFlashcardDialog(false)

    toast({
      title: editingFlashcardIndex !== null ? "Flashcard Updated" : "Flashcard Added",
      description: editingFlashcardIndex !== null ? "Flashcard has been updated." : "New flashcard has been added to the set.",
    })
  }

  const handleEditFlashcardInList = (index: number) => {
    const flashcard = flashcardsList[index]
    setEditingFlashcardIndex(index)
    setQuestion(flashcard.question)
    setAnswer(flashcard.answer)
    setShowFlashcardDialog(true)
  }

  const handleDeleteFlashcardFromList = (index: number) => {
    setFlashcardsList(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Flashcard Removed",
      description: "Flashcard has been removed from the set.",
    })
  }

  const startStudying = (set: any) => {
    setSelectedSet(set)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setStudyMode(true)
  }

  const handleEditFlashcardSet = (set: any) => {
    // Check if user can edit this flashcard set
    if (!currentUser || !canManageFlashcard(set)) {
      toast({
        title: "Access Denied",
        description: "You can only edit flashcard sets that you created.",
        variant: "destructive",
      })
      return
    }

    // Set editing mode
    setEditingFlashcardSet(set)
    
    // Set up for editing the flashcard set
    setCurrentFlashcard({})
    setFlashcardSetTitle(set.title)
    setFlashcardSetSubject(set.subject)
    
    // Convert set cards to flashcard list format
    const flashcardList = set.cards.map((card: any) => ({
      id: card.id.toString(),
      question: card.front,
      answer: card.back
    }))
    setFlashcardsList(flashcardList)
    setShowCreateDialog(true)
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

  const handleFinishFlashcard = async () => {
    if (!selectedSet || !currentUser) return
    
    const currentCard = selectedSet.cards[currentCardIndex]
    
    try {
      await markCompleted(currentCard.id, currentUser.user_id)
      
      // Update the card status in the current set
      const updatedCards = [...selectedSet.cards]
      updatedCards[currentCardIndex] = {
        ...updatedCards[currentCardIndex],
        status: 'completed'
      }
      
      setSelectedSet({
        ...selectedSet,
        cards: updatedCards
      })
      
      // Refresh progress data
      refetchProgress()
      refetchFlashcards()
      
      // Auto-advance to next card if available
      if (currentCardIndex < selectedSet.cards.length - 1) {
        nextCard()
      }
    } catch (error) {
      console.error('Error marking flashcard as completed:', error)
    }
  }

  const handleNextOrComplete = async () => {
    if (!selectedSet || !currentUser) return;
    try {
      const isLastCard = currentCardIndex === selectedSet.cards.length - 1;
      if (isLastCard) {
        // Mark all cards as completed and finish set
        const updatedCards = [...selectedSet.cards];
        for (let i = 0; i < updatedCards.length; i++) {
          if (updatedCards[i].status !== 'completed') {
            await markCompleted(updatedCards[i].id, currentUser.user_id);
            updatedCards[i] = {
              ...updatedCards[i],
              status: 'completed'
            };
          }
        }
        setSelectedSet({
          ...selectedSet,
          cards: updatedCards
        });
        refetchProgress();
        refetchFlashcards();
        // Show completion message and go back to sets
        toast({
          title: "Congratulations!",
          description: "You've completed this flashcard set! 🎉",
          duration: 4000
        });
        setTimeout(() => {
          setStudyMode(false);
        }, 2000);
      } else {
        // Just go to next card, do not mark as completed
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error('Error marking flashcard as completed:', error);
    }
  }

  const FlashcardSetCard = ({ set }: { set: any }) => {
    const [expanded, setExpanded] = useState(false)
    const [revealedIndex, setRevealedIndex] = useState<number | null>(null)

    return (
      <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Set name/title hidden */}
              {/* <CardTitle className="text-xl">{set.title}</CardTitle> */}
              <CardDescription className="text-base mt-1">{set.subject}</CardDescription>
              <Badge variant={set.difficulty === "Beginner" ? "secondary" : set.difficulty === "Intermediate" ? "default" : "destructive"}>
                {set.difficulty}
              </Badge>
              {/* Show creator name and role */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                <User className="w-3 h-3" />
                <span>
                  Created by: {getCreatorIndicator(set)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            {set.completedCards > 0 && (
              <div className="flex items-center">
                <span className="text-green-600 font-medium">Completed ({set.completedCards} attempts)</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Progress</Label>
              <span>{set.progress}%</span>
            </div>
            <Progress value={set.progress} className="h-2" />
          </div>

          {/* Summary info instead of individual flashcards */}
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-muted-foreground">{set.cardCount}</div>
            <div className="text-sm text-muted-foreground">
              {set.cardCount === 1 ? 'Flashcard' : 'Flashcards'} ready to study
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={() => startStudying(set)}
              disabled={set.cardCount === 0}
            >
              <Brain className="w-4 h-4 mr-2" />
              Study Now
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditFlashcardSet(set)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Set
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
              <Star className="w-4 h-4 mr-2" />
              {expanded ? 'Hide flashcards' : 'Show flashcards'}
            </Button>
          </div>

          {expanded && (
            <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
              {set.cards.map((card: any, idx: number) => (
                <div key={card.id} className="p-2 border rounded flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{idx + 1}. {card.front}</div>
                    {revealedIndex === idx && (
                      <div className="text-xs text-muted-foreground mt-1">{card.back}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Button size="sm" variant="outline" onClick={() => setRevealedIndex(revealedIndex === idx ? null : idx)}>
                      {revealedIndex === idx ? 'Hide' : 'Answer'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {set.cardCount === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              No flashcards in this set yet.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (studyMode && selectedSet) {
    const currentCard = selectedSet.cards[currentCardIndex]
    const progress = ((currentCardIndex + 1) / selectedSet.cards.length) * 100
    const isCompleted = currentCard.status === 'completed'

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
                {isCompleted && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
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
            className={`min-h-[300px] cursor-pointer hover:shadow-lg transition-all duration-200 ${
              isCompleted ? 'border-green-200 bg-green-50' : ''
            }`}
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
                {isCompleted && (
                  <div className="flex items-center justify-center text-green-600">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
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
              onClick={handleNextOrComplete}
              disabled={updatingProgress}
              className={`px-6 py-2 ${
                currentCardIndex === selectedSet.cards.length - 1 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              size="lg"
            >
              {updatingProgress ? (
                "Processing..."
              ) : currentCardIndex === selectedSet.cards.length - 1 ? (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Complete Set
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Flashcard
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setEditingFlashcard(null)
              setCurrentFlashcard(null)
              console.log('Modal opened: flashcardProgram value is', flashcardProgram);
              setShowCreateDialog(true)
            }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Single Flashcard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setCurrentFlashcard({})
              setFlashcardSetTitle("")
              setFlashcardSetSubject("")
              setFlashcardsList([])
              setEditingFlashcardSet(null)
              setShowCreateDialog(true)
            }}>
              <Layers className="w-4 h-4 mr-2" />
              Flashcard Set
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search flashcards by question, answer or subject..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* View Mode Toggle */}
    {/* Hide list type, only show set type */}
        
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(selectedSubjectFilter !== "all" || selectedDifficultyFilter !== "all" || (userRole === "admin" && selectedProgramFilter !== "all")) && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {[selectedSubjectFilter, selectedDifficultyFilter, userRole === "admin" ? selectedProgramFilter : null].filter(f => f !== "all" && f !== null).length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Flashcards</DialogTitle>
              <DialogDescription>
                Filter flashcards by subject and difficulty
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Program Filter - Only show for admins */}
              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={selectedProgramFilter} onValueChange={setSelectedProgramFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programOptions.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_name}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={selectedDifficultyFilter} onValueChange={setSelectedDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedSubjectFilter("all")
                    setSelectedDifficultyFilter("all")
                    setSelectedProgramFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main content below search/filter bar */}
      <>
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
              {filteredFlashcards.length === 0 && flashcards.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first flashcard to start studying
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Flashcard
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards match your filters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search terms or filters to find flashcards
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" onClick={() => {
                      setSearchQuery("")
                      setSelectedSubjectFilter("all")
                      setSelectedDifficultyFilter("all")
                    }}>
                      Clear All Filters
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Flashcard
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-4">
            {filteredFlashcards.map((flashcard: any) => (
              <Card key={flashcard.flashcard_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{flashcard.subject_name}</Badge>
                      {flashcard.status === 'completed' && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <Star className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {flashcard.status === 'in_progress' && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          In Progress
                        </Badge>
                      )}
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
                    
                    {/* Creator indicator */}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground border-t pt-2 mt-2">
                      <User className="w-3 h-3" />
                      <span>Created by: {getCreatorIndicator(flashcard)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkFlashcardPermissionAndEdit(flashcard)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkFlashcardPermissionAndDelete(flashcard)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredFlashcards.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              {flashcards.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first flashcard to start studying
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Flashcard
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcards match your filters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search terms or filters to find flashcards
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" onClick={() => {
                      setSearchQuery("")
                      setSelectedSubjectFilter("all")
                      setSelectedDifficultyFilter("all")
                    }}>
                      Clear All Filters
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Flashcard
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Flashcard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={() => {
        setShowCreateDialog(false)
        setEditingFlashcard(null)
        setCurrentFlashcard(null)
        setQuestion("")
        setAnswer("")
        setSelectedSubject("")
        setFlashcardSetTitle("")
        setFlashcardSetSubject("")
        setFlashcardsList([])
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFlashcard ? "Edit Flashcard" : 
               currentFlashcard && Object.keys(currentFlashcard).length === 0 ? 
                 (editingFlashcardSet ? "Edit Flashcard Set" : "Create Flashcard Set") : 
               "Create Single Flashcard"}
            </DialogTitle>
            <DialogDescription>
              {editingFlashcard ? "Update your flashcard" : 
               currentFlashcard && Object.keys(currentFlashcard).length === 0 ? 
                 (editingFlashcardSet ? "Update multiple flashcards in this set" : "Create multiple flashcards in one go") : 
               "Create a single flashcard to study with"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Single Flashcard Creation/Edit */}
          {(!currentFlashcard || editingFlashcard) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select value={flashcardProgram} onValueChange={(value) => {
                  console.log('Program dropdown selected:', value);
                  setFlashcardProgram(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole === "admin" ? (
                      programOptions.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))
                    ) : (
                      // Students can only see their own program
                      userProgram && (
                        <SelectItem key={userProgram} value={userProgram}>
                          {userProgram}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setEditingFlashcard(null)
                  setQuestion("")
                  setAnswer("")
                  setSelectedSubject("")
                }}>
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
          )}

          {/* Flashcard Set Creation */}
          {currentFlashcard && Object.keys(currentFlashcard).length === 0 && !editingFlashcard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Set Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Set Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setTitle">Set Title</Label>
                    <Input 
                      id="setTitle" 
                      placeholder="Enter set title"
                      value={flashcardSetTitle}
                      onChange={(e) => setFlashcardSetTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setProgram">Program</Label>
                    <Select value={flashcardProgram} onValueChange={val => {
                      console.log('Set dropdown selected program:', val);
                      setFlashcardProgram(val);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRole === "admin" ? (
                          programOptions.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))
                        ) : (
                          // Students can only see their own program
                          userProgram && (
                            <SelectItem key={userProgram} value={userProgram}>
                              {userProgram}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setSubject">Subject</Label>
                    <Select value={flashcardSetSubject} onValueChange={setFlashcardSetSubject}>
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
                </div>
              </div>

              {/* Flashcards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Flashcards ({flashcardsList.length})</h3>
                  <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Flashcard
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingFlashcardIndex !== null ? "Edit Flashcard" : "Add New Flashcard"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Textarea 
                            placeholder="Enter the question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer</Label>
                          <Textarea 
                            placeholder="Enter the answer..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setShowFlashcardDialog(false)
                            setEditingFlashcardIndex(null)
                            setQuestion("")
                            setAnswer("")
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddFlashcard}>
                            {editingFlashcardIndex !== null ? "Update Flashcard" : "Add Flashcard"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Flashcards List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {flashcardsList.map((flashcard, index) => (
                    <Card key={flashcard.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{index + 1}. {flashcard.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">{flashcard.answer}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditFlashcardInList(index)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteFlashcardFromList(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {flashcardsList.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No flashcards added yet</p>
                      <p className="text-xs">Click "Add Flashcard" to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Flashcard Set Actions */}
          {currentFlashcard && Object.keys(currentFlashcard).length === 0 && !editingFlashcard && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false)
                setCurrentFlashcard(null)
                setFlashcardSetTitle("")
                setFlashcardSetSubject("")
                setFlashcardsList([])
                setEditingFlashcardSet(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateFlashcardSet}>
                {editingFlashcardSet ? "Update Flashcard Set" : "Create Flashcard Set"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
    </div>
  );
}
