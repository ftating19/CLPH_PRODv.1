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
import { Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/use-subjects";
import { useUser } from "@/contexts/UserContext";
import { CICT_PROGRAMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ApplyAsTutorModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ApplyAsTutorModal({ open, onClose }: ApplyAsTutorModalProps) {
  const { toast } = useToast();
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { currentUser } = useUser();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [tutorInformation, setTutorInformation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Subject combobox state
  const [subjectComboboxOpen, setSubjectComboboxOpen] = useState(false);
  const [subjectSearchValue, setSubjectSearchValue] = useState("");

  // Available programs and year levels
  const programs = CICT_PROGRAMS;
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  // Filter subjects based on user's program and year level
  const filteredSubjects = subjects.filter(subject => {
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

    // Check if subject year level matches user's year level
    const yearLevelMatch = !subject.year_level || subject.year_level === yearLevel;

    return programMatch && yearLevelMatch;
  });

  useEffect(() => {
    if (open && currentUser) {
      // Auto-populate fields from current user
      setFullName(`${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`);
      setEmail(currentUser.email);
      setProgram(currentUser.program || '');
      setYearLevel(currentUser.year_level || '');
    }
  }, [open, currentUser]);

  // Clear subject selection when program or year level changes
  useEffect(() => {
    setSubjectId("");
  }, [program, yearLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!fullName || !email || !subjectId || !program || !yearLevel || !specialties || !tutorInformation) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'You must be logged in to apply as a tutor.',
          variant: 'destructive',
        });
        return;
      }

      // Find the selected subject
      const selectedSubject = subjects.find(s => s.subject_id.toString() === subjectId);
      
      // Prepare application data
      const applicationData = {
        user_id: currentUser.user_id,
        name: fullName,
        subject_id: parseInt(subjectId),
        subject_name: selectedSubject?.subject_name || "",
        tutor_information: tutorInformation,
        program: program,
        year_level: yearLevel,
        specialties: specialties
      };

      console.log('Submitting tutor application:', applicationData);

      // Submit to backend API
      const response = await fetch('http://localhost:4000/api/tutor-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Application Submitted',
          description: 'Your tutor application has been submitted successfully! We will review it and get back to you soon.',
          variant: 'default',
        });

        // Reset form fields
        setSubjectId("");
        setProgram("");
        setSpecialties("");
        setTutorInformation("");
        
        onClose();
      } else {
        throw new Error(result.error || 'Application submission failed');
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while submitting your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset only the form fields, not the auto-populated ones
    setSubjectId("");
    setSpecialties("");
    setTutorInformation("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Become a Tutor</DialogTitle>
          <DialogDescription>
            Share your expertise and help fellow students succeed in their academic journey.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  required
                />
                <p className="text-xs text-gray-500">Auto-populated from your profile</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@cict.edu"
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  required
                />
                <p className="text-xs text-gray-500">Auto-populated from your profile</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Expertise *</Label>
              <Popover open={subjectComboboxOpen} onOpenChange={setSubjectComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={subjectComboboxOpen}
                    className="w-full justify-between"
                    disabled={subjectsLoading || !!subjectsError || !program || !yearLevel}
                  >
                    {subjectId ? (
                      (() => {
                        const subject = filteredSubjects.find(s => s.subject_id.toString() === subjectId);
                        return subject ? `${subject.subject_code} - ${subject.subject_name}` : subjectId;
                      })()
                    ) : (
                      subjectsLoading 
                        ? "Loading subjects..." 
                        : subjectsError 
                          ? "Error loading subjects" 
                          : !program || !yearLevel
                            ? "Please select program and year level first"
                            : filteredSubjects.length === 0
                              ? "No subjects available for your program and year level"
                              : "Select the subject you want to tutor"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search subjects..." 
                      value={subjectSearchValue}
                      onValueChange={setSubjectSearchValue}
                      disabled={subjectsLoading || !!subjectsError || !program || !yearLevel}
                    />
                    <CommandList>
                      {!subjectsLoading && !subjectsError && filteredSubjects
                        .filter((subject) => {
                          const searchTerm = subjectSearchValue.toLowerCase();
                          return (
                            subject.subject_name.toLowerCase().includes(searchTerm) ||
                            (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm))
                          );
                        })
                        .sort((a, b) => (a.subject_code || '').localeCompare(b.subject_code || ''))
                        .map((subject) => (
                          <CommandItem
                            key={subject.subject_id}
                            value={`${subject.subject_code || ''} ${subject.subject_name}`.trim()}
                            onSelect={() => {
                              setSubjectId(subject.subject_id.toString())
                              setSubjectComboboxOpen(false)
                              setSubjectSearchValue("")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                subjectId === subject.subject_id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {subject.subject_code} - {subject.subject_name}
                          </CommandItem>
                        ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {program && yearLevel && filteredSubjects.length === 0 && (
                <p className="text-xs text-amber-600">No subjects found for {program} - {yearLevel}. Please contact admin if this seems incorrect.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <Select 
                  value={program} 
                  onValueChange={setProgram}
                  disabled
                >
                  <SelectTrigger className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed">
                    <SelectValue placeholder="Select your program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((prog) => (
                      <SelectItem key={prog} value={prog}>
                        {prog}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Auto-populated from your profile</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearLevel">Year Level *</Label>
                <Select 
                  value={yearLevel} 
                  onValueChange={setYearLevel}
                  disabled
                >
                  <SelectTrigger className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed">
                    <SelectValue placeholder="Select your year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Auto-populated from your profile</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties *</Label>
              <Textarea 
                id="specialties"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="List your specific skills and areas of expertise (e.g., Java Programming, Algorithm Design, Data Analysis, etc.)"
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
                placeholder="Describe your teaching experience, qualifications, and why you'd be a great tutor..."
                rows={4}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
