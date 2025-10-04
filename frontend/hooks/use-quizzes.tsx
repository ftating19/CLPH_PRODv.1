import { useState, useEffect } from 'react'

interface Quiz {
  quizzes_id: number
  title: string
  subject_id: number
  subject_name: string
  description: string
  created_by: number
  quiz_type: string
  duration: number
  difficulty: string
  item_counts: number
  created_at: string
  quiz_view?: 'Personal' | 'Public'
  program?: string
  duration_unit?: string
}

interface Question {
  question_id: number
  quizzes_id: number
  choices: string[]
  answer: string
}

interface QuizAttempt {
  attempt_id: number
  quizzes_id: number
  user_id: number
  name: string
  score: number
  timestamp: string
}

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:4000/api/quizzes')
      const data = await response.json()
      
      if (data.success) {
        setQuizzes(data.quizzes)
        setError(null)
      } else {
        setError('Failed to fetch quizzes')
      }
    } catch (err) {
      setError('Error fetching quizzes')
      console.error('Error fetching quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  return { quizzes, loading, error, refetch: fetchQuizzes }
}

export function useQuizQuestions(quizId: number | null) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = async (id: number) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/api/questions/quiz/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.questions)
        setError(null)
      } else {
        setError('Failed to fetch questions')
      }
    } catch (err) {
      setError('Error fetching questions')
      console.error('Error fetching questions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (quizId) {
      fetchQuestions(quizId)
    } else {
      setQuestions([])
    }
  }, [quizId])

  return { questions, loading, error, refetch: quizId ? () => fetchQuestions(quizId) : () => {} }
}

export function useQuizAttempts() {
  const createAttempt = async (attempt: Omit<QuizAttempt, 'attempt_id' | 'timestamp'>) => {
    try {
      const response = await fetch('http://localhost:4000/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attempt),
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.attempt
      } else {
        throw new Error('Failed to create quiz attempt')
      }
    } catch (err) {
      console.error('Error creating quiz attempt:', err)
      throw err
    }
  }

  const getUserBestScore = async (quizId: number, userId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/quiz-attempts/best-score/${quizId}/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.bestScore
      } else {
        throw new Error('Failed to fetch best score')
      }
    } catch (err) {
      console.error('Error fetching best score:', err)
      throw err
    }
  }

  const getUserAttempts = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/quiz-attempts/user/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.attempts
      } else {
        throw new Error('Failed to fetch user attempts')
      }
    } catch (err) {
      console.error('Error fetching user attempts:', err)
      throw err
    }
  }

  return { createAttempt, getUserBestScore, getUserAttempts }
}
