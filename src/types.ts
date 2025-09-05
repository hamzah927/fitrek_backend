export interface UserData {
  name: string;
  height: number;
  sex: 'male' | 'female' | 'other';
  email: string;
  weightUnit: 'Kgs' | 'Pounds';
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    newFeatures: boolean;
  };
  paymentMethod?: {
    type: 'card' | 'paypal';
    last4?: string;
    expiryDate?: string;
  };
  weeklyWorkoutGoal: number;
  referralCode?: string;
  referralCode?: string;
}

export interface Exercise {
  id: number | string;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  isCustom?: boolean;
}

export interface CustomExercise extends Exercise {
  id: string;
  isCustom: true;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  date: string;
  exercises: {
    exerciseId: number | string;
    sets: {
      weight: number;
      reps: number;
    }[];
  }[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  exercises: (number | string)[];
}

export interface Goal {
  id: string;
  type: 'strength' | 'weight_loss' | 'consistency' | 'endurance' | 'custom';
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'failed' | 'archived';
  exercise_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}