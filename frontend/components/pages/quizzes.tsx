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
import { BookOpen, Brain, Clock, Trophy, Plus, Search, Filter, Star, Play, CheckCircle } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

const quizzes = [
  {
    id: 1,
    title: "Data Structures Fundamentals",
    subject: "Computer Science",
    questions: 10,
    duration: "15 min",
    difficulty: "Beginner",
    description: "Test your knowledge of arrays, linked lists, and basic data structures",
    completedTimes: 3,
    bestScore: 85,
    lastAttempt: "2024-08-20",
  },
  {
    id: 2,
    title: "Database Design Principles",
    subject: "Information Systems",
    questions: 15,
    duration: "20 min",
    difficulty: "Intermediate",
    description: "Explore normalization, relationships, and database optimization",
    completedTimes: 1,
    bestScore: 92,
    lastAttempt: "2024-08-19",
  },
  {
    id: 3,
    title: "Network Security Basics",
    subject: "Cybersecurity",
    questions: 12,
    duration: "18 min",
    difficulty: "Intermediate",
    description: "Learn about encryption, firewalls, and security protocols",
    completedTimes: 2,
    bestScore: 78,
    lastAttempt: "2024-08-18",
  },
  {
    id: 4,
    title: "Web Development HTML/CSS",
    subject: "Web Development",
    questions: 8,
    duration: "12 min",
    difficulty: "Beginner",
    description: "Master the fundamentals of HTML structure and CSS styling",
    completedTimes: 5,
    bestScore: 95,
    lastAttempt: "2024-08-17",
  },
  {
    id: 5,
    title: "JavaScript ES6 Features",
    subject: "Programming",
    questions: 20,
    duration: "25 min",
    difficulty: "Advanced",
    description: "Advanced JavaScript concepts including promises, async/await, and modules",
    completedTimes: 0,
    bestScore: null,
    lastAttempt: null,
  },
  {
    id: 6,
    title: "Algorithm Complexity",
    subject: "Computer Science",
    questions: 14,
    duration: "22 min",
    difficulty: "Advanced",
    description: "Big O notation, time complexity, and algorithm analysis",
    completedTimes: 1,
    bestScore: 71,
    lastAttempt: "2024-08-16",
  },
]

export default function Quizzes() {
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { currentUser } = useUser()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz)
    // Here you would implement the quiz taking functionality
    console.log("Starting quiz:", quiz.title)
  }

  const QuizCard = ({ quiz }: { quiz: (typeof quizzes)[0] }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{quiz.title}</CardTitle>
            <CardDescription className="text-base mt-1">{quiz.subject}</CardDescription>
          </div>
          <Badge variant={quiz.difficulty === "Beginner" ? "secondary" : quiz.difficulty === "Intermediate" ? "default" : "destructive"}>
            {quiz.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{quiz.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{quiz.questions} questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{quiz.duration}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span>Best: {quiz.bestScore ? `${quiz.bestScore}%` : "Not attempted"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span>{quiz.completedTimes} attempts</span>
          </div>
        </div>

        {quiz.lastAttempt && (
          <div className="text-xs text-muted-foreground">
            Last attempt: {new Date(quiz.lastAttempt).toLocaleDateString()}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button 
            className="flex-1" 
            onClick={() => startQuiz(quiz)}
          >
            <Play className="w-4 h-4 mr-2" />
            {quiz.completedTimes > 0 ? "Retake Quiz" : "Start Quiz"}
          </Button>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with interactive quizzes</p>
        </div>
        {userRole === "admin" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
                <DialogDescription>
                  Create a new quiz for students to practice with
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter quiz title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Enter subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" placeholder="15" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Quiz
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
          <Input placeholder="Search quizzes by title or subject..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No quizzes available</h3>
          {userRole === "admin" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quiz to start testing knowledge
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              No quizzes have been created yet. Check back later for new content!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
