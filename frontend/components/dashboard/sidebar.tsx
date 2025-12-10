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
  Target,
} from "lucide-react"

import { Home } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/UserContext"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentUser } = useUser()

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    setMounted(true)
  }, [])

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
    // Parse the href to check if it has query params
    const [hrefPath, hrefQuery] = href.split('?')
    const currentView = searchParams?.get('view')
    const hrefView = hrefQuery?.includes('view=simple') ? 'simple' : null
    
    // Check if both path and view parameter match
    const isActive = pathname === hrefPath && (
      (hrefView === 'simple' && currentView === 'simple') ||
      (hrefView === null && currentView !== 'simple')
    )
    
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
      fetch("https://api.cictpeerlearninghub.com/api/pending-materials?status=pending")
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

  function PendingQuizzesNavItem({
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
      fetch("https://api.cictpeerlearninghub.com/api/pending-quizzes?status=pending")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (Array.isArray(data.quizzes)) {
              const count = data.quizzes.filter((q: any) => q.status === "pending").length;
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

  function PendingFlashcardsNavItem({
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
      fetch("https://api.cictpeerlearninghub.com/api/pending-flashcards?status=pending")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (Array.isArray(data.flashcards)) {
              // Group flashcards by sub_id and count unique groups
              const subIdGroups = new Set();
              data.flashcards.forEach((f: any) => {
                if (f.status === "pending") {
                  subIdGroups.add(f.sub_id);
                }
              });
              setPendingCount(subIdGroups.size)
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

  function PendingPostTestsNavItem({
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
      fetch("https://api.cictpeerlearninghub.com/api/pending-post-tests?status=pending")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            if (Array.isArray(data.postTests)) {
              const count = data.postTests.filter((p: any) => p.status === "pending").length;
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

  function TutorSessionNavItem({
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
      
      if (currentUser?.user_id) {
        // Fetch sessions where current user is tutor and status is pending
        fetch(`https://api.cictpeerlearninghub.com/api/sessions?user_id=${currentUser.user_id}`)
          .then((res) => res.json())
          .then((data) => {
            if (isMounted && data.success && Array.isArray(data.sessions)) {
              // Count pending sessions where current user is the tutor
              const count = data.sessions.filter((session: any) => 
                session.tutor_id === currentUser.user_id && 
                session.status === 'pending'
              ).length;
              setPendingCount(count)
            } else {
              setPendingCount(0)
            }
          })
          .catch(() => {
            if (isMounted) setPendingCount(undefined)
          })
      }
      
      return () => { isMounted = false }
    }, [currentUser])

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
      fetch("https://api.cictpeerlearninghub.com/api/tutor-applications?status=pending")
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
              {!isAdmin && (
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
                    <NavItem href="/quizzes?view=simple" icon={Brain}>
                      Quizzes
                    </NavItem>
                    <NavItem href="/flashcards?view=simple" icon={Layers}>
                      Flashcards
                    </NavItem>
                  </div>
                </div>
              )}

              {isAdmin ? (
                <>
                  {(["faculty","admin"].includes(userRole)) && (
                    <>
                      <div>
                        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Management
                        </div>
                        <div className="space-y-1">
                          {userRole === "admin" && (
                            <NavItem href="/admin-dashboard" icon={Shield}>
                              Admin Dashboard
                            </NavItem>
                          )}
                          {userRole === "admin" && (
                            <NavItem href="/user-management" icon={Users}>
                              User Management
                            </NavItem>
                          )}
                          {userRole === "admin" && (
                            <NavItem href="/pre-assessments" icon={Target}>
                              Manage Pre-Assessments
                            </NavItem>
                          )}
                          {userRole === "admin" && (
                            <NavItem href="/manage-subjects" icon={Library}>
                              Manage Subjects
                            </NavItem>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {(["student","tutor","faculty","admin"].includes(userRole)) && (
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
                </>
              ) : (
                <>
                  {(["student","tutor","faculty","admin"].includes(userRole)) && (
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

                  {(["faculty","admin"].includes(userRole)) && (
                    <>
                      <div>
                        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Management
                        </div>
                        <div className="space-y-1">
                          {userRole === "admin" && (
                            <NavItem href="/admin-dashboard" icon={Shield}>
                              Admin Dashboard
                            </NavItem>
                          )}
                          {userRole === "admin" && (
                            <NavItem href="/user-management" icon={Users}>
                              User Management
                            </NavItem>
                          )}
                          {userRole === "faculty" && (
                            <PendingApplicantsNavItem href="/pending-applicants" icon={Clock}>
                              Pending Applicants
                            </PendingApplicantsNavItem>
                          )}
                          {userRole === "faculty" && (
                            <PendingMaterialsNavItem href="/pending-materials" icon={BookOpen}>
                              Pending Materials
                            </PendingMaterialsNavItem>
                          )}
                          {userRole === "faculty" && (
                            <PendingQuizzesNavItem href="/pending-quizzes" icon={Brain}>
                              Pending Quizzes
                            </PendingQuizzesNavItem>
                          )}
                          {userRole === "faculty" && (
                            <PendingFlashcardsNavItem href="/pending-flashcards" icon={Layers}>
                              Pending Flashcards
                            </PendingFlashcardsNavItem>
                          )}
                          {userRole === "faculty" && (
                            <PendingPostTestsNavItem href="/pending-post-tests" icon={FileText}>
                              Pending Post-Tests
                            </PendingPostTestsNavItem>
                          )}
                          {userRole === "faculty" && (
                            <NavItem href="/tutors-pre-assessment" icon={Target}>
                              Tutors Pre-Assessment
                            </NavItem>
                          )}
                        </div>
                      </div>

                      {userRole === "faculty" && (
                        <div>
                          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-6">
                            Tools
                          </div>
                          <div className="space-y-1">
                            <NavItem href="/quizzes" icon={Brain}>
                              Manage My Quizzes
                            </NavItem>
                            <NavItem href="/flashcards" icon={Layers}>
                              Manage My Flashcards
                            </NavItem>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {!isAdmin && (userRole === "student" || userRole === "tutor" || userRole === "faculty" || userRole === "admin") && (
                <>
                  <div>
                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Sessions
                    </div>
                    <div className="space-y-1">
                      <TutorSessionNavItem href="/sessions/tutor-session" icon={UserCheck}>
                        Tutor Session
                      </TutorSessionNavItem>
                      {userRole === "tutor" && (
                        <NavItem href="/sessions/manage-post-test" icon={FileText}>
                          Manage Post-Test
                        </NavItem>
                      )}
                    </div>
                  </div>
                  {(userRole === "student" || userRole === "tutor") && (
                    <div>
                      <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-6">
                        Tools
                      </div>
                      <div className="space-y-1">
                        <NavItem href="/quizzes" icon={Brain}>
                          My Quizzes
                        </NavItem>
                        <NavItem href="/flashcards" icon={Layers}>
                          My Flashcards
                        </NavItem>
                      </div>
                    </div>
                  )}
                </>
              )}

              {userRole === "admin" && (
                <></>
              )}
            </div>
          </div>

          {!isAdmin && (
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
          )}
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
