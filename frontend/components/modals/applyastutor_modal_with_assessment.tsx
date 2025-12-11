"use client"

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Upload, X, Clock, Target, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/use-subjects";
import { useUser } from "@/contexts/UserContext";
import { CICT_PROGRAMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ApplyAsTutorModalProps {
  open: boolean;
  onClose: () => void;
}

interface TutorPreAssessment {
  id: number;
  title: string;
  description: string;
  program: string;
  year_level: string;
  duration: number;
  duration_unit: string;
  difficulty: string;
  subject_id?: number;
  question_count?: number;
}

interface Question {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

interface AssessmentResult {
  score: number;
  totalPoints: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  answers: any[];
}

type Step = 'subject-selection' | 'assessment' | 'application-form';

export default function ApplyAsTutorModalWithAssessment({ open, onClose }: ApplyAsTutorModalProps) {
  const { toast } = useToast();
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { currentUser } = useUser();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('subject-selection');
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  
  // Assessment state
  const [availableAssessments, setAvailableAssessments] = useState<TutorPreAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<TutorPreAssessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Application form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [tutorInformation, setTutorInformation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [classCardImage, setClassCardImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Subject combobox state
  const [subjectComboboxOpen, setSubjectComboboxOpen] = useState(false);
  const [subjectSearchValue, setSubjectSearchValue] = useState("");

  // Available programs and year levels
  const programs = CICT_PROGRAMS;
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  // Filter subjects based on user's program and year level
  const filteredSubjects = subjects.filter(subject => {
    if (!program || !yearLevel) return true;

    // Check if subject program matches user's program
    let programMatch = false;
    if (Array.isArray(subject.program)) {
      programMatch = subject.program.includes(program);
    } else if (typeof subject.program === 'string') {
      try {
        const programArray = JSON.parse(subject.program);
        programMatch = Array.isArray(programArray) && programArray.includes(program);
      } catch {
        programMatch = subject.program === program;
      }
    }

    // Check if subject year level is less than or equal to user's year level
    // Convert year levels to numbers for comparison
    const yearOrder = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const applicantYearIndex = yearOrder.indexOf(yearLevel);
    const subjectYearIndex = yearOrder.indexOf(subject.year_level || "1st Year");
    const yearLevelMatch = subjectYearIndex !== -1 && applicantYearIndex !== -1 && subjectYearIndex <= applicantYearIndex;

    return programMatch && yearLevelMatch;
  });

  // Timer effect for assessment
  useEffect(() => {
    if (assessmentStarted && !assessmentCompleted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [assessmentStarted, assessmentCompleted, timeLeft]);

  useEffect(() => {
    if (open && currentUser) {
      // Auto-populate fields from current user
      setFullName(`${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`);
      setEmail(currentUser.email);
      setProgram(currentUser.program || '');
      setYearLevel(currentUser.year_level || '');
    }
  }, [open, currentUser]);

  // Fetch assessments for selected subject
  const fetchAssessments = async (subjectId: string) => {
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/tutor-pre-assessments/subject/${subjectId}`);
      if (!response.ok) throw new Error('Failed to fetch assessments');
      
      const data = await response.json();
      setAvailableAssessments(data.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load assessments for this subject",
        variant: "destructive"
      });
    }
  };

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch questions for assessment
  const fetchQuestions = async (assessmentId: number) => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/tutor-pre-assessment-questions/pre-assessment/${assessmentId}?t=${timestamp}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      
      const data = await response.json();
      const mappedQuestions = (data.questions || []).map((q: any) => {
        let processedOptions = q.options && typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        
        // Shuffle multiple choice options as well
        if (q.question_type === 'multiple-choice' && processedOptions && Array.isArray(processedOptions)) {
          processedOptions = shuffleArray(processedOptions);
        }
        
        return {
          id: q.id,
          type: q.question_type,
          question: q.question,
          options: processedOptions,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          points: q.points,
        };
      });
      
      // Additional frontend shuffling to ensure randomization
      const shuffledQuestions = shuffleArray(mappedQuestions);
      
      setQuestions(shuffledQuestions as Question[]);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment questions",
        variant: "destructive"
      });
    }
  };

  const handleSubjectSelection = async () => {
    if (!selectedSubjectId) return;
    
    await fetchAssessments(selectedSubjectId);
    setCurrentStep('assessment');
  };

  const handleStartAssessment = async (assessment: TutorPreAssessment) => {
    setSelectedAssessment(assessment);
    await fetchQuestions(assessment.id);
    
    // Set timer based on assessment duration
    const durationInSeconds = assessment.duration_unit === 'hours' 
      ? assessment.duration * 3600 
      : assessment.duration * 60;
    setTimeLeft(durationInSeconds);
    
    setAssessmentStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!selectedAssessment || !currentUser) return;

    try {
      // Calculate results
      let correctAnswers = 0;
      let totalPoints = 0;
      const detailedAnswers = questions.map(question => {
        const userAnswer = answers[question.id] || '';
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) {
          correctAnswers++;
          totalPoints += question.points;
        }
        return {
          question_id: question.id,
          question: question.question,
          user_answer: userAnswer,
          correct_answer: question.correctAnswer,
          is_correct: isCorrect,
          points: isCorrect ? question.points : 0
        };
      });

      const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
      const passed = percentage >= 70; // 70% passing grade

      const result: AssessmentResult = {
        score: totalPoints,
        totalPoints: maxPoints,
        percentage,
        correctAnswers,
        totalQuestions: questions.length,
        passed,
        answers: detailedAnswers
      };

      // Submit result to backend
      const response = await fetch('https://api.cictpeerlearninghub.com/api/tutor-pre-assessment-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          pre_assessment_id: selectedAssessment.id,
          score: totalPoints,
          total_points: maxPoints,
          percentage,
          correct_answers: correctAnswers,
          total_questions: questions.length,
          answers: JSON.stringify(detailedAnswers),
          passed
        })
      });

      if (!response.ok) throw new Error('Failed to save assessment result');

      setAssessmentResult(result);
      setAssessmentCompleted(true);
      setAssessmentStarted(false);

      if (passed) {
        toast({
          title: "Assessment Completed!",
          description: `You scored ${percentage.toFixed(1)}% - You can now proceed with your application.`,
          variant: "default"
        });
        setTimeout(() => setCurrentStep('application-form'), 2000);
      } else {
        toast({
          title: "Assessment Not Passed",
          description: `You scored ${percentage.toFixed(1)}%. You need at least 70% to apply as a tutor.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save assessment result",
        variant: "destructive"
      });
    }
  };

  // Handle image change (same as original)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file (JPG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive"
      })
      return
    }

    setClassCardImage(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload image (same as original)
  const uploadClassCardImage = async (): Promise<string | null> => {
    if (!classCardImage) return null

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', classCardImage)
      formData.append('type', 'class_card')
      formData.append('user_id', currentUser?.user_id.toString() || '')

      const response = await fetch('https://api.cictpeerlearninghub.com/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error(`Upload failed with status ${response.status}`)

      const result = await response.json()
      if (result.success && result.file_url) {
        return result.file_url
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload class card image",
        variant: "destructive"
      })
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!fullName || !email || !selectedSubjectId || !program || !yearLevel || !specialties || !tutorInformation) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      if (!classCardImage) {
        toast({
          title: "Error",
          description: "Please upload your class card image",
          variant: "destructive"
        })
        return
      }

      if (!assessmentResult || !assessmentResult.passed) {
        toast({
          title: "Error",
          description: "You must pass the assessment before submitting your application",
          variant: "destructive"
        })
        return
      }

      // Upload image first
      const imageUrl = await uploadClassCardImage()
      if (!imageUrl) return

      // Find the selected subject
      const selectedSubject = subjects.find(s => s.subject_id.toString() === selectedSubjectId);
      
      // Prepare application data with assessment result
      const applicationData = {
        user_id: currentUser?.user_id,
        name: fullName,
        subject_id: parseInt(selectedSubjectId),
        subject_name: selectedSubject?.subject_name || "",
        tutor_information: tutorInformation,
        program: program,
        year_level: yearLevel,
        specialties: specialties,
        class_card_image_url: imageUrl,
        assessment_result_id: assessmentResult?.score, // We'll need to get the actual result ID
        assessment_score: assessmentResult.percentage
      };

      const response = await fetch('https://api.cictpeerlearninghub.com/api/tutor-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: 'Application Submitted',
          description: 'Your tutor application with assessment results has been submitted successfully!',
          variant: 'default',
        });

        handleClose();
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          // User has pending application
          const existingApp = result.existingApplication;
          toast({
            title: 'Application Already Pending',
            description: `You already have a pending application for ${existingApp?.subject_name || 'a subject'} submitted on ${existingApp?.application_date ? new Date(existingApp.application_date).toLocaleDateString() : 'a previous date'}. Please wait for it to be reviewed.`,
            variant: 'destructive',
            duration: 6000,
          });
        } else {
          throw new Error(result.error || 'Application submission failed');
        }
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      
      // Don't show generic error if we already handled specific cases above
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string" &&
        !(error as { message: string }).message.includes('Application Already Pending')
      ) {
        toast({
          title: 'Error',
          description: (error as { message: string }).message || 'An error occurred while submitting your application. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all states
    setCurrentStep('subject-selection');
    setSelectedSubjectId("");
    setAvailableAssessments([]);
    setSelectedAssessment(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAssessmentStarted(false);
    setAssessmentCompleted(false);
    setAssessmentResult(null);
    setTimeLeft(0);
    setSpecialties("");
    setTutorInformation("");
    setClassCardImage(null);
    setImagePreview(null);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'subject-selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select Your Subject Expertise</h3>
              <p className="text-gray-600">Choose the subject you want to tutor to see available assessments.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Popover open={subjectComboboxOpen} onOpenChange={setSubjectComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectComboboxOpen}
                      className="w-full justify-between"
                      disabled={subjectsLoading || !!subjectsError}
                    >
                      {selectedSubjectId ? (
                        (() => {
                          const subject = filteredSubjects.find(s => s.subject_id.toString() === selectedSubjectId);
                          return subject ? `${subject.subject_code} - ${subject.subject_name}` : selectedSubjectId;
                        })()
                      ) : (
                        "Select the subject you want to tutor"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="max-h-[50vh] sm:max-h-[40vh] overflow-auto">
                      <Command>
                        <CommandInput 
                          placeholder="Search subjects..." 
                          value={subjectSearchValue}
                          onValueChange={setSubjectSearchValue}
                        />
                        <CommandList className="max-h-[46vh] overflow-auto">
                        {filteredSubjects
                          .filter((subject) => {
                            const searchTerm = subjectSearchValue.toLowerCase();
                            return (
                              subject.subject_name.toLowerCase().includes(searchTerm) ||
                              (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm))
                            );
                          })
                          .map((subject) => (
                            <CommandItem
                              key={subject.subject_id}
                              value={`${subject.subject_code || ''} ${subject.subject_name}`.trim()}
                              onSelect={() => {
                                setSelectedSubjectId(subject.subject_id.toString())
                                setSubjectComboboxOpen(false)
                                setSubjectSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSubjectId === subject.subject_id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {subject.subject_code} - {subject.subject_name}
                            </CommandItem>
                          ))}
                      </CommandList>
                    </Command>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleSubjectSelection}
                  disabled={!selectedSubjectId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'assessment':
        if (assessmentStarted && questions.length > 0) {
          const currentQuestion = questions[currentQuestionIndex];
          const userAnswer = answers[currentQuestion.id] || '';

          return (
            <div className="space-y-6">
              {/* Timer */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Time Remaining: {formatTime(timeLeft)}</span>
                </div>
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
              </div>

              {/* Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                    <RadioGroup value={userAnswer} onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}>
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {currentQuestion.type === 'true-false' && (
                    <RadioGroup value={userAnswer} onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="True" id="true" />
                        <Label htmlFor="true" className="cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="False" id="false" />
                        <Label htmlFor="false" className="cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'essay') && (
                    <Textarea
                      value={userAnswer}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Enter your answer..."
                      rows={currentQuestion.type === 'essay' ? 4 : 2}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={handleSubmitAssessment} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Assessment
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        }

        if (assessmentCompleted && assessmentResult) {
          return (
            <div className="space-y-6 text-center">
              <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                assessmentResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {assessmentResult.passed ? 
                  <CheckCircle className="h-8 w-8" /> : 
                  <X className="h-8 w-8" />
                }
              </div>
              
              <div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  assessmentResult.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {assessmentResult.passed ? 'Congratulations!' : 'Assessment Not Passed'}
                </h3>
                <p className="text-gray-600 mb-4">
                  You scored {assessmentResult.percentage.toFixed(1)}% ({assessmentResult.correctAnswers}/{assessmentResult.totalQuestions} correct)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{assessmentResult.score}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{assessmentResult.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
              </div>

              {assessmentResult.passed ? (
                <p className="text-green-600 font-medium">
                  You can now proceed with your tutor application!
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-red-600">
                    You need at least 70% to proceed. Please study more and try again later.
                  </p>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pre-Assessment Required</h3>
              <p className="text-gray-600 mb-6">Complete the assessment to demonstrate your expertise in the selected subject.</p>
            </div>

            {availableAssessments.length > 0 ? (
              <div className="space-y-4">
                {availableAssessments.map((assessment) => (
                  <Card key={assessment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{assessment.title}</CardTitle>
                          <CardDescription className="mt-1">{assessment.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{assessment.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {assessment.duration} {assessment.duration_unit}
                          </span>
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {assessment.question_count || 0} questions
                          </span>
                        </div>
                        <Button 
                          onClick={() => handleStartAssessment(assessment)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Start Assessment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No assessments available for this subject.</p>
                <Button variant="outline" onClick={() => setCurrentStep('subject-selection')} className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Choose Different Subject
                </Button>
              </div>
            )}
          </div>
        );

      case 'application-form':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Complete Your Application</h3>
              <p className="text-gray-600">You've passed the assessment! Now complete your tutor application.</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties *</Label>
                <Textarea 
                  id="specialties"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="List your specific skills and areas of expertise..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutorInformation">Teaching Experience & Additional Information *</Label>
                <Textarea 
                  id="tutorInformation"
                  value={tutorInformation}
                  onChange={(e) => setTutorInformation(e.target.value)}
                  placeholder="Describe your teaching experience and qualifications..."
                  rows={4}
                  required
                />
              </div>

              {/* Class Card Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="classCard">Class Card Image *</Label>
                {imagePreview ? (
                  <div className="flex flex-col items-center space-y-3 p-4 border-2 border-green-300 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <img 
                      src={imagePreview} 
                      alt="Class card preview" 
                      className="max-h-40 rounded"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setImagePreview(null)
                        setClassCardImage(null)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload class card image</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading || uploadingImage}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading || uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : isLoading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Apply to Become a Tutor</DialogTitle>
          <DialogDescription>
            Complete the assessment and application to join our tutoring program.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}