// Program options for CICT
export const CICT_PROGRAMS = [
  "Bachelor of Science in Information Systems",
  "Bachelor of Science in Information Technology", 
  "Bachelor of Science in Computer Science",
  "Bachelor of Library and Information Science",
  "Bachelor of Science in Entertainment and Multimedia Computing"
] as const;

// Role options for users
export const USER_ROLES = [
  "Student",
  "Faculty", 
  "Tutor",
  "Admin"
] as const;

// Role options for creating new users (excludes Tutor)
export const USER_ROLES_CREATE = [
  "Student",
  "Faculty",
  "Admin"
] as const;

// Account status options
export const ACCOUNT_STATUSES = [
  "Active",
  "Inactive", 
  "Pending",
  "Suspended"
] as const;
