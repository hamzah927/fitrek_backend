import React from 'react';
import { Target, Calendar, TrendingUp, CheckCircle, Clock, Pencil, Trash2, Trophy, Zap } from 'lucide-react';
import type { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (goalId: string, newValue: number) => void;
}

export function GoalCard({ goal, onEdit, onDelete, onUpdateProgress }: GoalCardProps) {
  const progressPercentage = Math.min(100, (goal.current_value / goal.target_value) * 100);
  const isCompleted = goal.status === 'completed';
  const isOverdue = goal.end_date && new Date(goal.end_date) < new Date() && !isCompleted;
  
  const daysRemaining = goal.end_date 
    ? Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return Zap;
      case 'weight_loss': return TrendingUp;
      case 'consistency': return Calendar;
      case 'endurance': return Target;
      default: return Target;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'text-blue-500';
      case 'weight_loss': return 'text-green-500';
      case 'consistency': return 'text-purple-500';
      case 'endurance': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'archived': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const TypeIcon = getTypeIcon(goal.type);

  const handleQuickUpdate = () => {
    const newValue = prompt(
      `Update progress for "${goal.name}"\nCurrent: ${goal.current_value}${goal.unit}\nTarget: ${goal.target_value}${goal.unit}\n\nEnter new value:`,
      goal.current_value.toString()
    );
    
    if (newValue !== null && !isNaN(Number(newValue))) {
      onUpdateProgress(goal.id, Number(newValue));
    }
  };

  return (
    <div className={`card hover:shadow-elevation-3 dark:hover:shadow-elevation-3-dark transition-all duration-300 hover:scale-[1.02] ${
      isCompleted ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
      isOverdue ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
      'hover:bg-accent-light dark:hover:bg-gray-700/50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCompleted ? 'bg-green-500' : 'bg-primary'
          } shadow-elevation-2 dark:shadow-elevation-2-dark`}>
            {isCompleted ? (
              <Trophy className="w-5 h-5 text-white" />
            ) : (
              <TypeIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
              {goal.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {goal.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        {!isCompleted && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(goal)}
              className="button-icon p-2 rounded-full"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 text-gray-500 hover:text-red-500 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-elevation-2 dark:shadow-elevation-2-dark hover:shadow-elevation-3 dark:hover:shadow-elevation-3-dark"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {goal.current_value}{goal.unit} / {goal.target_value}{goal.unit}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-primary to-secondary'
            }`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {progressPercentage.toFixed(1)}% complete
          </span>
          {!isCompleted && (
            <button
              onClick={handleQuickUpdate}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Update Progress
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {goal.end_date && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Calendar className="w-4 h-4" />
          {isOverdue ? (
            <span className="text-red-600 dark:text-red-400 font-medium">
              Overdue by {Math.abs(daysRemaining!)} days
            </span>
          ) : daysRemaining !== null ? (
            <span>
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Due today'}
            </span>
          ) : null}
        </div>
      )}

      {/* Description */}
      {goal.description && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {goal.description}
          </p>
        </div>
      )}

      {/* Completion Badge */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">Goal Achieved!</span>
          </div>
          <p className="text-sm mt-1 opacity-90">
            Completed on {new Date(goal.updated_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}