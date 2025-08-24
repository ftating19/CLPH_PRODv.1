"use client"

import { useState } from "react"
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
import { Layers, Plus, RotateCcw, ChevronLeft, ChevronRight, BookOpen, Brain, Search, Filter, Star, Clock } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

const flashcardSets = [
  {
    id: 1,
    title: "Data Structures Terms",
    subject: "Computer Science",
    cardCount: 25,
    description: "Essential data structures vocabulary and definitions",
    difficulty: "Beginner",
    lastStudied: "2024-08-20",
    progress: 80,
    cards: [
      { id: 1, front: "Array", back: "A collection of elements stored at contiguous memory locations" },
      { id: 2, front: "Linked List", back: "A linear data structure where elements are stored in nodes" },
      { id: 3, front: "Stack", back: "A LIFO (Last In First Out) data structure" },
      { id: 4, front: "Queue", back: "A FIFO (First In First Out) data structure" },
      { id: 5, front: "Binary Tree", back: "A hierarchical data structure with at most two children per node" },
    ]
  },
  {
    id: 2,
    title: "SQL Commands",
    subject: "Database Systems",
    cardCount: 30,
    description: "Common SQL commands and their syntax",
    difficulty: "Intermediate",
    lastStudied: "2024-08-19",
    progress: 60,
    cards: [
      { id: 1, front: "SELECT", back: "Retrieves data from one or more tables" },
      { id: 2, front: "INSERT", back: "Adds new rows to a table" },
      { id: 3, front: "UPDATE", back: "Modifies existing data in a table" },
      { id: 4, front: "DELETE", back: "Removes rows from a table" },
      { id: 5, front: "JOIN", back: "Combines rows from two or more tables" },
    ]
  },
  {
    id: 3,
    title: "JavaScript Methods",
    subject: "Web Development",
    cardCount: 20,
    description: "Important JavaScript array and object methods",
    difficulty: "Intermediate",
    lastStudied: "2024-08-18",
    progress: 90,
    cards: [
      { id: 1, front: "map()", back: "Creates a new array with the results of calling a function for every array element" },
      { id: 2, front: "filter()", back: "Creates a new array with all elements that pass the test implemented by the provided function" },
      { id: 3, front: "reduce()", back: "Executes a reducer function on each element of the array, resulting in single output value" },
      { id: 4, front: "forEach()", back: "Executes a provided function once for each array element" },
      { id: 5, front: "find()", back: "Returns the first element in the array that satisfies the provided testing function" },
    ]
  },
  {
    id: 4,
    title: "Network Protocols",
    subject: "Computer Networks",
    cardCount: 15,
    description: "Essential networking protocols and their purposes",
    difficulty: "Advanced",
    lastStudied: "2024-08-17",
    progress: 45,
    cards: [
      { id: 1, front: "HTTP", back: "HyperText Transfer Protocol - used for transferring web pages" },
      { id: 2, front: "HTTPS", back: "HTTP Secure - encrypted version of HTTP" },
      { id: 3, front: "TCP", back: "Transmission Control Protocol - reliable, connection-oriented protocol" },
      { id: 4, front: "UDP", back: "User Datagram Protocol - fast, connectionless protocol" },
      { id: 5, front: "DNS", back: "Domain Name System - translates domain names to IP addresses" },
    ]
  },
]

export default function Flashcards() {
  const [selectedSet, setSelectedSet] = useState<any>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const { currentUser } = useUser()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'

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

  const FlashcardSetCard = ({ set }: { set: (typeof flashcardSets)[0] }) => (
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

          <Progress value={progress} className="h-2" />

          <div className="relative h-80">
            <Card 
              className="absolute inset-0 cursor-pointer transition-transform duration-300 hover:scale-105"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <CardContent className="h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {isFlipped ? "Answer" : "Question"}
                  </div>
                  <div className="text-2xl font-medium">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Click to {isFlipped ? "see question" : "reveal answer"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">Study with interactive flashcard sets</p>
        </div>
        {userRole === "admin" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Set
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Flashcard Set</DialogTitle>
                <DialogDescription>
                  Create a new set of flashcards to study
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter flashcard set title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Enter subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter description" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Set
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search flashcard sets..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {flashcardSets.map((set) => (
          <FlashcardSetCard key={set.id} set={set} />
        ))}
      </div>

      {flashcardSets.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No flashcard sets yet</h3>
          {userRole === "admin" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first flashcard set to start studying
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Set
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              No flashcard sets have been created yet. Check back later for new study materials!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
