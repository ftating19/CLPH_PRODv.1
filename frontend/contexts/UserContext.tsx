"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  user_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  program: string;
  role: string;
  status: string;
  first_login: number;
  created_at: string;
  description?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (userData: Partial<User>) => void;
  refreshCurrentUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch current user from localStorage or API
  const refreshCurrentUser = async () => {
    try {
      setIsLoading(true);
      
      // First try to get user from localStorage (check both keys)
      let storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        // Fallback to 'user' key and convert format
        const userProfileData = localStorage.getItem('user');
        if (userProfileData) {
          const userData = JSON.parse(userProfileData);
          // Convert profile format to currentUser format
          const convertedUser = {
            user_id: userData.user_id || userData.id,
            first_name: userData.first_name || userData.name?.split(' ')[0] || '',
            middle_name: userData.middle_name || '',
            last_name: userData.last_name || userData.name?.split(' ').slice(-1)[0] || '',
            email: userData.email,
            program: userData.program || '',
            role: userData.role,
            status: 'Active',
            first_login: 1,
            created_at: new Date().toISOString()
          };
          localStorage.setItem('currentUser', JSON.stringify(convertedUser));
          storedUser = JSON.stringify(convertedUser);
        }
      }
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Fetch fresh data from API to ensure it's up to date
        try {
          const response = await fetch(`http://localhost:4000/api/users`);
          if (response.ok) {
            const data = await response.json();
            const updatedUser = data.users.find((user: User) => user.user_id === userData.user_id);
            
            if (updatedUser) {
              setCurrentUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            } else {
              setCurrentUser(userData); // Fallback to stored data
            }
          } else {
            setCurrentUser(userData); // Fallback to stored data
          }
        } catch (apiError) {
          console.error('Error fetching fresh user data:', apiError);
          setCurrentUser(userData); // Fallback to stored data
        }
      }
    } catch (error) {
      console.error('Error refreshing current user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update current user data
  const updateCurrentUser = (userData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      
      // Update both localStorage keys for compatibility
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Also update the 'user' key for profile component compatibility
      const userForProfile = {
        id: updatedUser.user_id,
        name: `${updatedUser.first_name} ${updatedUser.middle_name ? updatedUser.middle_name + ' ' : ''}${updatedUser.last_name}`,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: '',
        first_name: updatedUser.first_name,
        middle_name: updatedUser.middle_name,
        last_name: updatedUser.last_name,
        program: updatedUser.program,
        user_id: updatedUser.user_id
      };
      localStorage.setItem('user', JSON.stringify(userForProfile));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('userDataUpdated', { 
        detail: updatedUser 
      }));
      
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
        detail: userForProfile 
      }));
    }
  };

  // Initialize user data on mount
  useEffect(() => {
    refreshCurrentUser();
  }, []);

  // Listen for user update events from other parts of the app
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    };

    window.addEventListener('userDataUpdated', handleUserUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserUpdate as EventListener);
    };
  }, []);

  const value: UserContextType = {
    currentUser,
    setCurrentUser,
    updateCurrentUser,
    refreshCurrentUser,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export type { User };
