import React, { useState } from 'react';
import { Save, X, Target, Calendar, TrendingUp, Dumbbell, Heart, Zap, User } from 'lucide-react';
import type { Goal } from '../types';
import exercises from '../data/fitness_exercises.json';

interface GoalFormProps {
  initialGoal?: Goal;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
  allExercises: Array<{ id: number | string; name: string; }>;
}

export function GoalForm({ initialGoal, onSave, onCancel, allExercises }: GoalFormProps) {
  const [formData, setFormData] = useState({
    type: initialGoal?.type || 'strength',
    name: initialGoal?.name || '',
    target_value: initialGoal?.target_value.toString() || '',
    current_value: initialGoal?.current_value.toString() || '0',
    unit: initialGoal?.unit || 'kg',
    start_date: initialGoal?.start_date ? new Date(initialGoal.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    end_date: initialGoal?.end_date ? new Date(initialGoal.end_date).toISOString().split('T')[0] : '',
    exercise_id: initialGoal?.exercise_id || '',
    description: initialGoal?.description || '',
  });

  const goalTypes = [
    { id: 'strength', label: 'Strength', icon: Dumbbell, description: 'Increase weight lifted' },
    { id: 'weight_loss', label: 'Weight Loss', icon: TrendingUp, description: 'Lose body weight' },
    { id: 'consistency', label: 'Consistency', icon: Calendar, description: 'Workout frequency' },
    { id: 'endurance', label: 'Endurance', icon: Heart, description: 'Improve stamina' },
    { id: 'custom', label: 'Custom', icon: Target, description: 'Custom goal' },
  ];

  const units = {
    strength: ['kg', 'lbs', 'reps'],
    weight_loss: ['kg', 'lbs'],
    consistency: ['workouts', 'days'],
    endurance: ['minutes', 'km', 'miles', 'reps'],
    custom: ['kg', 'lbs', 'reps', 'minutes', 'km', 'miles', 'workouts', 'days'],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goal: Goal = {
      id: initialGoal?.id || crypto.randomUUID(),
      type: formData.type as Goal['type'],
      name: formData.name,
      target_value: Number(formData.target_value),
      current_value: Number(formData.current_value),
      unit: formData.unit,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      status: initialGoal?.status || 'active',
      exercise_id: formData.exercise_id || undefined,
      description: formData.description || undefined,
      created_at: initialGoal?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    onSave(goal);
  };

  const generateGoalName = () => {
    const type = formData.type;
    const targetValue = formData.target_value;
    const unit = formData.unit;
    const exerciseId = formData.exercise_id;
    
    if (type === 'strength' && exerciseId && targetValue) {
      const exercise = allExercises.find(e => e.id.toString() === exerciseId);
      if (exercise) {
        return `${exercise.name}: ${targetValue}${unit}`;
      }
    } else if (type === 'weight_loss' && targetValue) {
      return `Lose ${targetValue}${unit}`;
    } else if (type === 'consistency' && targetValue) {
      return `${targetValue} ${unit} per week`;
    } else if (type === 'endurance' && targetValue) {
      return `${targetValue} ${unit} endurance goal`;
    }
    
    return formData.name;
  };

  const handleAutoGenerateName = () => {
    const generatedName = generateGoalName();
    if (generatedName !== formData.name) {
      setFormData({ ...formData, name: generatedName });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Goal Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goalTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.type === type.id;
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setFormData({ 
                    ...formData, 
                    type: type.id,
                    unit: units[type.id as keyof typeof units][0] // Set default unit for type
                  });
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-elevation-2 dark:shadow-elevation-2-dark'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary/50 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                    {type.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Selection (for strength goals) */}
      {formData.type === 'strength' && (
        <div>
          <label htmlFor="exercise" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exercise (Optional)
          </label>
          <select
            id="exercise"
            className="input-field"
            value={formData.exercise_id}
            onChange={(e) => setFormData({ ...formData, exercise_id: e.target.value })}
          >
            <option value="">Select an exercise</option>
            {allExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Goal Name */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Goal Name
          </label>
          <button
            type="button"
            onClick={handleAutoGenerateName}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Auto-generate
          </button>
        </div>
        <input
          type="text"
          id="name"
          required
          className="input-field"
          placeholder="Enter goal name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Target and Current Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="target_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Value
          </label>
          <input
            type="number"
            id="target_value"
            required
            min="0"
            step="0.1"
            className="input-field"
            placeholder="100"
            value={formData.target_value}
            onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="current_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Value
          </label>
          <input
            type="number"
            id="current_value"
            required
            min="0"
            step="0.1"
            className="input-field"
            placeholder="0"
            value={formData.current_value}
            onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unit
          </label>
          <select
            id="unit"
            className="input-field"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            {units[formData.type as keyof typeof units].map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            required
            className="input-field"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Date (Optional)
          </label>
          <input
            type="date"
            id="end_date"
            className="input-field"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            min={formData.start_date}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          className="input-field resize-none"
          placeholder="Add any additional details about your goal..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="button-secondary"
        >
          <X className="w-4 h-4 inline-block mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className="button-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4 inline-block mr-2" />
          {initialGoal ? 'Update Goal' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
}