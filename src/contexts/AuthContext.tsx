import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { User as AppUser, Profile, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (userData: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user profile from our users table
  const fetchUserProfile = async (supabaseUser: User): Promise<{ user: AppUser | null; profile: Profile | null }> => {
    try {
      // Get user from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
        return { user: null, profile: null };
      }

      // Create user if doesn't exist
      let appUser: AppUser = userData;
      if (!userData) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            phone_number: supabaseUser.phone || '',
            profile_completed: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return { user: null, profile: null };
        }
        appUser = newUser;
      }

      // Get profile if exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      return { user: appUser, profile: profileData };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return { user: null, profile: null };
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for custom session token first
        const sessionToken = localStorage.getItem('sessionToken');
        const userData = localStorage.getItem('user');
        
        if (sessionToken && userData) {
          const user = JSON.parse(userData);
          setUser(user);
          setIsAuthenticated(true);
          
          // Load profile for custom auth users if profile is completed
          if (user.profile_completed) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
              
              if (!profileError && profileData) {
                setProfile(profileData);
              }
            } catch (error) {
              console.error('Error loading profile for custom auth user:', error);
            }
          }
          
          setLoading(false);
          return;
        }

        // Fallback to Supabase session for email auth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const { user: appUser, profile: userProfile } = await fetchUserProfile(session.user);
          setUser(appUser);
          setProfile(userProfile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          const { user: appUser, profile: userProfile } = await fetchUserProfile(session.user);
          setUser(appUser);
          setProfile(userProfile);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (phone: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();

      if (!data.success) {
        return { error: { message: data.error } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: (error as Error).message || 'Network error' } };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone, code: token }),
      });

      const data = await response.json();

      if (!data.success) {
        return { error: { message: data.error } };
      }

      // Store session token in localStorage
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Set user state
      setUser(data.user);
      setIsAuthenticated(true);

      return { error: null };
    } catch (error) {
      return { error: { message: (error as Error).message || 'Network error' } };
    }
  };

  const signOut = async () => {
    try {
      // Clear our custom session
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      
      // Also clear Supabase session if exists
      await supabase.auth.signOut();
      
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        const { user: appUser, profile: userProfile } = await fetchUserProfile(supabaseUser);
        setUser(appUser);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const updateUser = async (userData: Partial<AppUser>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Also update localStorage for custom auth users
      if (localStorage.getItem('sessionToken')) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      // Load profile if profile_completed is being set to true
      if (userData.profile_completed && !profile) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (!profileError && profileData) {
            setProfile(profileData);
          }
        } catch (error) {
          console.error('Error loading profile after user update:', error);
        }
      }
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    verifyOtp,
    signInWithEmail,
    signOut,
    refreshProfile,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 