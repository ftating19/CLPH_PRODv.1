import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/UserContext";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (userData: any) => void;
}

interface UserData {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function EditProfileModal({ open, onClose, onUpdate }: EditProfileModalProps) {
  const { toast } = useToast();
  const { currentUser, updateCurrentUser } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [program, setProgram] = useState("");
  const [role, setRole] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (open) {
      // Get user data from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setFirstName(user.name?.split(' ')[0] || '');
          setMiddleName(user.name?.split(' ')[1] || '');
          setLastName(user.name?.split(' ').slice(-1)[0] || '');
          setDescription(user.description || '');
          setProgram(user.program || '');
          setRole(user.role || '');
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, [open]);

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setChangePassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError("");

    try {
      if (!userData) {
        throw new Error("User data not found");
      }

      // Validate password change if requested
      if (changePassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setPasswordError("All password fields are required when changing password");
          return;
        }

        if (!validatePassword(newPassword)) {
          setPasswordError("New password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.");
          return;
        }

        if (newPassword !== confirmPassword) {
          setPasswordError("New passwords do not match.");
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        description: description,
        program: program,
        role: role,
      };

      if (changePassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      // Update profile
      const response = await fetch(`http://localhost:4000/api/update-profile/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update localStorage with new data
      const updatedUser = {
        ...userData,
        name: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
        description: description,
        program: program,
        role: role,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update the user context
      if (currentUser && userData) {
        updateCurrentUser({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email: userData.email, // Use the email from userData since it's not editable
          program: program,
          role: role
        });
      }

      // Trigger custom event for immediate UI updates
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
        detail: updatedUser 
      }));

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
        variant: 'default',
      });

      onUpdate(updatedUser);
      resetForm();
      onClose();

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while updating profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!userData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information and optionally change your password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Personal Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first_name" className="text-sm">First Name</Label>
                    <Input 
                      id="first_name" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      required 
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middle_name" className="text-sm">Middle Name</Label>
                    <Input 
                      id="middle_name" 
                      value={middleName} 
                      onChange={(e) => setMiddleName(e.target.value)} 
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                  <Input 
                    id="last_name" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={userData.email} 
                    disabled 
                    className="h-9 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="program" className="text-sm">Program</Label>
                  <Select value={program} onValueChange={setProgram}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bachelor of Science in Information Systems">Bachelor of Science in Information Systems</SelectItem>
                      <SelectItem value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</SelectItem>
                      <SelectItem value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science</SelectItem>
                      <SelectItem value="Bachelor of Library and Information Science">Bachelor of Library and Information Science</SelectItem>
                      <SelectItem value="Bachelor of Science in Entertainment and Multimedia Computing">Bachelor of Science in Entertainment and Multimedia Computing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role" className="text-sm">Role</Label>
                  <Select value={role} onValueChange={setRole} disabled>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={role}>{role}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm">About Me</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Tell us about yourself..."
                    className="min-h-[80px] resize-vertical"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">Share something about yourself, your interests, or your learning goals</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Password Change Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Password</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setChangePassword(!changePassword)}
                  className="text-blue-600 hover:text-blue-700 h-auto p-0"
                >
                  {changePassword ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {changePassword && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="current_password" className="text-sm">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-9 pr-10"
                        required={changePassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new_password" className="text-sm">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-9 pr-10"
                        required={changePassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className={newPassword.length >= 8 ? "text-green-600" : "text-gray-400"}>
                        • At least 8 characters
                      </p>
                      <p className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                        • At least 1 uppercase letter
                      </p>
                      <p className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                        • At least 1 lowercase letter
                      </p>
                      <p className={/\d/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                        • At least 1 number
                      </p>
                      <p className={/[@$!%*?&]/.test(newPassword) ? "text-green-600" : "text-gray-400"}>
                        • At least 1 special character
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm_password" className="text-sm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-9 pr-10"
                        required={changePassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p className={newPassword === confirmPassword ? "text-green-600 text-xs mt-1" : "text-red-600 text-xs mt-1"}>
                        {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  {passwordError && (
                    <p className="text-red-600 text-xs">{passwordError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
