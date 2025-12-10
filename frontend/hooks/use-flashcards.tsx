import { useState, useEffect } from 'react'

interface Flashcard {
  flashcard_id: number
  question: string
  answer: string
  subject_id: number
  subject_name: string
  created_by: number
  creator_name: string
  program?: string
  flashcard_view?: 'Personal' | 'Public'
  progress_id?: number
  progress_status?: 'not_started' | 'in_progress' | 'completed'
  completed_at?: string | null
  status?: 'not_started' | 'in_progress' | 'completed' | 'pending' | 'approved' | 'rejected'
  is_pending?: boolean
}

export function useFlashcards(userId?: number | null) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFlashcards = async () => {
    try {
      setLoading(true)
      let url = 'https://api.cictpeerlearninghub.com/api/flashcards'
      if (userId) {
        url += `?user_id=${userId}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setFlashcards(data.flashcards)
        setError(null)
      } else {
        setError('Failed to fetch flashcards')
      }
    } catch (err) {
      setError('Error fetching flashcards')
      console.error('Error fetching flashcards:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlashcards()
  }, [userId])

  return { flashcards, loading, error, refetch: fetchFlashcards }
}

// Hook to fetch flashcards including pending ones by user
export function useFlashcardsWithPending(userId: number | null) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFlashcardsWithPending = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch approved flashcards
      const approvedResponse = await fetch('https://api.cictpeerlearninghub.com/api/flashcards')
      const approvedData = await approvedResponse.json()
      
      // Fetch pending flashcards by user
      const pendingResponse = await fetch(`https://api.cictpeerlearninghub.com/api/pending-flashcards/user/${userId}`)
      const pendingData = await pendingResponse.json()
      
      console.log('DEBUG - Approved flashcards:', approvedData)
      console.log('DEBUG - Pending flashcards:', pendingData)
      
      let allFlashcards: Flashcard[] = []
      
      if (approvedData.success) {
        // Mark approved flashcards
        const approved = approvedData.flashcards.map((flashcard: any) => ({
          ...flashcard,
          status: 'approved' as const,
          is_pending: false
        }))
        allFlashcards = [...approved]
      }
      
      if (pendingData.success && pendingData.flashcards) {
        // Add pending flashcards with pending flag - ensure status is set
        const pending = pendingData.flashcards.map((flashcard: any) => {
          console.log('DEBUG - Processing pending flashcard:', flashcard.question, 'Status:', flashcard.status)
          return {
            ...flashcard,
            status: flashcard.status || 'pending', // Ensure status exists
            is_pending: true // Mark as pending
          }
        })
        allFlashcards = [...allFlashcards, ...pending]
      }
      
      console.log('DEBUG - All flashcards combined:', allFlashcards)
      
      setFlashcards(allFlashcards)
      setError(null)
    } catch (err) {
      setError('Error fetching flashcards')
      console.error('Error fetching flashcards with pending:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlashcardsWithPending()
  }, [userId])

  return { flashcards, loading, error, refetch: fetchFlashcardsWithPending }
}

export function useFlashcardsBySubject(subjectId: number | null) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlashcards = async (id: number) => {
    try {
      setLoading(true)
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/subject/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setFlashcards(data.flashcards)
        setError(null)
      } else {
        setError('Failed to fetch flashcards')
      }
    } catch (err) {
      setError('Error fetching flashcards')
      console.error('Error fetching flashcards:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (subjectId) {
      fetchFlashcards(subjectId)
    } else {
      setFlashcards([])
    }
  }, [subjectId])

  return { flashcards, loading, error, refetch: subjectId ? () => fetchFlashcards(subjectId) : () => {} }
}

export function useFlashcardsByCreator(userId: number | null) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlashcards = async (id: number) => {
    try {
      setLoading(true)
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/creator/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setFlashcards(data.flashcards)
        setError(null)
      } else {
        setError('Failed to fetch flashcards')
      }
    } catch (err) {
      setError('Error fetching flashcards')
      console.error('Error fetching flashcards:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchFlashcards(userId)
    } else {
      setFlashcards([])
    }
  }, [userId])

  return { flashcards, loading, error, refetch: userId ? () => fetchFlashcards(userId) : () => {} }
}

export function useCreateFlashcard() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createFlashcard = async (flashcardData: {
    question: string
    answer: string
    subject_id: number
    created_by: number
    sub_id?: number
    program?: string
    flashcard_view?: 'Personal' | 'Public'
  }) => {
    try {
      setCreating(true)
      setError(null)

      console.log('=== HOOK: Sending flashcard data ===');
      console.log('Data received in hook:', JSON.stringify(flashcardData, null, 2));
      console.log('Program in hook:', flashcardData.program);
      console.log('===================================');

      const response = await fetch('https://api.cictpeerlearninghub.com/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flashcardData)
      })

      const data = await response.json()

      if (data.success) {
        return data.flashcard
      } else {
        throw new Error(data.error || 'Failed to create flashcard')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating flashcard'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  return { createFlashcard, creating, error }
}

export function useUpdateFlashcard() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFlashcard = async (flashcardId: number, flashcardData: {
    question: string
    answer: string
    subject_id: number
    program?: string
  }) => {
    try {
      setUpdating(true)
      setError(null)

      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/${flashcardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flashcardData)
      })

      const data = await response.json()

      if (data.success) {
        return true
      } else {
        throw new Error(data.error || 'Failed to update flashcard')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating flashcard'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  return { updateFlashcard, updating, error }
}

export function useDeleteFlashcard() {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteFlashcard = async (flashcardId: number) => {
    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`https://api.cictpeerlearninghub.com/api/flashcards/${flashcardId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        return true
      } else {
        throw new Error(data.error || 'Failed to delete flashcard')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting flashcard'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  return { deleteFlashcard, deleting, error }
}
