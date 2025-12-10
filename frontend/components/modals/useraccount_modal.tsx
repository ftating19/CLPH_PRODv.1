import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CICT_PROGRAMS, USER_ROLES_CREATE } from "@/lib/constants";

interface UserAccountModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: any) => void;
}

export default function UserAccountModal({ open, onClose, onSubmit }: UserAccountModalProps) {
	const { toast } = useToast();
	// Simulate auto-increment user_id (in real app, backend should handle this)
	const [userId] = useState(Math.floor(Math.random() * 1000000));
	const [firstName, setFirstName] = useState("");
	const [middleName, setMiddleName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [program, setProgram] = useState("");
	const [role, setRole] = useState("Student");
	const [yearLevel, setYearLevel] = useState("");
	const [emailError, setEmailError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const status = "Active";

	async function checkEmailExists(email: string) {
		try {
			const response = await fetch(`https://api.cictpeerlearninghub.com/api/check-email?email=${email}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			return data.exists;
		} catch (error) {
			console.error("Error checking email existence:", error);
			return false; // Assume email does not exist if there's an error
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);

		if (!program) {
			toast({
				variant: "destructive",
				title: "Program Required",
				description: "Please select a program of study.",
			});
			setIsSubmitting(false);
			return;
		}

		try {
			const emailExists = await checkEmailExists(email);
			if (emailExists) {
				toast({
					variant: "destructive",
					title: "Email already exists",
					description: "This email is already registered. Please use a different email.",
				});
				setIsSubmitting(false);
				return; // Stop account creation if email exists
			}
		} catch (error) {
			console.error("Error verifying email existence:", error);
			toast({
				variant: "destructive",
				title: "Verification Error",
				description: "An error occurred while verifying the email. Please try again.",
			});
			setIsSubmitting(false);
			return; // Stop account creation if email verification fails
		}

		try {
			// Set year level to N/A for Admin and Faculty roles
			const finalYearLevel = (role === "Admin" || role === "Faculty") ? "N/A" : yearLevel;
			
			await onSubmit({ user_id: userId, first_name: firstName, middle_name: middleName, last_name: lastName, email, program, role, year_level: finalYearLevel, status });
			toast({
				title: "User account created successfully!",
				description: "A temporary password has been sent to the user's email.",
			});
			
			// Reset form
			setFirstName("");
			setMiddleName("");
			setLastName("");
			setEmail("");
			setProgram("");
			setRole("Student");
			setYearLevel("");
			setEmailError("");
			setIsSubmitting(false);
			
			onClose();
		} catch (error: any) {
			console.error("Error creating user:", error);
			toast({
				variant: "destructive",
				title: "Error creating user",
				description: error.message || "An error occurred while creating the user account.",
			});
			setIsSubmitting(false);
		}
	}

	const handleClose = () => {
		// Reset form when closing
		setFirstName("");
		setMiddleName("");
		setLastName("");
		setEmail("");
		setProgram("");
		setRole("Student");
		setYearLevel("");
		setEmailError("");
		setIsSubmitting(false);
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create User Account</DialogTitle>
						<DialogDescription>Fill in the details to create a new user account. A temporary password will be generated and sent via email.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 mt-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="first_name">First Name</Label>
								<Input id="first_name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
							</div>
							<div>
								<Label htmlFor="middle_name">Middle Name</Label>
								<Input id="middle_name" value={middleName} onChange={e => setMiddleName(e.target.value)} />
							</div>
							<div>
								<Label htmlFor="last_name">Last Name</Label>
								<Input id="last_name" value={lastName} onChange={e => setLastName(e.target.value)} required />
							</div>
							<div>
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									required
								/>
								{emailError && <p className="text-red-500 text-sm">{emailError}</p>}
							</div>
						</div>
						<div>
							<Label htmlFor="role">Role</Label>
							<Select value={role} onValueChange={setRole}>
								<SelectTrigger className="w-full" aria-label="Role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									{USER_ROLES_CREATE.map((role) => (
										<SelectItem key={role} value={role}>
											{role}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="program">Program</Label>
							<Select value={program} onValueChange={setProgram}>
								<SelectTrigger className="w-full" aria-label="Program">
									<SelectValue placeholder="Select a program" />
								</SelectTrigger>
								<SelectContent>
									{CICT_PROGRAMS.map((program) => (
										<SelectItem key={program} value={program}>
											{program}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{role !== "Admin" && role !== "Faculty" && (
							<div>
								<Label htmlFor="year_level">Year Level</Label>
								<Select value={yearLevel} onValueChange={setYearLevel}>
									<SelectTrigger className="w-full" aria-label="Year Level">
										<SelectValue placeholder="Select year level" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1st Year">1st Year</SelectItem>
										<SelectItem value="2nd Year">2nd Year</SelectItem>
										<SelectItem value="3rd Year">3rd Year</SelectItem>
										<SelectItem value="4th Year">4th Year</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
						{/* Status is auto Active, not editable */}
						<div>
							<Label>Status</Label>
							<Input value={status} disabled />
						</div>
						
						{/* Password info */}
						<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
							<div className="flex items-start space-x-3">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
									</svg>
								</div>
								<div>
									<h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Temporary Password</h3>
									<p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
										A secure temporary password will be automatically generated and sent to the user's email address. The user will be required to change it on first login.
									</p>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter className="mt-6">
						<Button 
							type="submit" 
							disabled={isSubmitting}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200"
						>
							{isSubmitting ? "Creating Account..." : "Create Account & Send Credentials"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
