import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase'; // Ensure supabase is imported
import type { UserData, WorkoutLog, WorkoutProgram, CustomExercise, Goal } from '../types';

interface UserStore {
  userData: UserData | null;
  workoutLogs: WorkoutLog[];
  programs: WorkoutProgram[];
  customExercises: CustomExercise[];
  goals: Goal[];
  isDarkMode: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoadingData: boolean;
  referralCode: string | undefined; // Changed to undefined for consistency with UserData
  completedReferralsCount: number;
  referralMilestones: { milestone_level: number; achieved_at: string }[];
  showToast: boolean;
  toastMessage: string;
  
  // Auth methods
  login: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signup: (email: string, password: string, username?: string) => Promise<{ needsEmailConfirmation: boolean; userAlreadyExists?: boolean }>;
  resendVerification: (email: string) => Promise<{ error?: any }>;
  generateReferralCode: () => Promise<void>;
  processReferralSignup: (referredUserId: string, referralCode: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Data methods
  setUserData: (data: UserData) => void;
  loadUserData: () => Promise<void>;
  addWorkoutLog: (log: WorkoutLog) => void;
  addProgram: (program: WorkoutProgram) => void;
  editProgram: (program: WorkoutProgram) => void;
  deleteProgram: (id: string) => void;
  deleteWorkoutLog: (id: string) => void;
  addCustomExercise: (exercise: CustomExercise) => void;
  editCustomExercise: (exercise: CustomExercise) => void;
  deleteCustomExercise: (id: string) => void;
  addGoal: (goal: Goal) => void;
  editGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (goalId: string, newValue: number) => void;
  toggleDarkMode: () => void;
  showToastMessage: (message: string) => void;
  hideToast: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      userData: null,
      workoutLogs: [],
      programs: [],
      customExercises: [],
      goals: [],
      isDarkMode: false,
      isAuthenticated: false,
      isLoading: false,
      isLoadingData: false,
      referralCode: undefined, // Changed to undefined
      completedReferralsCount: 0,
      referralMilestones: [],
      showToast: false,
      toastMessage: '',

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Check if Supabase is configured
          if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration is missing. Please check your environment variables.');
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Login error:', error);
            throw error;
          }

          if (data.user) {
            // Check if email is confirmed
            if (!data.user.email_confirmed_at) {
              console.log('Email not confirmed, blocking login');
              return { needsEmailConfirmation: true };
            }
            
            console.log('Email confirmed, proceeding with login');
            set({ isAuthenticated: true });
            await get().loadUserData();
          }

          return { needsEmailConfirmation: false };
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (email: string, password: string, username?: string) => {
        set({ isLoading: true });
        try {
          // Check if Supabase is configured
          if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration is missing. Please check your environment variables.');
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          });

          if (error) {
            console.error('Signup error:', error);
            if (error.message.includes('User already registered')) {
              return { needsEmailConfirmation: false, userAlreadyExists: true, userId: data.user?.id || null };
            }
            throw error;
          }

