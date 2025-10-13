"use client"

import React from 'react'
import { usePreAssessmentGuard } from '@/hooks/use-pre-assessment-guard'
import { useUser } from '@/contexts/UserContext'
import PreAssessmentRequired from '@/components/pages/pre-assessment-required'

interface PreAssessmentGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function PreAssessmentGuard({ children, fallback }: PreAssessmentGuardProps) {
  const { currentUser, isLoading: userLoading } = useUser()
  const { 
    hasCompletedPreAssessment, 
    isLoading: guardLoading, 
    availablePreAssessments, 
    error,
    checkPreAssessmentStatus 
  } = usePreAssessmentGuard()

  // Show loading while checking user or pre-assessment status
  if (userLoading || guardLoading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Checking your assessment status...</p>
          </div>
        </div>
      )
    )
  }

  // If there's an error, show error state but allow access
  if (error) {
    console.error('Pre-assessment guard error:', error)
    return <>{children}</>
  }

  // If user is not a student, allow access
  if (!currentUser || currentUser.role !== 'Student') {
    return <>{children}</>
  }

  // If student hasn't completed pre-assessment and there are available assessments, show requirement page
  if (hasCompletedPreAssessment === false && availablePreAssessments.length > 0) {
    return (
      <PreAssessmentRequired 
        availablePreAssessments={availablePreAssessments}
        onPreAssessmentComplete={checkPreAssessmentStatus}
      />
    )
  }

  // If student has completed pre-assessment or no assessments are available, allow access
  return <>{children}</>
}