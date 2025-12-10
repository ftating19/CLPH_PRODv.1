import { useState, useEffect } from 'react'


interface Quiz {
  quizzes_id: number
  title: string
  subject_id: number
  subject_name: string
  created_by: number
  quiz_type: string
  duration: number
  difficulty: string
  item_counts: number
  created_at: string
  quiz_view?: 'Personal' | 'Public'
  program?: string
  duration_unit?: string
  status?: 'pending' | 'approved' | 'rejected'
  is_pending?: boolean
}

 // Hook to fetch quizzes including pending ones by user
export function useQuizzesWithPending(userId: number | null) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzesWithPending = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch approved quizzes
      const approvedResponse = await fetch('https://api.cictpeerlearninghub.com/api/quizzes')
      const approvedData = await approvedResponse.json()
      
      // Fetch pending quizzes by user
      const pendingResponse = await fetch(`https://api.cictpeerlearninghub.com/api/pending-quizzes/user/${userId}`)
      const pendingData = await pendingResponse.json()
      
      console.log('DEBUG - Approved quizzes:', approvedData)
      console.log('DEBUG - Pending quizzes:', pendingData)
      
      let allQuizzes: Quiz[] = []
      
      if (approvedData.success) {
        // Mark approved quizzes
        const approved = approvedData.quizzes.map((quiz: any) => ({
          ...quiz,
          status: 'approved' as const,
          is_pending: false
        }))
        allQuizzes = [...approved]
      }
      
      if (pendingData.success && pendingData.quizzes) {
        // Add pending quizzes with pending flag - ensure status is set
        const pending = pendingData.quizzes.map((quiz: any) => {
          console.log('DEBUG - Processing pending quiz:', quiz.title, 'Status:', quiz.status)
          return {
            ...quiz,
            status: quiz.status || 'pending', // Ensure status exists
            is_pending: true // Mark as pending
          }
        })
        allQuizzes = [...allQuizzes, ...pending]
      }
      
      console.log('DEBUG - All quizzes combined:', allQuizzes)
      
      setQuizzes(allQuizzes)
      setError(null)
    } catch (err) {
      setError('Error fetching quizzes')
      console.error('Error fetching quizzes with pending:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzesWithPending()
  }, [userId])

  return { quizzes, loading, error, refetch: fetchQuizzesWithPending }
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
      const response = await fetch('https://api.cictpeerlearninghub.com/api/quizzes')
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
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/questions/quiz/${id}`)
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
      const response = await fetch('https://api.cictpeerlearninghub.com/api/quiz-attempts', {
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
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/quiz-attempts/best-score/${quizId}/${userId}`)
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
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/quiz-attempts/user/${userId}`)
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
