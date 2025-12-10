"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertCircle } from "lucide-react"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email.trim()) {
      setError("Email address is required")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('https://api.cictpeerlearninghub.com/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setIsSuccess(true)
    } catch (error) {
      console.error('Forgot password error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setError("")
    setIsSuccess(false)
    setIsLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Reset Your Password
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? "Check your email for reset instructions"
              : "Enter your email address and we'll send you a link to reset your password"
            }
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                If an account exists with this email address, you will receive a password reset link shortly. 
                Please check your inbox and follow the instructions in the email.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Next steps:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>Create a new password</li>
                <li>Sign in with your new password</li>
              </ul>
            </div>

            <Button 
              onClick={handleClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}