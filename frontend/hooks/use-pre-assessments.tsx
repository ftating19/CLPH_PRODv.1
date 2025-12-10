import { useState, useEffect } from 'react'
import { apiUrl } from '@/lib/api-config'

interface PreAssessment {
  id: number
  title: string
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
      const response = await fetch(apiUrl('/api/pre-assessments'))
      
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
      const response = await fetch(apiUrl(`/api/pre-assessments/program/${encodeURIComponent(program)}`))
      
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
      const response = await fetch(apiUrl(`/api/pre-assessments/year-level/${encodeURIComponent(yearLevel)}`))
      
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

// Hook to fetch pre-assessments by program and year level
export function usePreAssessmentsByProgramAndYear(program: string | null, yearLevel: string | null) {
  const [preAssessments, setPreAssessments] = useState<PreAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreAssessmentsByProgramAndYear = async () => {
    if (!program || !yearLevel) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(apiUrl(`/api/pre-assessments/program/${encodeURIComponent(program)}/year/${encodeURIComponent(yearLevel)}`))
      
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
      console.error('Error fetching pre-assessments by program and year level:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pre-assessments')
      setPreAssessments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreAssessmentsByProgramAndYear()
  }, [program, yearLevel])

  const refetch = () => {
    fetchPreAssessmentsByProgramAndYear()
  }

  return {
    preAssessments,
    loading,
    error,
    refetch
  }
}