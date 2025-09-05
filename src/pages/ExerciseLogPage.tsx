import React, { useState, useMemo } from 'react';
import { Dumbbell, Search, Plus, Filter, PlusCircle, Pencil, Trash2, User, Users, Zap, Mountain, Flame, Activity } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { WorkoutForm } from '../components/WorkoutForm';
import { WorkoutCard } from '../components/WorkoutCard';
import { CustomExerciseForm } from '../components/CustomExerciseForm';
import { WorkoutTemplates } from '../components/WorkoutTemplates';
import { WorkoutCardSkeleton, ExerciseCardSkeleton, SkeletonLoader } from '../components/SkeletonLoader';
import type { WorkoutProgram, CustomExercise } from '../types';
import exercises from '../data/fitness_exercises.json';

export function ExerciseLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showWorkoutTemplates, setShowWorkoutTemplates] = useState(false);
  const [showCustomExerciseForm, setShowCustomExerciseForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutProgram | null>(null);
  const [editingCustomExercise, setEditingCustomExercise] = useState<CustomExercise | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const {
    programs,
    customExercises,
    isLoadingData,
    addProgram,
    editProgram,
    deleteProgram,
    addCustomExercise,
    editCustomExercise,
    deleteCustomExercise,
  } = useUserStore();

  const allExercises = useMemo(() => {
    return [...exercises, ...customExercises];
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = allExercises;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(exercise => exercise.muscle_group === selectedFilter);
    }

    if (!query) return filtered;

    return filtered.filter((exercise) => 
      exercise.name.toLowerCase().includes(query) ||
      exercise.muscle_group.toLowerCase().includes(query) ||
      exercise.equipment.toLowerCase().includes(query) ||
      exercise.difficulty.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedFilter, allExercises]);

  const muscleGroups = useMemo(() => {
    const groups = new Set([
      ...exercises.map(ex => ex.muscle_group),
      ...customExercises.map(ex => ex.muscle_group)
    ]);
    return Array.from(groups);
  }, [customExercises]);

  const getMuscleGroupIcon = (muscleGroup: string) => {
    switch (muscleGroup.toLowerCase()) {
      case 'chest':
        return User; // Represents chest/torso area
      case 'back':
        return Users; // Represents back muscles/broader back
      case 'legs':
        return Activity; // Represents leg movement/activity
      case 'shoulders':
        return Mountain;
      case 'arms':
        return Zap;
      default:
        return Dumbbell;
    }
  };
  const handleSaveWorkout = (workout: WorkoutProgram) => {
    if (editingWorkout) {
      editProgram(workout);
    } else {
      addProgram(workout);
    }
    setShowWorkoutForm(false);
    setEditingWorkout(null);
  };

  const handleEditWorkout = (workout: WorkoutProgram) => {
    setEditingWorkout(workout);
    setShowWorkoutForm(true);
  };

  const handleCancelWorkout = () => {
    setShowWorkoutForm(false);
    setShowWorkoutTemplates(false);
    setEditingWorkout(null);
  };

  const handleSaveCustomExercise = (exercise: CustomExercise) => {
    if (editingCustomExercise) {
      editCustomExercise(exercise);
    } else {
      addCustomExercise(exercise);
    }
    setShowCustomExerciseForm(false);
    setEditingCustomExercise(null);
  };

  const handleEditCustomExercise = (exercise: CustomExercise) => {
    setEditingCustomExercise(exercise);
    setShowCustomExerciseForm(true);
  };

  const handleDeleteCustomExercise = (id: string) => {
    deleteCustomExercise(id);
  };

  const handleSelectTemplate = (programs: WorkoutProgram[]) => {
    // Add all programs from the template
    programs.forEach(program => {
      addProgram(program);
    });
    setShowWorkoutTemplates(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Custom': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {showWorkoutTemplates ? (
        <div className="card">
          <WorkoutTemplates
            onSelectTemplate={handleSelectTemplate}
            onBack={() => setShowWorkoutTemplates(false)}
            allExercises={allExercises}
          />
        </div>
      ) : showWorkoutForm ? (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Dumbbell className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
              {editingWorkout ? 'Edit Workout' : 'Create New Workout'}
            </h2>
          </div>
          <WorkoutForm
            initialWorkout={editingWorkout || undefined}
            onSave={handleSaveWorkout}
            onCancel={handleCancelWorkout}
            allExercises={allExercises}
          />
        </div>
      ) : showCustomExerciseForm ? (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <PlusCircle className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
              {editingCustomExercise ? 'Edit Custom Exercise' : 'Create Custom Exercise'}
            </h2>
          </div>
          <CustomExerciseForm
            initialExercise={editingCustomExercise || undefined}
            onSave={handleSaveCustomExercise}
            onCancel={() => {
              setShowCustomExerciseForm(false);
              setEditingCustomExercise(null);
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold font-poppins text-gray-900 dark:text-white">
                Exercises
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => setShowCustomExerciseForm(true)}
                className="button-primary flex items-center flex-1 sm:flex-none justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Create Exercise</span>
                <span className="sm:hidden">Exercise</span>
              </button>
              <button
                onClick={() => setShowWorkoutTemplates(true)}
                className="button-primary flex items-center flex-1 sm:flex-none justify-center gap-2"
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Workout Templates</span>
                <span className="sm:hidden">Templates</span>
              </button>
              <button
                onClick={() => setShowWorkoutForm(true)}
                className="button-primary flex items-center flex-1 sm:flex-none justify-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Create Workout</span>
                <span className="sm:hidden">Workout</span>
              </button>
            </div>
          </div>

          {programs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-bold font-poppins text-gray-900 dark:text-white">Your Workouts</h3>
              {isLoadingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <WorkoutCardSkeleton />
                  <WorkoutCardSkeleton />
                </div>
              ) : (
                programs.length === 0 ? (
                  <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 text-center border border-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
                    <div className="text-primary/60 dark:text-primary/50 mb-4">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
                      Ready to build your first workout?
                    </h3>
                    <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
                      Create custom workouts or choose from our professionally designed templates to get started.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-body">Tap "Create Custom" or "Workout Templates" above</span>
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {programs.map((program) => (
                    <WorkoutCard
                      key={program.id}
                      workout={program}
                      onEdit={handleEditWorkout}
                      onDelete={deleteProgram}
                      allExercises={allExercises}
                    />
                  ))}
                </div>
                )
              )}
            </div>
          )}

          <div className="card">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    className="input-field pl-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative sm:max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <select
                    className="input-field pl-11 pr-8 appearance-none bg-primary text-white hover:bg-primary/90 transition-colors"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                  >
                    <option value="all">All Muscle Groups</option>
                    {muscleGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>

              {muscleGroups.map(group => {
                const groupExercises = filteredExercises.filter(ex => ex.muscle_group === group);
                if (selectedFilter !== 'all' && group !== selectedFilter) return null;
                if (groupExercises.length === 0) return null;

                const MuscleGroupIcon = getMuscleGroupIcon(group);
                return (
                  <div key={group} className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold font-poppins text-gray-900 dark:text-white">
                      {group}
                    </h3>
                    {isLoadingData ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <ExerciseCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupExercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-3 sm:p-4 hover:border-primary/20"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                                {exercise.name}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                                {exercise.difficulty}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-xs sm:text-sm">Equipment:</span>
                                <span className="ml-2">{exercise.equipment}</span>
                              </div>
                              {exercise.isCustom && (
                                <div className="flex justify-end gap-2 mt-4">
                                  <button
                                    onClick={() => handleEditCustomExercise(exercise as CustomExercise)}
                                    className="button-icon p-1.5 rounded-full"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomExercise(exercise.id as string)}
                                    className="p-1.5 text-gray-500 hover:text-red-500 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-soft hover:shadow-medium active:shadow-soft"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredExercises.length === 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 rounded-2xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-600 shadow-elevation-1 dark:shadow-elevation-1-dark">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
                    No exercises found
                  </h3>
                  <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
                    Try adjusting your search terms or filter to find the exercises you're looking for.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-body">Clear search or try "Create Exercise"</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}