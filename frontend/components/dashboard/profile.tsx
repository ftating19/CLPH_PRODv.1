import type React from "react"
import { LogOut, MoveUpRight, Settings, FileText, GraduationCap, BookOpen, Edit, UserPlus } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import EditProfileModal from "../modals/editprofile_modal"
import ApplyAsTutorModal from "../modals/applyastutor_modal"
import { useUser } from "@/contexts/UserContext"

interface MenuItem {
  label: string
  value?: string
  href: string
  icon?: React.ReactNode
  external?: boolean
  onClick?: () => void
}

interface UserData {
  id: number
  name: string
  email: string
  role: string
  avatar: string
}

interface Profile01Props {
  name: string
  role: string
  avatar: string
  subscription?: string
}

import { useRouter } from "next/navigation"

export default function Profile01() {
  const router = useRouter();
  const { currentUser, updateCurrentUser, refreshCurrentUser, isLoading: contextLoading } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApplyTutorModal, setShowApplyTutorModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Use data from context
      setUserData({
        id: currentUser.user_id,
        name: `${currentUser.first_name} ${currentUser.middle_name ? currentUser.middle_name + ' ' : ''}${currentUser.last_name}`,
        email: currentUser.email,
        role: currentUser.role,
        avatar: ''
      });
      setLoading(false);
    } else {
      // Fallback to localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserData(user);
        } catch (error) {
          console.error('Error parsing user data:', error);
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
      setLoading(false);
    }
  }, [currentUser, router]);

  // Listen for user data updates from admin edit and profile edit
  useEffect(() => {
    const handleUserUpdate = () => {
      refreshCurrentUser();
    };

    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      setUserData(updatedUser);
    };

    const handleStorageChange = () => {
      // Handle localStorage changes from other tabs/windows
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserData(user);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('userDataUpdated', handleUserUpdate);
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserUpdate);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshCurrentUser]);

  function handleLogout() {
    // Clear session (localStorage, cookies, etc.)
    if (typeof window !== "undefined") {
      localStorage.clear();
      // If you use cookies for auth, clear them here as well
    }
    router.replace("/login");
  }

  function handleProfileUpdate(updatedUserData: UserData) {
    setUserData(updatedUserData);
    // Also update the context
    if (currentUser) {
      const nameParts = updatedUserData.name.split(' ');
      updateCurrentUser({
        first_name: nameParts[0] || '',
        middle_name: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        last_name: nameParts[nameParts.length - 1] || '',
        email: updatedUserData.email,
        role: updatedUserData.role
      });
    }
  }

  // Show loading state while checking for user data
  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="relative px-6 pt-12 pb-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse ring-4 ring-white dark:ring-zinc-900" />
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no user data after loading, don't render anything (redirect will happen)
  if (!userData) {
    return null;
  }

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get user initials from name
  const getUserInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const menuItems: MenuItem[] = [
    {
      label: "Apply as Tutor",
      href: "#",
      icon: <UserPlus className="w-4 h-4" />,
      external: false,
      onClick: () => setShowApplyTutorModal(true),
    },
    {
      label: "Edit Profile",
      value: `${formatRole(userData.role)}`,
      href: "#",
      icon: <Edit className="w-4 h-4" />,
      external: false,
      onClick: () => setShowEditModal(true),
    },
  ]

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative px-6 pt-12 pb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-white dark:ring-zinc-900">
                <span className="text-white font-bold text-3xl">
                  {getUserInitials(userData.name)}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{userData.name}</h2>
              <p className="text-zinc-600 dark:text-zinc-400">{formatRole(userData.role)}</p>
            </div>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-6" />
          <div className="space-y-2">
            {menuItems.map((item) => (
              item.onClick ? (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-2 
                                      hover:bg-zinc-50 dark:hover:bg-zinc-800/50 
                                      rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                  </div>
                  <div className="flex items-center">
                    {item.value && <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">{item.value}</span>}
                    {item.external && <MoveUpRight className="w-4 h-4" />}
                  </div>
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-2 
                                      hover:bg-zinc-50 dark:hover:bg-zinc-800/50 
                                      rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                  </div>
                  <div className="flex items-center">
                    {item.value && <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">{item.value}</span>}
                    {item.external && <MoveUpRight className="w-4 h-4" />}
                  </div>
                </Link>
              )
            ))}

            <button
              type="button"
              className="w-full flex items-center justify-between p-2 
                                hover:bg-zinc-50 dark:hover:bg-zinc-800/50 
                                rounded-lg transition-colors duration-200"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleProfileUpdate}
      />

      {/* Apply as Tutor Modal */}
      <ApplyAsTutorModal
        open={showApplyTutorModal}
        onClose={() => setShowApplyTutorModal(false)}
      />
    </div>
  )
}
