"use client"

import type React from "react"

import {
  Users,
  MessageSquare,
  FileText,
  Star,
  Brain,
  Settings,
  HelpCircle,
  Menu,
  GraduationCap,
  UserCheck,
  Shield,
  Clock,
  BookOpen,
  Layers,
  Library,
} from "lucide-react"

import { Home } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/UserContext"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { currentUser } = useUser()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    const isActive = pathname === href
    
    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
        }`}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    )
  }

  function PendingMaterialsNavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    const [pendingCount, setPendingCount] = useState<number | undefined>(undefined)

    const { currentUser } = useUser();
    useEffect(() => {
      let isMounted = true;
      fetch("http://localhost:4000/api/pending-materials?status=pending")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (Array.isArray(data.materials)) {
              let count = 0;
              if (currentUser?.role?.toLowerCase() === 'faculty') {
                count = data.materials.filter((m: any) => m.status === "pending" && Array.isArray(m.assigned_faculty) && m.assigned_faculty.some((fac: string) => fac.includes(currentUser.email))).length;
              } else {
                count = data.materials.filter((m: any) => m.status === "pending").length;
              }
              setPendingCount(count)
            } else {
              setPendingCount(0)
            }
          }
        })
        .catch(() => {
          if (isMounted) setPendingCount(undefined)
        })
      return () => { isMounted = false }
    }, [currentUser])

    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors`}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <span className="flex items-center gap-2">
          {children}
          {pendingCount !== undefined && pendingCount > 0 && (
            <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full min-w-[20px] h-5 text-xs font-bold ml-2">
              {pendingCount}
            </span>
          )}
        </span>
      </Link>
    )
  }

  function PendingApplicantsNavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    const [pendingCount, setPendingCount] = useState<number | undefined>(undefined)

    const { currentUser } = useUser();
    useEffect(() => {
      let isMounted = true;
      fetch("http://localhost:4000/api/tutor-applications?status=pending")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (Array.isArray(data.applications)) {
              let count = 0;
              if (currentUser?.role?.toLowerCase() === 'faculty') {
                count = data.applications.filter((a: any) => {
                  // Assume a.assigned_faculty is an array of faculty names/emails
                  return a.status === "pending" && Array.isArray(a.assigned_faculty) && a.assigned_faculty.some((fac: string) => fac.includes(currentUser.email));
                }).length;
              } else {
                count = data.applications.filter((a: any) => a.status === "pending").length;
              }
              setPendingCount(count)
            } else {
              setPendingCount(0)
            }
          }
        })
        .catch(() => {
          if (isMounted) setPendingCount(undefined)
        })
      return () => { isMounted = false }
    }, [currentUser])

    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors`}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <span className="flex items-center gap-2">
          {children}
          {pendingCount !== undefined && pendingCount > 0 && (
            <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full min-w-[20px] h-5 text-xs font-bold ml-2">
              {pendingCount}
            </span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={`
                fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0F0F12] transform transition-transform duration-200 ease-in-out
                lg:translate-x-0 lg:static lg:w-64 border-r border-gray-200 dark:border-[#1F1F23]
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">CICT PEER LEARNING HUB</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Learning
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/tutor-matching" icon={UserCheck}>
                    Tutor Matching
                  </NavItem>
                  {(userRole === "tutor" || userRole === "faculty" || userRole === "admin") && (
                    <NavItem href="/student-matching" icon={Users}>
                      Student Matching
                    </NavItem>
                  )}
                  <NavItem href="/learning-resources" icon={FileText}>
                    Learning Resources
                  </NavItem>
                  {/* Quizzes and Flashcards removed from Learning for faculty/admin; now only in Tools section */}
                </div>
              </div>

              {(userRole === "student" || userRole === "tutor" || userRole === "faculty" || userRole === "admin") && (
                <div>
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Community
                  </div>
                  <div className="space-y-1">
                    <NavItem href="/discussion-forums" icon={MessageSquare}>
                      Discussion Forums
                    </NavItem>
                    <NavItem href="/feedback-rating" icon={Star}>
                      Feedback & Rating
                    </NavItem>
                  </div>
                </div>
              )}

              {(userRole === "faculty" || userRole === "admin") && (
                <div>
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Management
                  </div>
                  <div className="space-y-1">
                    <NavItem href="/user-management" icon={Users}>
                      User Management
                    </NavItem>
                    <PendingApplicantsNavItem href="/pending-applicants" icon={Clock}>
                      Pending Applicants
                    </PendingApplicantsNavItem>
                    <PendingMaterialsNavItem href="/pending-materials" icon={BookOpen}>
                      Pending Materials
                    </PendingMaterialsNavItem>
                    {userRole === "admin" && (
                      <NavItem href="/admin-dashboard" icon={Shield}>
                        Admin Dashboard
                      </NavItem>
                    )}
                  </div>
                </div>
              )}
                {(userRole === "faculty" || userRole === "admin") && (
                  <div>
                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-6">
                      Tools
                    </div>
                    <div className="space-y-1">
                      <NavItem href="/quizzes" icon={Brain}>
                        Manage Quizzes
                      </NavItem>
                      <NavItem href="/flashcards" icon={Layers}>
                        Manage Flashcards
                      </NavItem>
                      <NavItem href="/manage-subjects" icon={Library}>
                        Manage Subjects
                      </NavItem>
                    </div>
                  </div>
                )}

              {(userRole === "student" || userRole === "tutor" || userRole === "faculty" || userRole === "admin") && (
                <>
                  <div>
                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Sessions
                    </div>
                    <div className="space-y-1">
                      <NavItem href="/sessions/tutor-session" icon={UserCheck}>
                        Tutor Session
                      </NavItem>
                    </div>
                  </div>
                  {(userRole === "student" || userRole === "tutor") && (
                    <div>
                      <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Tools
                      </div>
                      <div className="space-y-1">
                        <NavItem href="/quizzes" icon={Brain}>
                          Quizzes
                        </NavItem>
                        <NavItem href="/flashcards" icon={Layers}>
                          Flashcards
                        </NavItem>
                      </div>
                    </div>
                  )}
                </>
              )}

              {userRole === "admin" && (
                <div>
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tools
                  </div>
                  <div className="space-y-1">
                    <NavItem href="/quizzes" icon={Brain}>
                      Manage Quizzes
                    </NavItem>
                    <NavItem href="/flashcards" icon={Layers}>
                      Manage Flashcards
                    </NavItem>
                    <NavItem href="/manage-subjects" icon={Library}>
                      Manage Subjects
                    </NavItem>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="space-y-1">
              <NavItem href="/settings" icon={Settings}>
                Settings
              </NavItem>
              <NavItem href="/help" icon={HelpCircle}>
                Help
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
