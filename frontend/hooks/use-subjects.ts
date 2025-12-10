"use client"

import { useState, useEffect } from 'react'

export interface Subject {
  subject_id: number
  subject_name: string
  description: string
  subject_code: string
  program?: string | string[]
  year_level?: string
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(apiUrl('/api/subjects'))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSubjects(data.subjects)
      } else {
        throw new Error(data.error || 'Failed to fetch subjects')
      }
    } catch (err) {
      console.error('Error fetching subjects:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects
  }
}
