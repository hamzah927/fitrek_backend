import React, { useState } from 'react';
import { CalendarDays, Plus, Trash2, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { SkeletonLoader, Spinner } from '../components/SkeletonLoader';
import exercises from '../data/fitness_exercises.json';
import { WorkoutLog } from '../types';

export function WorkoutLogPage() {
  const navigate = useNavigate();
  const { programs, workoutLogs, addWorkoutLog, deleteWorkoutLog, customExercises, userData, isLoadingData } = useUserStore();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseData, setExerciseData] = useState<Record<number | string, { 
    numSets: number; 
    sets: { weight: string; reps: string }[] 
  }>>({});

  const allExercises = [...exercises, ...customExercises];

  const handleWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!selectedWorkout) return;

    const workout = programs.find(p => p.id === selectedWorkout);
    if (!workout) return;

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      workoutId: selectedWorkout,
      date: new Date().toISOString(),
      exercises: workout.exercises.map(exerciseId => ({
        exerciseId,
        sets: exerciseData[exerciseId]?.sets.map(set => ({
          weight: Number(set.weight || 0),
          reps: Number(set.reps || 0),
        })) || [],
      })),
    };

    addWorkoutLog(log);
    setSelectedWorkout(null);
    setExerciseData({});
    setIsSubmitting(false);
  };

  const updateExerciseSets = (exerciseId: number | string, numSets: number) => {
    setExerciseData(prev => {
      const currentData = prev[exerciseId] || { numSets: 0, sets: [] };
      const newSets = Array.from({ length: numSets }, (_, index) => 
        currentData.sets[index] || { weight: '', reps: '' }
      );
      
      return {
        ...prev,
        [exerciseId]: {
          numSets,
          sets: newSets
        }
      };
    });
  };

  const updateSetData = (exerciseId: number | string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseData(prev => {
      const currentData = prev[exerciseId] || { numSets: 0, sets: [] };
      const newSets = [...currentData.sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      
      return {
        ...prev,
        [exerciseId]: {
          ...currentData,
          sets: newSets
        }
      };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotalVolume = (sets: { weight: number; reps: number }[]) => {
    if (!Array.isArray(sets)) {
      return 0;
    }
    return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  };

  return (
    <div className="space-y-6">
      {/* Exit Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="button-icon p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-elevation-2 dark:shadow-elevation-2-dark hover:shadow-elevation-3 dark:hover:shadow-elevation-3-dark"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-gray-900 dark:text-white">
            Workout Log
          </h2>
        </div>
      </div>

      <div className="card">
        {programs.length === 0 ? (
          <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 text-center border border-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
            <div className="text-primary/60 dark:text-primary/50 mb-4">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
              No workouts available yet!
            </h3>
            <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
              Create your first workout program in the Exercises section to start logging your fitness journey.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-body">Go to Exercises → Create Custom</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!selectedWorkout ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {programs.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => setSelectedWorkout(program.id)}
                    className="button-secondary flex items-center justify-center gap-2 text-gray-900 dark:text-white text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Log {program.name}
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleWorkoutSubmit} className="space-y-6">
                <div className="grid gap-6">
                  {programs
                    .find((p) => p.id === selectedWorkout)
                    ?.exercises.map((exerciseId) => {
                      const exercise = allExercises.find((e) => e.id === exerciseId);
                      if (!exercise) return null;

                      const currentData = exerciseData[exerciseId] || { numSets: 1, sets: [{ weight: '', reps: '' }] };

                      return (
                        <div key={exercise.id} className="card bg-accent-light dark:bg-gray-700/50">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{exercise.name}</h3>
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sets:
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateExerciseSets(exercise.id, Math.max(1, currentData.numSets - 1))}
                                  className="button-icon p-1 rounded-full"
                                  disabled={currentData.numSets <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                                  {currentData.numSets}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateExerciseSets(exercise.id, Math.min(10, currentData.numSets + 1))}
                                  className="button-icon p-1 rounded-full"
                                  disabled={currentData.numSets >= 10}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {currentData.sets.map((set, setIndex) => (
                              <div key={setIndex} className="grid grid-cols-3 gap-2 sm:gap-4 items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="text-center">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Set {setIndex + 1}
                                  </label>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Weight ({userData?.weightUnit || 'Kgs'})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step={userData?.weightUnit === 'Pounds' ? "1" : "0.5"}
                                    required
                                    className="input-field"
                                    value={set.weight}
                                    onChange={(e) => updateSetData(exercise.id, setIndex, 'weight', e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reps
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    className="input-field"
                                    value={set.reps}
                                    onChange={(e) => updateSetData(exercise.id, setIndex, 'reps', e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkout(null);
                      setExerciseData({});
                    }}
                    className="button-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="button-primary flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      'Save Workout Log'
                    )}
                  </button>
                </div>
              </form>
            )}

            {workoutLogs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">History</h3>
                
                {/* Motivational Microcopy for Workout History */}
                <div className="text-center mb-4">
                  {(() => {
                    const recentLogs = workoutLogs.filter(log => {
                      const logDate = new Date(log.date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return logDate >= weekAgo;
                    });
                    
                    const totalLogs = workoutLogs.length;
                    
                    if (recentLogs.length >= 3) {
                      return (
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          🔥 You're on fire! {recentLogs.length} workouts this week!
                        </p>
                      );
                    } else if (recentLogs.length >= 2) {
                      return (
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          💪 Strong consistency! Keep the streak alive!
                        </p>
                      );
                    } else if (recentLogs.length === 1) {
                      return (
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          🌟 Great start to the week! Ready for more?
                        </p>
                      );
                    } else if (totalLogs >= 10) {
                      return (
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          📈 Look at that progress! {totalLogs} workouts logged!
                        </p>
                      );
                    } else if (totalLogs >= 5) {
                      return (
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          🎯 Building momentum! {totalLogs} workouts and counting!
                        </p>
                      );
                    } else if (totalLogs > 0) {
                      return (
                        <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                          🚀 Every journey starts with a single step!
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {isLoadingData ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <SkeletonLoader key={index} variant="card" className="h-32" />
                    ))}
                  </div>
                ) : (
                  workoutLogs.length === 0 ? (
                    <div className="bg-gradient-to-br from-secondary/5 to-violet-50/50 dark:from-secondary/10 dark:to-violet-900/20 rounded-2xl p-6 sm:p-8 text-center border border-secondary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
                      <div className="text-secondary/60 dark:text-secondary/50 mb-4">
                        <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
                        No workout history yet!
                      </h3>
                      <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
                        Start logging your workouts to track your progress and see your fitness journey unfold.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-secondary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-body">Log your first workout above!</span>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {workoutLogs
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((log) => {
                        const program = programs.find((p) => p.id === log.workoutId);
                        if (!program) return null;

                      return (
                        <div key={log.id} className="card bg-accent-light dark:bg-gray-700/50">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{program.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(log.date)}</p>
                            </div>
                            <button
                              onClick={() => deleteWorkoutLog(log.id)}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-soft hover:shadow-medium active:shadow-soft"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            {log.exercises.map((exercise) => {
                              const exerciseDetails = allExercises.find(
                                (e) => e.id === exercise.exerciseId
                              );
                              if (!exerciseDetails) return null;

                              const exerciseSets = Array.isArray(exercise.sets) ? exercise.sets : [];
                              const totalVolume = calculateTotalVolume(exerciseSets);

                              return (
                                <div
                                  key={exercise.exerciseId}
                                  className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg"
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <h5 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                                      {exerciseDetails.name}
                                    </h5>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Total Volume: {totalVolume} {userData?.weightUnit || 'Kgs'}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {exerciseSets.map((set, setIndex) => (
                                      <div
                                        key={setIndex}
                                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm"
                                      >
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                          Set {setIndex + 1}:
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {set.weight}{userData?.weightUnit || 'Kgs'} × {set.reps} reps
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}