import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Check, Copy } from 'lucide-react';
import type { WorkoutProgram } from '../types';
import { useUserStore } from '../store/userStore';

interface WorkoutQRCodeProps {
  workout: WorkoutProgram;
}

export function WorkoutQRCode({ workout }: WorkoutQRCodeProps) {
  const { customExercises } = useUserStore();
  const allExercises = [...exercises, ...customExercises];
  const [copied, setCopied] = useState(false);

  const workoutExercises = allExercises.filter((exercise) =>
    workout.exercises.includes(exercise.id)
  );

  const workoutData = {
    name: workout.name,
    exercises: workoutExercises.map(exercise => ({
      name: exercise.name,
      muscleGroup: exercise.muscle_group,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty
    }))
  };

  const shareUrl = `${window.location.origin}/share?workout=${encodeURIComponent(JSON.stringify(workoutData))}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-gray-900">Share Workout</h3>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <QRCodeSVG
            value={shareUrl}
            size={200}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "/vite.svg",
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        </div>
        
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Share Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}