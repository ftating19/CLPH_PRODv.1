"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import SignupModal from "@/components/modals/signup_modal"
import ResetPasswordModal from "@/components/modals/resetpassword_modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Users, Brain, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/sonner"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  // Email validation helper
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Password validation helper
  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required";
    }
    return "";
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
    if (error) setError(""); // Clear general error when user starts typing
  };

  // Handle password input change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (error) setError(""); // Clear general error when user starts typing
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      // In a real implementation, this would integrate with Google OAuth 2.0
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // For now, simulate successful Google authentication
      // In production, this would handle the OAuth flow and verify with your backend
      toast({
        title: 'Info',
        description: 'Google login not yet implemented. Please use email login.',
        variant: 'default',
      });

    } catch (err) {
      setError("Failed to sign in with Google. Please try again.")
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setEmailError("")
    setPasswordError("")

    try {
      // Client-side validation
      const emailValidationError = validateEmail(email);
      const passwordValidationError = validatePassword(password);

      if (emailValidationError || passwordValidationError) {
        setEmailError(emailValidationError);
        setPasswordError(passwordValidationError);
        if (emailValidationError) {
          setError(emailValidationError);
        } else if (passwordValidationError) {
          setError(passwordValidationError);
        }
        return;
      }

      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error types with appropriate messages
        let errorMessage = data.error || 'Login failed';
        let toastTitle = 'Login Failed';
        
        switch (data.errorType) {
          case 'EMAIL_NOT_FOUND':
            toastTitle = 'Email Not Found';
            setEmailError('This email is not registered');
            break;
          case 'INVALID_PASSWORD':
            toastTitle = 'Incorrect Password';
            setPasswordError('Password is incorrect');
            break;
          case 'ACCOUNT_INACTIVE':
            toastTitle = 'Account Inactive';
            break;
          case 'INVALID_EMAIL_FORMAT':
            toastTitle = 'Invalid Email';
            setEmailError('Please enter a valid email address');
            break;
          case 'SERVER_ERROR':
            toastTitle = 'Server Error';
            break;
          default:
            toastTitle = 'Login Failed';
        }

        // Set error for display in the form
        setError(errorMessage);
        
        // Show toast notification
        toast({
          title: toastTitle,
          description: errorMessage,
          variant: 'destructive',
        });
        
        throw new Error(errorMessage);
      }

      // Debug: Log the received user data
      console.log('Login response data:', data);
      console.log('User first_login value:', data.user.first_login);
      console.log('Type of first_login:', typeof data.user.first_login);

      // Store user data in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user.user_id,
          name: `${data.user.first_name} ${data.user.last_name}`,
          email: data.user.email,
          description: data.user.description,
          program: data.user.program,
          role: data.user.role,
          avatar: "/diverse-user-avatars.png",
        })
      )

      // Also store in the currentUser format for UserContext
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          user_id: data.user.user_id,
          first_name: data.user.first_name,
          middle_name: data.user.middle_name,
          last_name: data.user.last_name,
          email: data.user.email,
          program: data.user.program,
          role: data.user.role,
          status: data.user.status,
          first_login: data.user.first_login,
          created_at: data.user.created_at,
          description: data.user.description
        })
      )

      // Check if user needs to reset password (first_login = 0)
      console.log('Checking first_login condition:', data.user.first_login === 0, data.user.first_login == 0, data.user.first_login === '0');
      
      if (data.user.first_login === 0 || data.user.first_login === '0' || data.user.first_login == 0) {
        console.log('User needs password reset - showing modal');
        setUserEmail(data.user.email);
        setShowResetPasswordModal(true);
        
        toast({
          title: 'Password Reset Required',
          description: 'Please set a new password to continue.',
          variant: 'default',
        });
        return; // Don't redirect yet
      }

      // Show success toast for regular login
      toast({
        title: 'Success',
        description: 'Login successful! Redirecting to dashboard...',
        variant: 'default',
      });

      // Set flag to indicate user is coming from login
      sessionStorage.setItem('fromLogin', 'true')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000);

    } catch (err) {
      // Only set error and show toast if not already handled above
      if (err instanceof Error && !err.message.includes('No account found') && !err.message.includes('Incorrect password')) {
        const errorMessage = err.message;
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password reset success
  const handlePasswordResetSuccess = () => {
    setShowResetPasswordModal(false);
    
    // Clear the form fields
    setEmail("");
    setPassword("");
    setError("");
    setEmailError("");
    setPasswordError("");
    
    toast({
      title: 'Password Updated Successfully!',
      description: 'Please log in again with your new password.',
      variant: 'default',
    });

    // No redirect needed - user stays on login page to log in with new password
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl h-[600px] bg-white rounded-xl shadow-xl overflow-hidden flex">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 flex-col justify-center items-center p-12 text-white">
            <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-6">CICT PEER LEARNING HUB</h1>
            <p className="text-xl text-blue-100 mb-8">
              Empowering students through collaborative learning and peer-to-peer knowledge sharing
            </p>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Interactive Learning</p>
              </div>
              <div>
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Peer Collaboration</p>
              </div>
              <div>
                <Brain className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Knowledge Sharing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
          <div className="w-full max-w-md">
            <Card className="shadow-lg border-0 bg-white h-full max-h-[550px] flex flex-col">
              <CardHeader className="text-center pb-4 flex-shrink-0">
                <div className="lg:hidden mb-4">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">CICT PEER LEARNING HUB</h1>
                  <p className="text-xs text-gray-600">A Collaborative Platform for Interactive Learning</p>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600 mt-1 text-sm">
                  Sign in to your account to continue your learning journey
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto">
              {error && (
                <Alert variant="destructive" className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleGoogleLogin} 
                disabled={isLoading} 
                className="w-full h-10 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                variant="outline"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                  </div>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-white px-4 text-gray-500 font-medium">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                  {emailError && (
                    <p className="text-xs text-red-600 mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handlePasswordChange}
                      className={`h-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-600 mt-1">{passwordError}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button"
                    variant="link" 
                    className="p-0 h-auto text-xs text-blue-600 hover:text-blue-700" 
                    onClick={() => {
                      toast({
                        title: 'Coming Soon',
                        description: 'Password reset functionality will be available soon.',
                        variant: 'default',
                      });
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200" 
                  disabled={isLoading || !!emailError || !!passwordError}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <span className="text-gray-600 text-sm">Don't have an account? </span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 text-sm" 
                  onClick={() => setShowSignupModal(true)}
                >
                  Create one here
                </Button>
              </div>
            </CardContent>
            </Card>

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
            </div>

            {/* Signup Modal */}
            <SignupModal
              open={showSignupModal}
              onClose={() => setShowSignupModal(false)}
              onSubmit={async (data) => {
                try {
                  const response = await fetch('http://localhost:4000/api/signup', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to create account');
                  }

                  const result = await response.json();
                  toast({
                    title: 'Success',
                    description: 'Account created successfully!',
                    variant: 'default',
                  });
                  setShowSignupModal(false);
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'An unknown error occurred',
                    variant: 'destructive',
                  });
                }
              }}
            />
            
            {/* Reset Password Modal */}
            <ResetPasswordModal
              open={showResetPasswordModal}
              userEmail={userEmail}
              onClose={() => setShowResetPasswordModal(false)}
              onSuccess={handlePasswordResetSuccess}
            />
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
