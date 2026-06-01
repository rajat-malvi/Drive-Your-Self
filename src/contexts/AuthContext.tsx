import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { createUserProfile, getUserProfile } from '../services/userService';
import { UserProfile } from '../types/user';

// Simple user type for local session
interface LocalUser {
  id: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: LocalUser | null;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Generate a unique session ID for the user
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('dys_session_id');
  if (!sessionId) {
    sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('dys_session_id', sessionId);
  }
  return sessionId;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing local session');

        // Get or create session ID
        const sessionId = getOrCreateSessionId();
        console.log('Session ID:', sessionId);

        // Set user with session ID
        const localUser: LocalUser = { id: sessionId };
        setUser(localUser);

        try {
          // Try to fetch existing user profile
          const profile = await getUserProfile(sessionId);

          if (profile) {
            console.log('User profile found:', profile.username);
            setUserProfile(profile);
          } else {
            console.log('No profile found, creating new profile');
            // Create a new profile for this session
            const newProfile = await createUserProfile(sessionId, `guest_${sessionId}@local`);
            console.log('New profile created:', newProfile.username);
            setUserProfile(newProfile);
          }
        } catch (profileError) {
          console.error('Error handling user profile:', profileError);
          // Continue even if profile fetch fails
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      userProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
