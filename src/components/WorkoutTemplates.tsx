import React, { useState } from 'react';
import { ArrowLeft, Clock, Calendar, Target, Users, CheckCircle2, Plus } from 'lucide-react';
import type { WorkoutProgram, Exercise } from '../types';
import workoutTemplates from '../data/workoutTemplates.json';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: string;
  frequency: string;
  workouts: {
    name: string;
    exercises: number[];
    sets?: number[];
    notes?: string;
  }[];
}

interface WorkoutTemplatesProps {
  onSelectTemplate: (programs: WorkoutProgram[]) => void;
  onBack: () => void;
  allExercises: Exercise[];
}

export function WorkoutTemplates({ onSelectTemplate, onBack, allExercises }: WorkoutTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    const programs: WorkoutProgram[] = template.workouts.map(workout => ({
      id: crypto.randomUUID(),
      name: workout.name,
      exercises: workout.exercises,
    }));

    onSelectTemplate(programs);
  };

  const getExercisesByIds = (exerciseIds: number[]) => {
    return exerciseIds
      .map(id => allExercises.find(ex => ex.id === id))
      .filter(Boolean) as Exercise[];
  };

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedTemplate(null)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h3 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">
              {selectedTemplate.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedTemplate.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</span>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedTemplate.difficulty)}`}>
              {selectedTemplate.difficulty}
            </span>
          </div>

          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</span>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">{selectedTemplate.duration}</p>
          </div>

          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</span>
            </div>
            <p className="text-gray-900 dark:text-white font-medium">{selectedTemplate.frequency}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-lg font-semibold font-poppins text-gray-900 dark:text-white">
            Workout Programs ({selectedTemplate.workouts.length})
          </h4>
          
          <div className="grid grid-cols-1 gap-6">
            {selectedTemplate.workouts.map((workout, index) => {
              const exercises = getExercisesByIds(workout.exercises);
              
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
                  <h5 className="text-lg sm:text-xl font-bold font-poppins text-gray-900 dark:text-white mb-4">
                    {workout.name}
                  </h5>
                  
                  <div className="space-y-3">
                    {exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2 sm:gap-3">
                        <div>
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{exercise.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{exercise.muscle_group}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {workout.sets && workout.sets[exerciseIndex] && (
                            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                              {workout.sets[exerciseIndex]} sets
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {workout.notes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Notes:</span> {workout.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{exercises.length} exercises</span> • 
                      <span className="ml-1">
                        {exercises.map(ex => ex.muscle_group).filter((group, index, arr) => arr.indexOf(group) === index).length} muscle groups
                      </span>
                      {workout.sets && (
                        <span className="ml-1">
                          • {workout.sets.reduce((total, sets) => total + sets, 0)} total sets
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTemplate(null)}
            className="button-secondary text-center"
          >
            Back to Templates
          </button>
          <button
            onClick={() => handleSelectTemplate(selectedTemplate)}
            className="button-primary flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Use This Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h3 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">
            Workout Templates
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Choose from professionally designed workout programs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {workoutTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-lg sm:text-xl font-bold font-poppins text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                {template.name}
              </h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {template.description}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 text-primary" />
                <span>{template.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{template.frequency}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4 text-primary" />
                <span>{template.workouts.length} workout programs</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {template.workouts.reduce((total, workout) => total + workout.exercises.length, 0)} total exercises
              </div>
              <div className="flex items-center gap-2 text-primary group-hover:text-primary/80 transition-colors">
                <span className="text-sm font-medium">View Details</span>
                <Plus className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}