import { useState, useEffect } from 'react'
import { useToast } from './use-toast'

interface FlashcardProgress {
  progress_id: number
  flashcard_id: number
  user_id: number
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  created_at: string
  updated_at: string
  question?: string
  answer?: string
  subject_id?: number
  subject_name?: string
}

interface FlashcardStats {
  completed_count: number
  in_progress_count: number
  not_started_count: number
  total_flashcards: number
}

interface FlashcardStatsBySubject {
  subject_id: number
  subject_name: string
  total_flashcards: number
  completed_count: number
  in_progress_count: number
  not_started_count: number
  completion_percentage: number
}

interface StatsResponse {
  stats: FlashcardStats
  statsBySubject: FlashcardStatsBySubject[]
}

// Custom hook for flashcard progress
export function useFlashcardProgress(userId: number | null) {
  const [progress, setProgress] = useState<FlashcardProgress[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProgress = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/progress/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setProgress(data.progress)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch flashcard progress')
      console.error('Error fetching flashcard progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/progress/stats/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch flashcard stats')
      console.error('Error fetching flashcard stats:', err)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchProgress()
      fetchStats()
    }
  }, [userId])

  return {
    progress,
    stats,
    loading,
    error,
    refetch: () => {
      fetchProgress()
      fetchStats()
    }
  }
}

// Custom hook for updating flashcard progress
export function useUpdateFlashcardProgress() {
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const updateProgress = async (flashcardId: number, userId: number, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      setUpdating(true)
      
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/${flashcardId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          status: status
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update progress')
      }

      return data.progress
    } catch (error) {
      console.error('Error updating flashcard progress:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update flashcard progress"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const markCompleted = async (flashcardId: number, userId: number) => {
    try {
      setUpdating(true)
      
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/${flashcardId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to mark as completed')
      }

      toast({
        title: "Success",
        description: "Flashcard marked as completed!",
        duration: 3000,
      })

      return data.progress
    } catch (error) {
      console.error('Error marking flashcard as completed:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to mark flashcard as completed"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const resetProgress = async (flashcardId: number, userId: number) => {
    try {
      setUpdating(true)
      
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/${flashcardId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to reset progress')
      }

      toast({
        title: "Success",
        description: "Flashcard progress reset!",
        duration: 3000,
      })

      return data.progress
    } catch (error) {
      console.error('Error resetting flashcard progress:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to reset flashcard progress"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setUpdating(false)
    }
  }

  return {
    updateProgress,
    markCompleted,
    resetProgress,
    updating
  }
}

// Custom hook for getting flashcard progress status
export function useFlashcardProgressStatus(flashcardId: number | null, userId: number | null) {
  const [progressStatus, setProgressStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started')
  const [loading, setLoading] = useState(true)

  const fetchProgressStatus = async () => {
    if (!flashcardId || !userId) return
    
    try {
      setLoading(true)
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/${flashcardId}/progress/${userId}`)
      const data = await response.json()
      
      if (data.success && data.progress) {
        setProgressStatus(data.progress.status)
      } else {
        setProgressStatus('not_started')
      }
    } catch (err) {
      console.error('Error fetching flashcard progress status:', err)
      setProgressStatus('not_started')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgressStatus()
  }, [flashcardId, userId])

  return {
    progressStatus,
    loading,
    refetch: fetchProgressStatus
  }
}
