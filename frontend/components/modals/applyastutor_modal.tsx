import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ApplyAsTutorModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ApplyAsTutorModal({ open, onClose }: ApplyAsTutorModalProps) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Get user data from localStorage and auto-populate fields
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setFullName(user.name || '');
          setEmail(user.email || '');
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!fullName || !email || !subject || !specialties || !experience || !bio) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address.',
          variant: 'destructive',
        });
        return;
      }

      // Here you would typically send the application to your backend
      // For now, we'll just show a success message
      
      toast({
        title: 'Application Submitted',
        description: 'Your tutor application has been submitted successfully! We will review it and get back to you soon.',
        variant: 'default',
      });

      // Reset only the non-auto-populated fields
      setSubject("");
      setSpecialties("");
      setExperience("");
      setBio("");
      
      onClose();

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
    setSubject("");
    setSpecialties("");
    setExperience("");
    setBio("");
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
              <Label htmlFor="subject">Subject Expertise</Label>
              <Input 
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Computer Science, Mathematics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input 
                id="specialties"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="e.g., Data Structures, Algorithms, Java"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Teaching Experience</Label>
              <Textarea 
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Describe your teaching or tutoring experience..."
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about yourself and your teaching approach..."
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
