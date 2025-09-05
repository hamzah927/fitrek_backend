import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  Clock, 
  Flame, 
  Zap, 
  Trophy, 
  ChevronRight, 
  Bell, 
  X, 
  BarChart3,
  Dumbbell,
  Bot,
  Crown,
  Gift,
  CheckCircle,
  AlertTriangle,
  Users,
  Activity,
  Plus,
  Save
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { WeightProgressionGraph } from '../components/WeightProgressionGraph';
import { RepsProgressionGraph } from '../components/RepsProgressionGraph';
import { WorkoutReportModal } from '../components/WorkoutReportModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { GoalForm } from '../components/GoalForm';
import { GoalCard } from '../components/GoalCard';
import type { Goal } from '../types';
import exercises from '../data/fitness_exercises.json';

export function HomePage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<{
    personalRecords: boolean;
    awayMessage: boolean;
    streak: boolean;
    weeklyReport: boolean;
  }>({
    personalRecords: false,
    awayMessage: false,
    streak: false,
    weeklyReport: false,
  });
  const [showWorkoutReport, setShowWorkoutReport] = useState(false);

  const { 
    userData, 
    workoutLogs, 
    programs, 
    customExercises, 
    isLoadingData,
    goals,
    addGoal,
    editGoal,
    deleteGoal,
    updateGoalProgress
  } = useUserStore();

  const allExercises = useMemo(() => {
    return [...exercises, ...customExercises];
  }, [customExercises]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    const weeklyLogs = workoutLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek;
    });

    const totalWorkouts = weeklyLogs.length;
    const totalVolume = weeklyLogs.reduce((total, log) => {
      return total + log.exercises.reduce((logTotal, exercise) => {
        return logTotal + exercise.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);
    }, 0);

    const uniqueExercises = new Set();
    weeklyLogs.forEach(log => {
      log.exercises.forEach(ex => uniqueExercises.add(ex.exerciseId));
    });

    // Calculate consistency based on weekly workout goal
    const weeklyGoal = userData?.weeklyWorkoutGoal || 3;
    const consistencyPercentage = Math.min(100, Math.round((totalWorkouts / weeklyGoal) * 100));

    return {
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      uniqueExercises: uniqueExercises.size,
      consistencyPercentage,
      startDate: startOfWeek,
      endDate: now,
      logs: weeklyLogs,
    };
  }, [workoutLogs, userData]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    if (workoutLogs.length === 0) return 0;
    
    const sortedLogs = [...workoutLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [workoutLogs]);

  // Check for personal records in recent workouts
  const recentPersonalRecords = useMemo(() => {
    if (workoutLogs.length < 2) return [];
    
    const recentLogs = workoutLogs.slice(0, 3); // Last 3 workouts
    const records: string[] = [];
    
    recentLogs.forEach(log => {
      log.exercises.forEach(exercise => {
        const exerciseDetails = allExercises.find(e => e.id === exercise.exerciseId);
        if (!exerciseDetails || !exercise.sets || exercise.sets.length === 0) return;

        const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0));
        if (maxWeight === 0) return;

        // Check against historical data
        const olderLogs = workoutLogs.filter(oldLog => 
          new Date(oldLog.date) < new Date(log.date)
        );
        
        let historicalMax = 0;
        olderLogs.forEach(oldLog => {
          const oldExercise = oldLog.exercises.find(ex => ex.exerciseId === exercise.exerciseId);
          if (oldExercise && oldExercise.sets && oldExercise.sets.length > 0) {
            const oldMax = Math.max(...oldExercise.sets.map(set => set.weight || 0));
            historicalMax = Math.max(historicalMax, oldMax);
          }
        });

        const threshold = userData?.weightUnit === 'Pounds' ? 2.5 : 1.25;
        if (historicalMax > 0 && maxWeight > historicalMax + threshold) {
          if (!records.includes(exerciseDetails.name)) {
            records.push(exerciseDetails.name);
          }
        }
      });
    });
    
    return records;
  }, [workoutLogs, allExercises, userData]);

  const dismissNotification = (type: keyof typeof dismissedNotifications) => {
    setDismissedNotifications(prev => ({ ...prev, [type]: true }));
  };

  const getMotivationalMessage = () => {
    const { totalWorkouts } = weeklyStats;
    const goal = userData?.weeklyWorkoutGoal || 3;
    
    if (totalWorkouts >= goal) {
      return {
        icon: Trophy,
        color: 'text-yellow-500',
        bgColor: 'from-yellow-50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/10',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        title: 'Goal Achieved! 🎉',
        message: `You've completed ${totalWorkouts} workouts this week, exceeding your goal of ${goal}!`
      };
    } else if (totalWorkouts > 0) {
      return {
        icon: Zap,
        color: 'text-blue-500',
        bgColor: 'from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10',
        borderColor: 'border-blue-200 dark:border-blue-800',
        title: 'Keep Going! 💪',
        message: `${totalWorkouts} of ${goal} workouts completed. You're ${goal - totalWorkouts} workout${goal - totalWorkouts !== 1 ? 's' : ''} away from your weekly goal!`
      };
    } else {
      return {
        icon: Target,
        color: 'text-purple-500',
        bgColor: 'from-purple-50 to-violet-50/50 dark:from-purple-900/20 dark:to-violet-900/10',
        borderColor: 'border-purple-200 dark:border-purple-800',
        title: 'Ready to Start? 🚀',
        message: `Your weekly goal is ${goal} workouts. Let's get started on your fitness journey!`
      };
    }
  };

  const motivationalData = getMotivationalMessage();
  const MotivationalIcon = motivationalData.icon;

  const handleSaveGoal = (goal: Goal) => {
    if (editingGoal) {
      editGoal(goal);
    } else {
      addGoal(goal);
    }
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleCancelGoal = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        {/* Motivational Card */}
        <div className={`bg-gradient-to-br ${motivationalData.bgColor} rounded-2xl p-6 border ${motivationalData.borderColor} shadow-elevation-1 dark:shadow-elevation-1-dark mb-8`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
              <MotivationalIcon className={`w-6 h-6 ${motivationalData.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {motivationalData.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {motivationalData.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Dashboard Card */}
      <div className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-elevation-2 dark:shadow-elevation-2-dark border border-white/30 dark:border-gray-700/50 p-6 sm:p-8 mb-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
              Welcome Back!
            </h2>
            
            <button
              onClick={() => setShowWorkoutReport(true)}
              className="button-primary flex items-center justify-center gap-3 mx-auto px-6 py-3 hover:scale-105 active:scale-95 transition-all duration-300 mt-36"
            >
              <BarChart3 className="w-5 h-5" />
              Generate Workout Report
            </button>
          </div>

          {/* Stats Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 text-center">
              Your Weekly Progress
            </h3>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center border border-primary/20">
                <div className="flex items-center justify-center mb-2">
                  <Dumbbell className="w-5 h-5 text-primary mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</span>
                </div>
                <p className="text-2xl font-bold text-primary">{weeklyStats.totalWorkouts}</p>
              </div>
              
              <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl p-4 text-center border border-secondary/20">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-secondary mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Volume ({userData?.weightUnit})</span>
                </div>
                <p className="text-2xl font-bold text-secondary">{weeklyStats.totalVolume}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Day Streak</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{currentStreak}</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-xl p-4 text-center border border-orange-500/20">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Exercises</span>
                </div>
                <p className="text-2xl font-bold text-orange-500">{weeklyStats.uniqueExercises}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Card */}
      <div className={`bg-gradient-to-br ${motivationalData.bgColor} rounded-2xl p-6 border ${motivationalData.borderColor} shadow-elevation-1 dark:shadow-elevation-1-dark`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
            <MotivationalIcon className={`w-6 h-6 ${motivationalData.color}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {motivationalData.title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {motivationalData.message}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/ai-assistant')}
          className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 rounded-2xl p-6 text-center border-2 border-primary/30 dark:border-primary/40 hover:border-primary/50 dark:hover:border-primary/60 shadow-elevation-3 dark:shadow-elevation-3-dark hover:shadow-elevation-4 dark:hover:shadow-elevation-4-dark transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-gradient-to-br hover:from-primary/15 hover:to-primary/25 dark:hover:from-primary/25 dark:hover:to-primary/35 ripple-effect"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevation-2 dark:shadow-elevation-2-dark">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">AI Coach</h4>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Get instant fitness guidance</p>
        </button>
        
        <button
          onClick={() => navigate('/workout-log')}
          className="bg-gradient-to-br from-secondary/10 to-secondary/20 dark:from-secondary/20 dark:to-secondary/30 rounded-2xl p-6 text-center border-2 border-secondary/30 dark:border-secondary/40 hover:border-secondary/50 dark:hover:border-secondary/60 shadow-elevation-3 dark:shadow-elevation-3-dark hover:shadow-elevation-4 dark:hover:shadow-elevation-4-dark transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-gradient-to-br hover:from-secondary/15 hover:to-secondary/25 dark:hover:from-secondary/25 dark:hover:to-secondary/35 ripple-effect"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-secondary to-secondary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevation-2 dark:shadow-elevation-2-dark">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Log Workout</h4>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Track your progress</p>
        </button>
        
        <button
          onClick={() => navigate('/subscriptions')}
          className="bg-gradient-to-br from-green-500/10 to-green-500/20 dark:from-green-500/20 dark:to-green-500/30 rounded-2xl p-6 text-center border-2 border-green-500/30 dark:border-green-500/40 hover:border-green-500/50 dark:hover:border-green-500/60 shadow-elevation-3 dark:shadow-elevation-3-dark hover:shadow-elevation-4 dark:hover:shadow-elevation-4-dark transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-gradient-to-br hover:from-green-500/15 hover:to-green-500/25 dark:hover:from-green-500/25 dark:hover:to-green-500/35 ripple-effect"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevation-2 dark:shadow-elevation-2-dark">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Go Pro</h4>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Unlock premium features</p>
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        {/* Personal Records Notification */}
        {recentPersonalRecords.length > 0 && !dismissedNotifications.personalRecords && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-2xl p-4 sm:p-6 border border-green-200 dark:border-green-800 shadow-elevation-1 dark:shadow-elevation-1-dark animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 dark:text-green-200 mb-1">
                    New Personal Records! 🎉
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                    You've achieved new PRs in: {recentPersonalRecords.join(', ')}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Keep pushing your limits!
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissNotification('personalRecords')}
                className="p-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <X className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            </div>
          </div>
        )}

        {/* Streak Notification */}
        {currentStreak >= 3 && !dismissedNotifications.streak && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/10 rounded-2xl p-4 sm:p-6 border border-orange-200 dark:border-orange-800 shadow-elevation-1 dark:shadow-elevation-1-dark animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-1">
                    You're on Fire! 🔥
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                    {currentStreak} day workout streak! Don't break the chain.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Consistency is the key to success!
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissNotification('streak')}
                className="p-1 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
              >
                <X className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </button>
            </div>
          </div>
        )}

        {/* Weekly Report Notification */}
      </div>

      {/* Progress Charts */}
      <div className="space-y-6">
        {/* Goals Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
                Your Goals
              </h2>
            </div>
            <button
              onClick={() => setShowGoalForm(true)}
              className="button-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Goal
            </button>
          </div>

          {showGoalForm ? (
            <GoalForm
              initialGoal={editingGoal || undefined}
              onSave={handleSaveGoal}
              onCancel={handleCancelGoal}
              allExercises={allExercises}
            />
          ) : (
            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 text-center border border-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
                  <div className="text-primary/60 dark:text-primary/50 mb-4">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
                    Set your first goal!
                  </h3>
                  <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
                    Create SMART goals to track your fitness progress and stay motivated on your journey.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-body">Click "Add Goal" to get started</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.slice(0, 3).map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={deleteGoal}
                      onUpdateProgress={updateGoalProgress}
                    />
                  ))}
                </div>
              )}
              
              {goals.length > 3 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing 3 of {goals.length} goals
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
              Weight Progression
            </h2>
          </div>
          <WeightProgressionGraph 
            workoutLogs={workoutLogs} 
            programs={programs} 
            exercises={allExercises} 
          />
        </div>
      </div>

      {/* Workout Report Modal */}
      <WorkoutReportModal
        isOpen={showWorkoutReport}
        onClose={() => setShowWorkoutReport(false)}
        workoutLogs={workoutLogs}
        programs={programs}
        allExercises={allExercises}
        userData={userData}
      />
    </div>
  );
}