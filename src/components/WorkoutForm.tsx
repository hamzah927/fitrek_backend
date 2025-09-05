import React, { useState, useMemo } from 'react';
import { X, Save, Search } from 'lucide-react';
import type { WorkoutProgram, Exercise } from '../types';

interface WorkoutFormProps {
  initialWorkout?: WorkoutProgram;
  onSave: (workout: WorkoutProgram) => void;
  onCancel: () => void;
  allExercises: Exercise[];
}

export function WorkoutForm({ initialWorkout, onSave, onCancel, allExercises }: WorkoutFormProps) {
  const [name, setName] = useState(initialWorkout?.name || '');
  const [selectedExercises, setSelectedExercises] = useState<(number | string)[]>(
    initialWorkout?.exercises || []
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return allExercises;

    return allExercises.filter((exercise) => 
      exercise.name.toLowerCase().includes(query) ||
      exercise.muscle_group.toLowerCase().includes(query) ||
      exercise.equipment.toLowerCase().includes(query) ||
      exercise.difficulty.toLowerCase().includes(query)
    );
  }, [searchQuery, allExercises]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const workout: WorkoutProgram = {
      id: initialWorkout?.id || crypto.randomUUID(),
      name,
      exercises: selectedExercises,
    };
    onSave(workout);
  };

  const toggleExercise = (exerciseId: number | string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="workoutName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Workout Name
        </label>
        <input
          type="text"
          id="workoutName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field bg-white"
          required
          placeholder="Enter workout name..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Exercises</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search exercises by name, muscle group, equipment, or difficulty..."
            className="input-field pl-11 bg-white dark:bg-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Selected Exercises Summary */}
        {selectedExercises.length > 0 && (
          <div className="mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Selected Exercises:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedExercises.map((exerciseId) => {
                const exercise = allExercises.find(e => e.id === exerciseId);
                if (!exercise) return null;
                return (
                  <span
                    key={exerciseId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm"
                  >
                    {exercise.name}
                    <button
                      type="button"
                      onClick={() => toggleExercise(exerciseId)}
                      className="ml-1 hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Exercise Grid */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
          {filteredExercises.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No exercises found matching your search</p>
              <p className="text-sm mt-1">Try different keywords or clear the search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                    selectedExercises.includes(exercise.id)
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary/50 bg-white dark:bg-gray-700'
                  }`}
                  onClick={() => toggleExercise(exercise.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExercises.includes(exercise.id)}
                      onChange={() => toggleExercise(exercise.id)}
                      className="h-4 w-4 text-primary rounded focus:ring-primary mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{exercise.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{exercise.muscle_group}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                          {exercise.equipment}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          exercise.difficulty === 'Beginner' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : exercise.difficulty === 'Intermediate'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : exercise.difficulty === 'Advanced'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {searchQuery && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredExercises.length} of {allExercises.length} exercises
          </div>
        )}
      </div>

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
          disabled={selectedExercises.length === 0}
        >
          <Save className="w-4 h-4 inline-block mr-2" />
          Save Workout
        </button>
      </div>
    </form>
  );
}