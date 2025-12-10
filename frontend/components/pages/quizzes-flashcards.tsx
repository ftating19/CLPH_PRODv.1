"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Brain, Clock, Trophy, ChevronLeft, ChevronRight, RotateCcw, Loader2 } from "lucide-react"
import { useQuizzes, useQuizQuestions, useQuizAttempts } from "@/hooks/use-quizzes"

// Keep flashcard sets as sample data for now
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
  const [flashcardSets, setFlashcardSets] = useState<any[]>([])
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null)

  // Database hooks
  const { quizzes, loading: quizzesLoading, error: quizzesError } = useQuizzes()
  const { questions, loading: questionsLoading, error: questionsError } = useQuizQuestions(
    selectedQuiz?.quizzes_id || null
  )
  const { createAttempt } = useQuizAttempts()

  // Fetch flashcard sets from backend
  useEffect(() => {
    if (activeTab !== "flashcards") return;
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    fetch(apiUrl("/api/flashcards"))
      .then((res) => res.json())
      .then((data) => {
        setFlashcardSets(data.sets || []);
      })
      .catch((err) => {
        setFlashcardsError("Failed to load flashcard sets.");
        setFlashcardSets([]);
      })
      .finally(() => setFlashcardsLoading(false));
  }, [activeTab]);

  // Fetch flashcards for selected set
  useEffect(() => {
    if (!selectedFlashcardSet) return;
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    fetch(apiUrl(`/api/flashcards/${selectedFlashcardSet.id}`))
      .then((res) => res.json())
      .then((data) => {
        setFlashcards(data.cards || []);
      })
      .catch((err) => {
        setFlashcardsError("Failed to load flashcards.");
        setFlashcards([]);
      })
      .finally(() => setFlashcardsLoading(false));
  }, [selectedFlashcardSet]);

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

  const nextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate score
      const correctAnswers = selectedAnswers.reduce((acc, answer, index) => {
        if (questions[index]) {
          // Check if the selected answer matches the correct answer
          const selectedChoice = questions[index].choices[answer]
          return acc + (selectedChoice === questions[index].answer ? 1 : 0)
        }
        return acc
      }, 0)
      
      const finalScore = Math.round((correctAnswers / questions.length) * 100)
      setScore(finalScore)

      // Save quiz attempt to database
      try {
        await createAttempt({
          quizzes_id: selectedQuiz.quizzes_id,
          user_id: 1, // TODO: Get actual user ID from auth context
          name: "Anonymous User", // TODO: Get actual user name from auth context
          score: finalScore
        })
      } catch (err) {
        console.error('Failed to save quiz attempt:', err)
      }
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
    setFlashcards([])
  }

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
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
    setFlashcards([])
  }

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'secondary'
      case 'intermediate':
      case 'medium':
        return 'default'
      case 'advanced':
      case 'hard':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
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
            <div>
              {quizzesError && (
                <Alert className="mb-6">
                  <AlertDescription>
                    Error loading quizzes: {quizzesError}
                  </AlertDescription>
                </Alert>
              )}
              
              {quizzesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <div className="flex justify-between mb-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.map((quiz) => (
                    <Card key={quiz.quizzes_id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          <Badge variant={getDifficultyVariant(quiz.difficulty)}>
                            {quiz.difficulty || 'Medium'}
                          </Badge>
                        </div>
                        <CardDescription>{quiz.subject_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {'Test your knowledge in this subject area'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span className="flex items-center space-x-1">
                            <Brain className="h-4 w-4" />
                            <span>{quiz.item_counts || 10} questions</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(quiz.duration || 15)}</span>
                          </span>
                        </div>
                        <Button onClick={() => startQuiz(quiz)} className="w-full">
                          Start Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {!quizzesLoading && quizzes.length === 0 && !quizzesError && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Quizzes Available</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Check back later for new quizzes to test your knowledge.
                    </p>
                  </CardContent>
                </Card>
              )}
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
                {score === null && questions.length > 0 && (
                  <Progress value={(currentQuestion / questions.length) * 100} className="w-full" />
                )}
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading questions...</span>
                    </div>
                  </div>
                ) : questionsError ? (
                  <Alert>
                    <AlertDescription>
                      Error loading questions: {questionsError}
                    </AlertDescription>
                  </Alert>
                ) : questions.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Questions Available</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This quiz doesn't have any questions yet.
                    </p>
                    <Button onClick={resetQuiz} className="mt-4">
                      Back to Quizzes
                    </Button>
                  </div>
                ) : score !== null ? (
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
                        Question {currentQuestion + 1} of {questions.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {questions[currentQuestion]?.choices?.map((option, index) => (
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
                      {currentQuestion === questions.length - 1 ? "Finish Quiz" : "Next Question"}
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
          {flashcardsError && (
            <Alert className="mb-6">
              <AlertDescription>
                {flashcardsError}
              </AlertDescription>
            </Alert>
          )}
          {flashcardsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex justify-between mb-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !selectedFlashcardSet ? (
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
                        <span>{set.cards || (set.card_count || 0)} cards</span>
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
                <Progress value={((currentCard + 1) / flashcards.length) * 100} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center text-sm text-gray-500">
                    Card {currentCard + 1} of {flashcards.length}
                  </div>
                  <div
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 min-h-[200px] flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowAnswer(!showAnswer)}
                  >
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">
                        {flashcards.length > 0 ? (showAnswer ? flashcards[currentCard].back : flashcards[currentCard].front) : "No cards available"}
                      </p>
                      <p className="text-sm text-gray-500">{showAnswer ? <><span className="text-green-600 bg-green-100 px-2 py-1 rounded font-semibold">Definition</span></> : "Click to reveal answer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={prevCard} disabled={currentCard === 0}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button onClick={() => setShowAnswer(!showAnswer)}>
                      {showAnswer ? <><span className="text-blue-600 font-semibold">Show Question</span></> : <><span className="text-green-600 font-semibold">Show Answer</span></>}
                    </Button>
                    <Button variant="outline" onClick={nextCard} disabled={currentCard === flashcards.length - 1}>
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
function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  return `${baseUrl}${path}`
}