          // Always require email confirmation for new signups, don't log them in
          console.log('User created, email confirmation required');
          return { needsEmailConfirmation: true, userAlreadyExists: false, userId: data.user?.id || null };
        } catch (error) {
          console.error('Signup failed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resendVerification: async (email: string) => {
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
          });

          return { error };
        } catch (error) {
          console.error('Resend verification failed:', error);
          return { error };
        }
      },

      generateReferralCode: async () => { // This function will now trigger the RPC
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          // Trigger the database function to generate a code if not exists
          // The trigger 'generate_referral_code_on_user_insert' handles this on user creation.
          // If a user somehow doesn't have one, a simple update would trigger it.
          // For now, we just reload user data to get the code.
          await get().loadUserData();
        } catch (error) {
          console.error('Error generating referral code:', error);
        }
      },

      processReferralSignup: async (referredUserId: string, referralCode: string) => {
        try {
          console.log('🎁 Processing referral signup:', { referredUserId, referralCode });
          const { error } = await supabase.rpc('process_referral_signup', { // Call the RPC
            p_referred_user_id: referredUserId,
            p_referral_code: referralCode,
          });

          if (error) {
            console.error('Error processing referral signup:', error);
            // Optionally show a toast or handle the error in UI
            get().showToastMessage(`Failed to apply referral: ${error.message}`);
            return { success: false, error: error.message };
          } else {
            console.log('Referral signup processed successfully.');
            get().showToastMessage('Referral code applied successfully! Your referrer will earn rewards when you subscribe.');
            return { success: true };
          }
        } catch (error) {
          console.error('Error calling process_referral_signup RPC:', error);
          get().showToastMessage('Failed to process referral code.');
          return { success: false, error: 'Failed to process referral code' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          userData: null,
          workoutLogs: [],
          programs: [],
          customExercises: [],
          isAuthenticated: false,
        });
      },

      loadUserData: async () => {
        set({ isLoadingData: true });
        console.log('📊 Starting loadUserData...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No user found in loadUserData');
          set({ isLoadingData: false });
          return;
        }
        console.log('👤 User found:', user.id);

        try {
          // Load user profile
          console.log('🔍 Querying user profile...');
          console.log('🔍 User ID:', user.id);
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          console.log('📋 Profile data:', profile);
          console.log('📋 Profile referral_code:', profile?.referral_code); // Debug log
          console.log('📋 Profile completed_referrals_count:', profile?.completed_referrals_count);
          
          if (profile) {
            console.log('✅ Setting user data from profile');
            set({
              userData: {
                name: profile.name,
                height: profile.height,
                sex: profile.sex,
                email: user.email || profile.email,
                weightUnit: profile.weight_unit || 'Kgs',
                notifications: profile.notifications,
                weeklyWorkoutGoal: profile.weekly_workout_goal,
                referralCode: profile.referral_code || undefined, // Ensure it's undefined if null
              }
            });
            
            // Set referral data separately to avoid type issues
            set((state) => ({ // Use direct set for clarity
              ...state,
              completedReferralsCount: profile.completed_referrals_count || 0,
            }));
            
            console.log('✅ User data set with referral code:', profile.referral_code);
          } else {
            console.log('❌ No profile found in database');
            console.log('🔧 Creating new user profile...');
            // If no profile exists, we need to create one to trigger referral code generation
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email || '',
                name: '',
                height: 170,
                sex: 'other',
                weekly_workout_goal: 3,
                weight_unit: 'Kgs',
                notifications: {
                  workoutReminders: true,
                  progressUpdates: true,
                  newFeatures: true,
                },
                completed_referrals_count: 0,
              });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              console.error('Insert error details:', JSON.stringify(insertError, null, 2));
            } else {
              console.log('✅ User profile created successfully');
              console.log('🔄 Reloading profile data to get referral code...');
              // Reload the profile data after creation
              const { data: newProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

              console.log('📋 New profile data:', newProfile);
              console.log('📋 New profile referral_code:', newProfile?.referral_code);
              
              if (newProfile) { // Check if newProfile is not null
                console.log('✅ Setting user data from new profile');
                set({
                  userData: {
                    name: newProfile.name,
                    height: newProfile.height,
                    sex: newProfile.sex,
                    email: user.email || newProfile.email,
                    weightUnit: newProfile.weight_unit || 'Kgs',
                    notifications: newProfile.notifications,
                    weeklyWorkoutGoal: newProfile.weekly_workout_goal || 3, // Default if null
                    referralCode: newProfile.referral_code || undefined, // Ensure it's undefined if null
                  }
                });
                
                set((state) => ({ // Use direct set for clarity
                  ...state,
                  completedReferralsCount: newProfile.completed_referrals_count || 0,
                }));
                
                console.log('✅ New user data set with referral code:', newProfile.referral_code);
              } else {
                console.error('❌ Failed to reload profile after creation');
              }
            }
          }

          // Load custom exercises
          const { data: customExercises } = await supabase
            .from('custom_exercises')
            .select('*')
            .eq('user_id', user.id);

          if (customExercises) {
            set((state) => ({ // Use direct set for clarity
              customExercises: customExercises.map((ex: any) => ({ // Add type annotation for ex
                id: ex.id,
                name: ex.name,
                muscle_group: ex.muscle_group,
                equipment: ex.equipment,
                difficulty: ex.difficulty,
                isCustom: true,
              }))
            }));
          }

          // Load referral milestones
          // Skip referral milestones for now - table doesn't exist yet
          set((state) => ({ ...state, referralMilestones: [] })); // Use direct set for clarity

          // Load goals
          try {
            const { data: goals, error: goalsError } = await supabase
              .from('goals')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (goalsError) {
              console.warn('Goals table not found or accessible:', goalsError.message);
              // Set empty goals array if table doesn't exist
              set((state) => ({ ...state, goals: [] }));
            } else if (goals) {
              set((state) => ({
                ...state,
                goals: goals.map((goal: any) => ({
                  id: goal.id,
                  type: goal.type,
                  name: goal.name,
                  target_value: goal.target_value,
                  current_value: goal.current_value,
                  unit: goal.unit,
                  start_date: goal.start_date,
                  end_date: goal.end_date,
                  status: goal.status,
                  exercise_id: goal.exercise_id,
                  description: goal.description,
                  created_at: goal.created_at,
                  updated_at: goal.updated_at,
                }))
              }));
            }
          } catch (goalsError) {
            console.warn('Error loading goals (table may not exist):', goalsError);
            set((state) => ({ ...state, goals: [] }));
          }

          // Load workout programs
          const { data: programs } = await supabase
            .from('workout_programs')
            .select('*')
            .eq('user_id', user.id);

          if (programs) {
            set((state) => ({ // Use direct set for clarity
              programs: programs.map((p: any) => ({ // Add type annotation for p
                id: p.id,
                name: p.name,
                exercises: p.exercises,
              }))
            }));
          }

          // Load workout logs
          const { data: workoutLogs } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (workoutLogs) {
            set((state) => ({ // Use direct set for clarity
              workoutLogs: workoutLogs.map((log: any) => ({ // Add type annotation for log
                id: log.id,
                workoutId: log.workout_id,
                date: log.date,
                exercises: log.exercises,
              }))
            }));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          
          // Check if this is a session error and auto-logout
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as any).message;
            if (errorMessage && errorMessage.includes('Session from session_id claim in JWT does not exist')) {
              console.log('Session invalid, logging out user');
              await get().logout();
              return;
            }
          }
          
          // Also check for 403 status in the error
          if (error && typeof error === 'object' && 'status' in error && (error as any).status === 403) {
            console.log('403 error detected, logging out user');
            await get().logout();
            return;
          }
        } finally {
          set({ isLoadingData: false });
        }
      },

      setUserData: async (data) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: user.id,
             email: user.email || data.email,
              name: data.name || user.email, // Ensure name is not empty
              height: data.height,
              sex: data.sex,
              weekly_workout_goal: data.weeklyWorkoutGoal,
              weight_unit: data.weightUnit,
              notifications: data.notifications,
              referral_code: data.referralCode,
            });

          if (error) throw error;

          set({ userData: data });
        } catch (error) {
          console.error('Error updating user data:', error);
        }
      },

      addWorkoutLog: async (log) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('workout_logs')
            .insert([
              {
                id: log.id,
                user_id: user.id,
                workout_id: log.workoutId,
                date: log.date,
                exercises: log.exercises,
              }
            ]);

          if (error) throw error;

          set((state) => ({ workoutLogs: [log, ...state.workoutLogs] }));
        } catch (error) {
          console.error('Error adding workout log:', error);
        }
      },

      addProgram: async (program) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('workout_programs')
            .insert([
              {
                id: program.id,
                user_id: user.id,
                name: program.name,
                exercises: program.exercises,
              }
            ]);

          if (error) throw error;

          set((state) => ({ programs: [...state.programs, program] }));
        } catch (error) {
          console.error('Error adding program:', error);
        }
      },

      editProgram: async (program) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('workout_programs')
            .update({
              name: program.name,
              exercises: program.exercises,
            })
            .eq('id', program.id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            programs: state.programs.map((p) =>
              p.id === program.id ? program : p
            ),
          }));
        } catch (error) {
          console.error('Error editing program:', error);
        }
      },

      deleteProgram: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('workout_programs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            programs: state.programs.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting program:', error);
        }
      },

      deleteWorkoutLog: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('workout_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            workoutLogs: state.workoutLogs.filter((log) => log.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting workout log:', error);
        }
      },

      addCustomExercise: async (exercise) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('custom_exercises')
            .insert([
              {
                id: exercise.id,
                user_id: user.id,
                name: exercise.name,
                muscle_group: exercise.muscle_group,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
              }
            ]);

          if (error) throw error;

          set((state) => ({
            customExercises: [...state.customExercises, exercise],
          }));
        } catch (error) {
          console.error('Error adding custom exercise:', error);
        }
      },

      editCustomExercise: async (exercise) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('custom_exercises')
            .update({
              name: exercise.name,
              muscle_group: exercise.muscle_group,
              equipment: exercise.equipment,
              difficulty: exercise.difficulty,
            })
            .eq('id', exercise.id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            customExercises: state.customExercises.map((e) =>
              e.id === exercise.id ? exercise : e
            ),
          }));
        } catch (error) {
          console.error('Error editing custom exercise:', error);
        }
      },

      deleteCustomExercise: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('custom_exercises')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            customExercises: state.customExercises.filter((e) => e.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting custom exercise:', error);
        }
      },

      addGoal: async (goal) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('goals')
            .insert([
              {
                id: goal.id,
                user_id: user.id,
                type: goal.type,
                name: goal.name,
                target_value: goal.target_value,
                current_value: goal.current_value,
                unit: goal.unit,
                start_date: goal.start_date,
                end_date: goal.end_date,
                status: goal.status,
                exercise_id: goal.exercise_id,
                description: goal.description,
              }
            ]);

          if (error) {
            console.error('Error adding goal (table may not exist):', error);
            // Show user-friendly message
            get().showToastMessage('Goals feature requires database setup. Please contact support.');
            return;
          }

          set((state) => ({ goals: [goal, ...state.goals] }));
          get().showToastMessage('Goal created successfully!');
        } catch (error) {
          console.error('Error adding goal:', error);
          get().showToastMessage('Failed to create goal. Please try again.');
        }
      },

      editGoal: async (goal) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('goals')
            .update({
              type: goal.type,
              name: goal.name,
              target_value: goal.target_value,
              current_value: goal.current_value,
              unit: goal.unit,
              start_date: goal.start_date,
              end_date: goal.end_date,
              status: goal.status,
              exercise_id: goal.exercise_id,
              description: goal.description,
            })
            .eq('id', goal.id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error editing goal:', error);
            get().showToastMessage('Failed to update goal. Please try again.');
            return;
          }

          set((state) => ({
            goals: state.goals.map((g) =>
              g.id === goal.id ? goal : g
            ),
          }));
          get().showToastMessage('Goal updated successfully!');
        } catch (error) {
          console.error('Error editing goal:', error);
          get().showToastMessage('Failed to update goal. Please try again.');
        }
      },

      deleteGoal: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting goal:', error);
            get().showToastMessage('Failed to delete goal. Please try again.');
            return;
          }

          set((state) => ({
            goals: state.goals.filter((g) => g.id !== id),
          }));
          get().showToastMessage('Goal deleted successfully!');
        } catch (error) {
          console.error('Error deleting goal:', error);
          get().showToastMessage('Failed to delete goal. Please try again.');
        }
      },

      updateGoalProgress: async (goalId: string, newValue: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          const goal = get().goals.find(g => g.id === goalId);
          if (!goal) return;

          // Determine if goal is completed
          const isCompleted = newValue >= goal.target_value;
          const newStatus = isCompleted ? 'completed' : goal.status;

          const { error } = await supabase
            .from('goals')
            .update({
              current_value: newValue,
              status: newStatus,
            })
            .eq('id', goalId)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error updating goal progress:', error);
            get().showToastMessage('Failed to update goal progress. Please try again.');
            return;
          }

          set((state) => ({
            goals: state.goals.map((g) =>
              g.id === goalId ? { ...g, current_value: newValue, status: newStatus } : g
            ),
          }));

          // Show celebration message if goal completed
          if (isCompleted && goal.status !== 'completed') {
            get().showToastMessage(`🎉 Goal achieved: ${goal.name}!`);
          } else {
            get().showToastMessage('Goal progress updated!');
          }
        } catch (error) {
          console.error('Error updating goal progress:', error);
          get().showToastMessage('Failed to update goal progress. Please try again.');
        }
      },

      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      showToastMessage: (message: string) => {
        set({ showToast: true, toastMessage: message });
        // Auto-hide after 3 seconds
        setTimeout(() => {
          set({ showToast: false, toastMessage: '' });
        }, 3000);
      },

      hideToast: () => set({ showToast: false, toastMessage: '' }),
    }),
    {
      name: 'fitrek-storage',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  const store = useUserStore.getState();
  
  if (event === 'SIGNED_IN' && session) {
    // Only set authenticated if email is confirmed
    if (session.user.email_confirmed_at) {
      useUserStore.setState({ isAuthenticated: true });
      store.loadUserData();
    } else {
      // User signed in but email not confirmed - sign them out
      supabase.auth.signOut();
      useUserStore.setState({ isAuthenticated: false });
    }
  } else if (event === 'SIGNED_OUT') {
    useUserStore.setState({
      userData: null,
      workoutLogs: [],
      programs: [],
      customExercises: [],
      goals: [],
      referralCode: undefined, // Changed to undefined
      completedReferralsCount: 0,
      referralMilestones: [],
      isAuthenticated: false,
    });
  }
});