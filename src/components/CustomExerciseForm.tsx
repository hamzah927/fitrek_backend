import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { CustomExercise } from '../types';

interface CustomExerciseFormProps {
  initialExercise?: CustomExercise;
  onSave: (exercise: CustomExercise) => void;
  onCancel: () => void;
}

export function CustomExerciseForm({ initialExercise, onSave, onCancel }: CustomExerciseFormProps) {
  const [formData, setFormData] = useState({
    name: initialExercise?.name || '',
    muscle_group: initialExercise?.muscle_group || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const exercise: CustomExercise = {
      id: initialExercise?.id || crypto.randomUUID(),
      name: formData.name,
      muscle_group: formData.muscle_group,
      equipment: 'Custom',
      difficulty: 'Custom',
      isCustom: true,
    };
    onSave(exercise);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exercise Name
          </label>
          <input
            type="text"
            id="exerciseName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field bg-white"
            required
            placeholder="Enter exercise name..."
          />
        </div>

        <div>
          <label htmlFor="muscleGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Muscle Group
          </label>
          <input
            type="text"
            id="muscleGroup"
            value={formData.muscle_group}
            onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
            className="input-field bg-white"
            required
            placeholder="Enter target muscle group..."
          />
        </div>
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
        >
          <Save className="w-4 h-4 inline-block mr-2" />
          {initialExercise ? 'Update Exercise' : 'Create Exercise'}
        </button>
      </div>
    </form>
  );
}