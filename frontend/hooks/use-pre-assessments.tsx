import { useState, useEffect } from 'react'

interface PreAssessment {
  id: number
  title: string
  subject_id: number
  subject_name?: string
  description: string
  created_by: number
  program: string
  year_level: string
  duration: number
  duration_unit: string
  difficulty: "Easy" | "Medium" | "Hard"
  status: "active" | "inactive"
  created_at?: string
  question_count?: number
}

// Hook to fetch all pre-assessments
export function usePreAssessments() {
  const [preAssessments, setPreAssessments] = useState<PreAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreAssessments = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:4000/api/pre-assessments')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPreAssessments(data.preAssessments || [])
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch pre-assessments')
      }
    } catch (err) {
      console.error('Error fetching pre-assessments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pre-assessments')
      setPreAssessments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreAssessments()
  }, [])

  const refetch = () => {
    fetchPreAssessments()
  }

  return {
    preAssessments,
    loading,
    error,
    refetch
  }
}

// Hook to fetch pre-assessments by program
export function usePreAssessmentsByProgram(program: string | null) {
  const [preAssessments, setPreAssessments] = useState<PreAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreAssessmentsByProgram = async () => {
    if (!program) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/api/pre-assessments/program/${encodeURIComponent(program)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPreAssessments(data.preAssessments || [])
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch pre-assessments')
      }
    } catch (err) {
      console.error('Error fetching pre-assessments by program:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pre-assessments')
      setPreAssessments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreAssessmentsByProgram()
  }, [program])

  const refetch = () => {
    fetchPreAssessmentsByProgram()
  }

  return {
    preAssessments,
    loading,
    error,
    refetch
  }
}

// Hook to fetch pre-assessments by year level
export function usePreAssessmentsByYearLevel(yearLevel: string | null) {
  const [preAssessments, setPreAssessments] = useState<PreAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreAssessmentsByYearLevel = async () => {
    if (!yearLevel) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/api/pre-assessments/year-level/${encodeURIComponent(yearLevel)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPreAssessments(data.preAssessments || [])
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch pre-assessments')
      }
    } catch (err) {
      console.error('Error fetching pre-assessments by year level:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pre-assessments')
      setPreAssessments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreAssessmentsByYearLevel()
  }, [yearLevel])

  const refetch = () => {
    fetchPreAssessmentsByYearLevel()
  }

  return {
    preAssessments,
    loading,
    error,
    refetch
  }
}