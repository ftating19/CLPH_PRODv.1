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

  // If user is not a student, allow access
  const userRole = currentUser?.role?.toLowerCase()
  if (!currentUser || userRole !== 'student') {
    return <>{children}</>
  }

  // If there's an error for students, show error state with retry option
  if (error) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Connection Error</h2>
              </div>
              <p className="text-red-700 dark:text-red-300 mb-4">
                Unable to verify your pre-assessment status. Please check your internet connection and try again.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                Error: {error}
              </p>
              <button
                onClick={checkPreAssessmentStatus}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      )
    )
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