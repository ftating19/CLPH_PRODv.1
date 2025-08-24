import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordModalProps {
	open: boolean;
	userEmail: string;
	onClose: () => void;
	onSuccess: () => void;
}

export default function ResetPasswordModal({ open, userEmail, onClose, onSuccess }: ResetPasswordModalProps) {
	const { toast } = useToast();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [passwordValidation, setPasswordValidation] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		number: false,
		specialChar: false,
	});
	const [confirmPasswordValidation, setConfirmPasswordValidation] = useState(false);

	function validatePassword(password: string) {
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
		return passwordRegex.test(password);
	}

	function handleNewPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setNewPassword(value);
		setPasswordValidation({
			length: value.length >= 8,
			uppercase: /[A-Z]/.test(value),
			lowercase: /[a-z]/.test(value),
			number: /\d/.test(value),
			specialChar: /[@$!%*?&]/.test(value),
		});
		setConfirmPasswordValidation(value === confirmPassword && value.length > 0);
	}

	function handleConfirmPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setConfirmPassword(value);
		setConfirmPasswordValidation(value === newPassword && value.length > 0);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);

		// Validate current password
		if (!currentPassword) {
			toast({
				variant: "destructive",
				title: "Current Password Required",
				description: "Please enter your current password.",
			});
			setIsSubmitting(false);
			return;
		}

		// Validate new password
		if (!validatePassword(newPassword)) {
			toast({
				variant: "destructive",
				title: "Invalid Password",
				description: "Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
			});
			setIsSubmitting(false);
			return;
		}

		// Validate password confirmation
		if (newPassword !== confirmPassword) {
			toast({
				variant: "destructive",
				title: "Passwords Don't Match",
				description: "Please ensure both password fields match.",
			});
			setIsSubmitting(false);
			return;
		}

		try {
			// Call API to reset password
			const response = await fetch('http://localhost:4000/api/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: userEmail,
					currentPassword: currentPassword,
					newPassword: newPassword,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to reset password');
			}

			toast({
				title: "Password Updated Successfully!",
				description: "Your password has been changed. You can now continue using the platform.",
			});

			// Clear form
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setPasswordValidation({
				length: false,
				uppercase: false,
				lowercase: false,
				number: false,
				specialChar: false,
			});
			setConfirmPasswordValidation(false);
			
			onSuccess();
		} catch (error: any) {
			console.error("Error resetting password:", error);
			toast({
				variant: "destructive",
				title: "Password Reset Failed",
				description: error.message || "An error occurred while resetting your password.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	const handleClose = () => {
		if (!isSubmitting) {
			// Reset form when closing
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setPasswordValidation({
				length: false,
				uppercase: false,
				lowercase: false,
				number: false,
				specialChar: false,
			});
			setConfirmPasswordValidation(false);
			onClose();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
								<Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<DialogTitle>Reset Your Password</DialogTitle>
								<DialogDescription>
									Please set a new password for your account to continue.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
					
					<div className="space-y-4 mt-6">
						{/* Info Banner */}
						<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
							<div className="flex items-start space-x-3">
								<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">First Time Login</h3>
									<p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
										Since this is your first login with a temporary password, you need to set a new secure password.
									</p>
								</div>
							</div>
						</div>

						{/* Current Password */}
						<div>
							<Label htmlFor="current_password">Current Password (Temporary)</Label>
							<div className="relative">
								<Input
									id="current_password"
									type={showCurrentPassword ? "text" : "password"}
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									placeholder="Enter your temporary password"
									required
									disabled={isSubmitting}
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 flex items-center pr-3"
									onClick={() => setShowCurrentPassword(!showCurrentPassword)}
									disabled={isSubmitting}
								>
									{showCurrentPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
								</button>
							</div>
						</div>

						{/* New Password */}
						<div>
							<Label htmlFor="new_password">New Password</Label>
							<div className="relative">
								<Input
									id="new_password"
									type={showNewPassword ? "text" : "password"}
									value={newPassword}
									onChange={handleNewPasswordChange}
									placeholder="Enter your new password"
									required
									disabled={isSubmitting}
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 flex items-center pr-3"
									onClick={() => setShowNewPassword(!showNewPassword)}
									disabled={isSubmitting}
								>
									{showNewPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
								</button>
							</div>
							<ul className="mt-2 text-sm space-y-1">
								<li className={passwordValidation.length ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
									✓ At least 8 characters
								</li>
								<li className={passwordValidation.uppercase ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
									✓ At least 1 uppercase letter
								</li>
								<li className={passwordValidation.lowercase ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
									✓ At least 1 lowercase letter
								</li>
								<li className={passwordValidation.number ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
									✓ At least 1 number
								</li>
								<li className={passwordValidation.specialChar ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
									✓ At least 1 special character (@$!%*?&)
								</li>
							</ul>
						</div>

						{/* Confirm Password */}
						<div>
							<Label htmlFor="confirm_password">Confirm New Password</Label>
							<div className="relative">
								<Input
									id="confirm_password"
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={handleConfirmPasswordChange}
									placeholder="Confirm your new password"
									required
									disabled={isSubmitting}
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 flex items-center pr-3"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									disabled={isSubmitting}
								>
									{showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
								</button>
							</div>
							<p className={`text-sm mt-1 ${confirmPasswordValidation ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
								{confirmPassword.length > 0 ? (confirmPasswordValidation ? "✓ Passwords match" : "✗ Passwords do not match") : ""}
							</p>
						</div>
					</div>

					<DialogFooter className="mt-6">
						<Button 
							type="submit" 
							disabled={isSubmitting || !validatePassword(newPassword) || !confirmPasswordValidation}
							className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium transition-all duration-200"
						>
							{isSubmitting ? "Updating Password..." : "Update Password"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
