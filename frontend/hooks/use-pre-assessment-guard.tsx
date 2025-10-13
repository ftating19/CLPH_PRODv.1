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

    // Only check for students
    if (currentUser.role !== 'Student') {
      setHasCompleted(true)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if user has completed any pre-assessment
      const resultsResponse = await fetch(`http://localhost:4000/api/pre-assessment-results/user/${currentUser.user_id}`)
      
      if (!resultsResponse.ok) {
        throw new Error('Failed to fetch pre-assessment results')
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
          throw new Error('Failed to fetch available pre-assessments')
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
      console.error('Error checking pre-assessment status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check pre-assessment status')
      // On error, allow access to prevent blocking users
      setHasCompleted(true)
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