"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Brain, Clock, Trophy, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

const quizzes = [
  {
    id: 1,
    title: "Data Structures Fundamentals",
    subject: "Computer Science",
    questions: 10,
    duration: "15 min",
    difficulty: "Beginner",
    description: "Test your knowledge of arrays, linked lists, and basic data structures",
  },
  {
    id: 2,
    title: "Database Design Principles",
    subject: "Information Systems",
    questions: 15,
    duration: "20 min",
    difficulty: "Intermediate",
    description: "Explore normalization, relationships, and database optimization",
  },
  {
    id: 3,
    title: "Network Security Basics",
    subject: "Cybersecurity",
    questions: 12,
    duration: "18 min",
    difficulty: "Intermediate",
    description: "Learn about encryption, firewalls, and security protocols",
  },
  {
    id: 4,
    title: "Web Development HTML/CSS",
    subject: "Web Development",
    questions: 8,
    duration: "12 min",
    difficulty: "Beginner",
    description: "Master the fundamentals of HTML structure and CSS styling",
  },
  {
    id: 5,
    title: "JavaScript ES6 Features",
    subject: "Programming",
    questions: 20,
    duration: "25 min",
    difficulty: "Advanced",
    description: "Deep dive into modern JavaScript features and syntax",
  },
  {
    id: 6,
    title: "Software Engineering Principles",
    subject: "Software Engineering",
    questions: 14,
    duration: "22 min",
    difficulty: "Intermediate",
    description: "Understand SOLID principles, design patterns, and best practices",
  },
]

const flashcardSets = [
  {
    id: 1,
    title: "Programming Terminology",
    subject: "Computer Science",
    cards: 25,
    description: "Essential programming terms and definitions",
  },
  {
    id: 2,
    title: "Database Commands",
    subject: "Database",
    cards: 18,
    description: "SQL commands and database operations",
  },
  {
    id: 3,
    title: "Network Protocols",
    subject: "Networking",
    cards: 15,
    description: "Common network protocols and their functions",
  },
  {
    id: 4,
    title: "Cybersecurity Terms",
    subject: "Security",
    cards: 22,
    description: "Security concepts and terminology",
  },
]

const sampleQuestions = [
  {
    question: "What is the time complexity of searching in a balanced binary search tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 1,
  },
  {
    question: "Which data structure follows LIFO (Last In, First Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correct: 1,
  },
  {
    question: "What does SQL stand for?",
    options: ["Simple Query Language", "Structured Query Language", "Standard Query Language", "System Query Language"],
    correct: 1,
  },
]

const sampleFlashcards = [
  { front: "Algorithm", back: "A step-by-step procedure for solving a problem or completing a task" },
  {
    front: "API",
    back: "Application Programming Interface - a set of protocols and tools for building software applications",
  },
  {
    front: "Recursion",
    back: "A programming technique where a function calls itself to solve smaller instances of the same problem",
  },
]

export default function QuizzesFlashcards() {
  const [activeTab, setActiveTab] = useState<"quizzes" | "flashcards">("quizzes")
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [score, setScore] = useState<number | null>(null)

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz)
    setQuizStarted(true)
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setScore(null)
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate score
      const correctAnswers = selectedAnswers.reduce((acc, answer, index) => {
        return acc + (answer === sampleQuestions[index].correct ? 1 : 0)
      }, 0)
      setScore(Math.round((correctAnswers / sampleQuestions.length) * 100))
    }
  }

  const resetQuiz = () => {
    setQuizStarted(false)
    setSelectedQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setScore(null)
  }

  const startFlashcards = (set: any) => {
    setSelectedFlashcardSet(set)
    setCurrentCard(0)
    setShowAnswer(false)
  }

  const nextCard = () => {
    if (currentCard < sampleFlashcards.length - 1) {
      setCurrentCard(currentCard + 1)
      setShowAnswer(false)
    }
  }

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setShowAnswer(false)
    }
  }

  const resetFlashcards = () => {
    setSelectedFlashcardSet(null)
    setCurrentCard(0)
    setShowAnswer(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quizzes & Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Interactive learning tools for self-paced study</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "quizzes" ? "default" : "outline"}
            onClick={() => setActiveTab("quizzes")}
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Quizzes</span>
          </Button>
          <Button
            variant={activeTab === "flashcards" ? "default" : "outline"}
            onClick={() => setActiveTab("flashcards")}
            className="flex items-center space-x-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Flashcards</span>
          </Button>
        </div>
      </div>

      {activeTab === "quizzes" && (
        <div>
          {!selectedQuiz ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge
                        variant={
                          quiz.difficulty === "Beginner"
                            ? "secondary"
                            : quiz.difficulty === "Intermediate"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{quiz.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center space-x-1">
                        <Brain className="h-4 w-4" />
                        <span>{quiz.questions} questions</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.duration}</span>
                      </span>
                    </div>
                    <Button onClick={() => startQuiz(quiz)} className="w-full">
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedQuiz.title}</CardTitle>
                  <Button variant="outline" size="sm" onClick={resetQuiz}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
                {score === null && (
                  <Progress value={(currentQuestion / sampleQuestions.length) * 100} className="w-full" />
                )}
              </CardHeader>
              <CardContent>
                {score !== null ? (
                  <div className="text-center space-y-4">
                    <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
                    <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                    <p className="text-lg">Your Score: {score}%</p>
                    <Button onClick={resetQuiz}>Take Another Quiz</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Question {currentQuestion + 1} of {sampleQuestions.length}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">{sampleQuestions[currentQuestion].question}</h3>
                    <div className="space-y-3">
                      {sampleQuestions[currentQuestion].options.map((option, index) => (
                        <Button
                          key={index}
                          variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"}
                          className="w-full text-left justify-start"
                          onClick={() => selectAnswer(index)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={nextQuestion}
                      disabled={selectedAnswers[currentQuestion] === undefined}
                      className="w-full"
                    >
                      {currentQuestion === sampleQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "flashcards" && (
        <div>
          {!selectedFlashcardSet ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashcardSets.map((set) => (
                <Card key={set.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{set.title}</CardTitle>
                    <CardDescription>{set.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{set.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{set.cards} cards</span>
                      </span>
                    </div>
                    <Button onClick={() => startFlashcards(set)} className="w-full">
                      Study Cards
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedFlashcardSet.title}</CardTitle>
                  <Button variant="outline" size="sm" onClick={resetFlashcards}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Back to Sets
                  </Button>
                </div>
                <Progress value={((currentCard + 1) / sampleFlashcards.length) * 100} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center text-sm text-gray-500">
                    Card {currentCard + 1} of {sampleFlashcards.length}
                  </div>
                  <div
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 min-h-[200px] flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowAnswer(!showAnswer)}
                  >
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">
                        {showAnswer ? sampleFlashcards[currentCard].back : sampleFlashcards[currentCard].front}
                      </p>
                      <p className="text-sm text-gray-500">{showAnswer ? "Definition" : "Click to reveal answer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={prevCard} disabled={currentCard === 0}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button onClick={() => setShowAnswer(!showAnswer)}>
                      {showAnswer ? "Show Question" : "Show Answer"}
                    </Button>
                    <Button variant="outline" onClick={nextCard} disabled={currentCard === sampleFlashcards.length - 1}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
