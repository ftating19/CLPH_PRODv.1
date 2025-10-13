import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'

interface PreAssessmentGuardResult {
  hasCompletedPreAssessment: boolean | null
  isLoading: boolean
  availablePreAssessments: any[]
  error: string | null
  checkPreAssessmentStatus: () => Promise<void>
}

export const usePreAssessmentGuard = (): PreAssessmentGuardResult => {
  const { currentUser } = useUser()
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [availablePreAssessments, setAvailablePreAssessments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const checkPreAssessmentStatus = async () => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    // Only check for students - allow all other roles immediate access
    const userRole = currentUser.role?.toLowerCase()
    if (userRole !== 'student') {
      setHasCompleted(true)
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if user has completed any pre-assessment
      const resultsResponse = await fetch(`http://localhost:4000/api/pre-assessment-results/user/${currentUser.user_id}`)
      
      if (!resultsResponse.ok) {
        // If the API endpoint doesn't exist (404), bypass the requirement
        if (resultsResponse.status === 404) {
          console.warn('Pre-assessment API not implemented, allowing access')
          setHasCompleted(true)
          setAvailablePreAssessments([])
          setIsLoading(false)
          return
        }
        throw new Error(`Failed to fetch pre-assessment results (${resultsResponse.status})`)
      }

      const resultsData = await resultsResponse.json()
      const results = resultsData.results || []
      
      // If user has completed at least one pre-assessment, they can access dashboard
      if (results.length > 0) {
        setHasCompleted(true)
        setAvailablePreAssessments([])
      } else {
        // Check for available pre-assessments for their program and year level
        const assessmentsResponse = await fetch(
          `http://localhost:4000/api/pre-assessments/program/${encodeURIComponent(currentUser.program)}/year/${encodeURIComponent(currentUser.year_level || '')}`
        )
        
        if (!assessmentsResponse.ok) {
          // If the API endpoint doesn't exist (404), bypass the requirement
          if (assessmentsResponse.status === 404) {
            console.warn('Pre-assessment configuration API not implemented, allowing access')
            setHasCompleted(true)
            setAvailablePreAssessments([])
            setIsLoading(false)
            return
          }
          throw new Error(`Failed to fetch available pre-assessments (${assessmentsResponse.status})`)
        }

        const assessmentsData = await assessmentsResponse.json()
        const assessments = assessmentsData.preAssessments || []
        
        if (assessments.length > 0) {
          setHasCompleted(false)
          setAvailablePreAssessments(assessments.filter((assessment: any) => assessment.status === 'active'))
        } else {
          // No pre-assessments available for their program/year, allow access
          setHasCompleted(true)
          setAvailablePreAssessments([])
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check pre-assessment status'
      console.warn('Pre-assessment check failed:', errorMessage)
      
      // Check if this is a network error (backend not running) vs a server error
      if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection or try again later.')
      } else if (errorMessage.includes('(500)')) {
        setError('Server error occurred. Please try again or contact support if the issue persists.')
      } else {
        setError(errorMessage)
      }
      
      // Don't set hasCompleted to true on error for students - let the guard handle the error state
      setHasCompleted(null)
      setAvailablePreAssessments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkPreAssessmentStatus()
  }, [currentUser])

  return {
    hasCompletedPreAssessment: hasCompleted,
    isLoading,
    availablePreAssessments,
    error,
    checkPreAssessmentStatus
  }
}