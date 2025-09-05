import React, { useState, useMemo } from 'react';
import { Target, Plus, Filter, TrendingUp, Calendar, Trophy, Zap, Heart, User } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { GoalForm } from '../components/GoalForm';
import { GoalCard } from '../components/GoalCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Goal } from '../types';
import exercises from '../data/fitness_exercises.json';

export function GoalsPage() {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [filterType, setFilterType] = useState<string>('all');

  const {
    goals,
    customExercises,
    isLoadingData,
    addGoal,
    editGoal,
    deleteGoal,
    updateGoalProgress,
  } = useUserStore();

  const allExercises = useMemo(() => {
    return [...exercises, ...customExercises];
  }, [customExercises]);

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const statusMatch = filterStatus === 'all' || goal.status === filterStatus;
      const typeMatch = filterType === 'all' || goal.type === filterType;
      return statusMatch && typeMatch;
    });
  }, [goals, filterStatus, filterType]);

  const goalStats = useMemo(() => {
    const active = goals.filter(g => g.status === 'active').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const overdue = goals.filter(g => 
      g.status === 'active' && 
      g.end_date && 
      new Date(g.end_date) < new Date()
    ).length;
    
    return { active, completed, overdue, total: goals.length };
  }, [goals]);

  const handleSaveGoal = (goal: Goal) => {
    if (editingGoal) {
      editGoal(goal);
    } else {
      addGoal(goal);
    }
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleCancelGoal = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return Zap;
      case 'weight_loss': return TrendingUp;
      case 'consistency': return Calendar;
      case 'endurance': return Heart;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      {showGoalForm ? (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
          </div>
          <GoalForm
            initialGoal={editingGoal || undefined}
            onSave={handleSaveGoal}
            onCancel={handleCancelGoal}
            allExercises={allExercises}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold font-poppins text-gray-900 dark:text-white">
                Your Goals
              </h2>
            </div>
            <button
              onClick={() => setShowGoalForm(true)}
              className="button-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Goal
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{goalStats.active}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{goalStats.completed}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{goalStats.overdue}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Overdue</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{goalStats.total}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Type
              </label>
              <select
                className="input-field"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="strength">Strength</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="consistency">Consistency</option>
                <option value="endurance">Endurance</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="space-y-4">
            {isLoadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonLoader key={index} variant="card" className="h-64" />
                ))}
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 text-center border border-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
                <div className="text-primary/60 dark:text-primary/50 mb-4">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
                  {goals.length === 0 ? 'Set your first goal!' : 'No goals match your filters'}
                </h3>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
                  {goals.length === 0 
                    ? 'Create SMART goals to track your fitness progress and stay motivated on your journey.'
                    : 'Try adjusting your filters to see more goals, or create a new one.'
                  }
                </p>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-body">Click "Create Goal" to get started</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGoals.map((goal) => (
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
          </div>

          {/* Goal Types Legend */}
          {goals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-elevation-1 dark:shadow-elevation-1-dark">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goal Types</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { type: 'strength', label: 'Strength', icon: Zap, description: 'Increase weight lifted' },
                  { type: 'weight_loss', label: 'Weight Loss', icon: TrendingUp, description: 'Lose body weight' },
                  { type: 'consistency', label: 'Consistency', icon: Calendar, description: 'Workout frequency' },
                  { type: 'endurance', label: 'Endurance', icon: Heart, description: 'Improve stamina' },
                  { type: 'custom', label: 'Custom', icon: Target, description: 'Custom goals' },
                ].map(({ type, label, icon: Icon, description }) => {
                  const count = goals.filter(g => g.type === type).length;
                  
                  return (
                    <div key={type} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>
                      <p className="text-xs font-bold text-primary">{count} goal{count !== 1 ? 's' : ''}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}