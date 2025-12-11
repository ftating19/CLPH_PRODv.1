import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CICT_PROGRAMS } from "@/lib/constants";

interface SignupModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: any) => void;
}

export default function SignupModal({ open, onClose, onSubmit }: SignupModalProps) {
	const { toast } = useToast();
	// Simulate auto-increment user_id (in real app, backend should handle this)
	const [userId] = useState(Math.floor(Math.random() * 1000000));
	const [firstName, setFirstName] = useState("");
	const [middleName, setMiddleName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [program, setProgram] = useState("");
	const [role, setRole] = useState("Student");
	const [yearLevel, setYearLevel] = useState("");
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [confirmPasswordError, setConfirmPasswordError] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordValidation, setPasswordValidation] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		number: false,
		specialChar: false,
	});
	const [confirmPasswordValidation, setConfirmPasswordValidation] = useState(false);
	const status = "Active";

	function validatePassword(password: string) {
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
		return passwordRegex.test(password);
	}

	function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setPassword(value);
		setPasswordValidation({
			length: value.length >= 8,
			uppercase: /[A-Z]/.test(value),
			lowercase: /[a-z]/.test(value),
			number: /\d/.test(value),
			specialChar: /[@$!%*?&]/.test(value),
		});
	}

	function handleConfirmPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setConfirmPassword(value);
		setConfirmPasswordValidation(value === password);
	}

	async function checkEmailExists(email: string) {
		try {
			const response = await fetch(`https://api.cictpeerlearninghub.com/api/check-email?email=${email}`); // Updated port to 4000
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

		if (!validatePassword(password)) {
			setPasswordError("Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.");
			return;
		}

		if (password !== confirmPassword) {
			setConfirmPasswordError("Passwords do not match.");
			return;
		}

		if (!yearLevel) {
			toast({
				variant: "destructive",
				title: "Year Level Required",
				description: "Please select your year level.",
			});
			return;
		}

		if (!program) {
			toast({
				variant: "destructive",
				title: "Program Required",
				description: "Please select your program of study.",
			});
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
				return; // Stop account creation if email exists
			}
		} catch (error) {
			console.error("Error verifying email existence:", error);
			toast({
				variant: "destructive",
				title: "Verification Error",
				description: "An error occurred while verifying the email. Please try again.",
			});
			return; // Stop account creation if email verification fails
		}

		setPasswordError("");
		setConfirmPasswordError("");

		onSubmit({ user_id: userId, first_name: firstName, middle_name: middleName, last_name: lastName, email, password, program, role, year_level: yearLevel, status });
		toast({
			title: "Account created successfully!",
			description: "Your account has been created and you can now login.",
		});
		onClose();
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create Account</DialogTitle>
						<DialogDescription>Fill in the details to create a new account.</DialogDescription>
					</DialogHeader>
					{/* Hidden user_id */}
					{/* Removed user_id field (auto-incremented in DB) */}
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
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={passwordVisible ? "text" : "password"}
									value={password}
									onChange={handlePasswordChange}
									required
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 flex items-center pr-3"
									onClick={() => setPasswordVisible(!passwordVisible)}
								>
									{passwordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
								</button>
							</div>
							<ul className="mt-2 text-sm">
								<li className={passwordValidation.length ? "text-green-500" : "text-red-500"}>At least 8 characters</li>
								<li className={passwordValidation.uppercase ? "text-green-500" : "text-red-500"}>At least 1 uppercase letter</li>
								<li className={passwordValidation.lowercase ? "text-green-500" : "text-red-500"}>At least 1 lowercase letter</li>
								<li className={passwordValidation.number ? "text-green-500" : "text-red-500"}>At least 1 number</li>
								<li className={passwordValidation.specialChar ? "text-green-500" : "text-red-500"}>At least 1 special character</li>
							</ul>
							{passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
						</div>
						<div>
							<Label htmlFor="confirm_password">Confirm Password</Label>
							<div className="relative">
								<Input
									id="confirm_password"
									type="password"
									value={confirmPassword}
									onChange={handleConfirmPasswordChange}
									required
								/>
							</div>
							<p className={confirmPasswordValidation ? "text-green-500" : "text-red-500"}>
								{confirmPasswordValidation ? "Passwords match" : "Passwords do not match"}
							</p>
						</div>
						<div>
							<Label htmlFor="program">Program</Label>
							<Select value={program} onValueChange={setProgram}>
								<SelectTrigger className="w-full" aria-label="Program">
									<SelectValue placeholder="Select your program" />
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
						<div>
							<Label htmlFor="year_level">Year Level</Label>
							<Select value={yearLevel} onValueChange={setYearLevel}>
								<SelectTrigger className="w-full" aria-label="Year Level">
									<SelectValue placeholder="Select your year level" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1st Year">1st Year</SelectItem>
									<SelectItem value="2nd Year">2nd Year</SelectItem>
									<SelectItem value="3rd Year">3rd Year</SelectItem>
									<SelectItem value="4th Year">4th Year</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="role">Role</Label>
							<Select value={role} onValueChange={setRole}>
								<SelectTrigger className="w-full" aria-label="Role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Student">Student</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter className="mt-6">
						<Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200">Create Account</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
