import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavigationBar } from './components/NavigationBar';
import { HomePage } from './pages/HomePage';
import { ConfigCheckPage } from './pages/ConfigCheckPage';
import { ExerciseLogPage } from './pages/ExerciseLogPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { WorkoutLogPage } from './pages/WorkoutLogPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SubscriptionSuccessPage } from './pages/SubscriptionSuccessPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LoginForm } from './components/LoginForm';
import { OnboardingFlow } from './components/OnboardingFlow';
import { useUserStore } from './store/userStore';
import { supabase } from './lib/supabase';
import { Dumbbell, Crown } from 'lucide-react';
import { Toast } from './components/Toast';
import { FloatingCoachButton } from './components/FloatingCoachButton';
import { SubscriptionStatus } from './components/SubscriptionStatus';

function App() {
  const { userData, isDarkMode, isAuthenticated, loadUserData, setUserData } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      console.log('🔍 Checking auth state...');
      
      // Check if Supabase is configured before proceeding
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('❌ Supabase not configured. Please check your .env file.');
        setIsLoading(false);
        return;
      }
      
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        // Handle case where JWT refers to non-existent user
        if (authError && authError.message && authError.message.includes('User from sub claim in JWT does not exist')) {
          console.log('❌ Invalid JWT - user no longer exists, signing out');
          await supabase.auth.signOut();
          useUserStore.setState({ isAuthenticated: false });
          setIsLoading(false);
          return;
        }
        
        console.log('📋 Session:', session ? 'exists' : 'none');
        if (session) {
          // Only authenticate if email is confirmed
          if (session.user.email_confirmed_at) {
            console.log('✅ User authenticated and email confirmed, setting auth state');
            useUserStore.setState({ isAuthenticated: true });
            console.log('📊 Loading user data...');
            await loadUserData();
            
            // Check if user needs onboarding (no user data means first time)
            const currentUserData = useUserStore.getState().userData;
            console.log('👤 Current user data:', currentUserData);
            if (!currentUserData || !currentUserData.name) {
              console.log('🚀 No user data found, showing onboarding');
              setShowOnboarding(true);
            } else {
              console.log('✅ User data exists, skipping onboarding');
            }
          } else {
            console.log('❌ User session exists but email not confirmed, signing out');
            await supabase.auth.signOut();
            useUserStore.setState({ isAuthenticated: false });
          }
        } else {
          console.log('❌ No session found');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        console.log('🏁 Auth check complete, setting loading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [loadUserData]);

  const handleOnboardingComplete = (onboardingData: {
    name: string;
    height: number;
    sex: 'male' | 'female' | 'other';
    fitnessGoal: string;
  }) => {
    setShowOnboarding(false);
    
    // Update user data with onboarding information
    setUserData({
      name: onboardingData.name,
      height: onboardingData.height,
      sex: onboardingData.sex,
      email: '', // Will be set from auth session in setUserData
      weightUnit: 'Kgs',
      notifications: {
        workoutReminders: true,
        progressUpdates: true,
        newFeatures: true,
      },
      weeklyWorkoutGoal: 3,
    });
    
    // Reload user data to ensure it's properly synced
    setTimeout(() => {
      loadUserData();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">Loading FiTrek...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <LoginForm onComplete={() => {}} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-soft dark:bg-gradient-soft-dark flex flex-col transition-all duration-500">
        {showOnboarding ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : (
          <>
            <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-soft border-b border-white/30 dark:border-gray-700/50 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-3 xs:px-4 py-3 xs:py-4 sm:py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-header bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent transition-all duration-300">
                    FiTrek
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-body text-gray-600 dark:text-gray-300 transition-all duration-300 truncate">
                      Welcome back, {userData?.name}
                    </span>
                    <SubscriptionStatus />
                  </div>
                </div>
              </div>
            </header>
            
            <main className="flex-grow max-w-7xl mx-auto px-3 xs:px-4 py-3 xs:py-4 sm:py-6 sm:px-6 lg:px-8 pb-20 xs:pb-24 transition-all duration-500 animate-fade-in">
              <Routes>
                <Route path="/" element={<div className="page-transition"><HomePage /></div>} />
                <Route path="/config-check" element={<div className="page-transition"><ConfigCheckPage /></div>} />
                <Route path="/exercise-log" element={<div className="page-transition"><ExerciseLogPage /></div>} />
                <Route path="/workout-log" element={<div className="page-transition"><WorkoutLogPage /></div>} />
                <Route path="/subscriptions" element={<div className="page-transition"><SubscriptionsPage /></div>} />
                <Route path="/ai-assistant" element={<div className="page-transition"><AIAssistantPage /></div>} />
                <Route path="/profile" element={<div className="page-transition"><ProfilePage /></div>} />
                <Route path="/subscription-success" element={<div className="page-transition"><SubscriptionSuccessPage /></div>} />
                <Route path="/reset-password" element={<div className="page-transition"><ResetPasswordPage /></div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <NavigationBar />
            <FloatingCoachButton />
          </>
        )}
        <Toast />
      </div>
    </BrowserRouter>
  );
}

export default App;