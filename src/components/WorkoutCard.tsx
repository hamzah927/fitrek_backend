import React from 'react';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';
import type { WorkoutProgram, Exercise } from '../types';

interface WorkoutCardProps {
  workout: WorkoutProgram;
  onEdit: (workout: WorkoutProgram) => void;
  onDelete: (id: string) => void;
  allExercises: Exercise[];
}

export function WorkoutCard({ workout, onEdit, onDelete, allExercises }: WorkoutCardProps) {
  const workoutExercises = allExercises.filter((exercise) =>
    workout.exercises.includes(exercise.id)
  );

  return (
    <div className="card hover:bg-accent-light dark:hover:bg-gray-700/50 group transition-all duration-300 hover:scale-[1.02] animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-primary">
          {workout.name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(workout)}
            className="button-icon p-2 rounded-full ripple-effect"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(workout.id)}
            className="p-2 text-gray-500 hover:text-red-500 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-soft hover:shadow-medium active:shadow-soft ripple-effect"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {workoutExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 group-hover:bg-white/80 dark:group-hover:bg-gray-700/80"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{exercise.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{exercise.muscle_group}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        ))}
      </div>
    </div>
  );
}