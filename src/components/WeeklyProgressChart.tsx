import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useUserStore } from '../store/userStore';
import type { WorkoutLog, Exercise } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WeeklyProgressChartProps {
  weeklyLogs: WorkoutLog[];
  allExercises: Exercise[];
}

export function WeeklyProgressChart({ weeklyLogs, allExercises }: WeeklyProgressChartProps) {
  const { isDarkMode, userData } = useUserStore();
  const weightUnit = userData?.weightUnit || 'Kgs';

  const chartData = useMemo(() => {
    // Create data for each day of the week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyVolume = new Array(7).fill(0);
    const dailyWorkouts = new Array(7).fill(0);

    // Calculate volume and workout count for each day
    weeklyLogs.forEach(log => {
      const logDate = new Date(log.date);
      const dayIndex = logDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Calculate total volume for this workout
      const workoutVolume = log.exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);
      
      dailyVolume[dayIndex] += workoutVolume;
      dailyWorkouts[dayIndex] += 1;
    });

    const data: ChartData<'bar'> = {
      labels: daysOfWeek,
      datasets: [
        {
          label: `Volume (${weightUnit})`,
          data: dailyVolume.map(volume => Math.round(volume)),
          backgroundColor: 'rgba(147, 51, 234, 0.6)', // Purple
          borderColor: 'rgba(147, 51, 234, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Workouts',
          data: dailyWorkouts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          yAxisID: 'y1',
        },
      ],
    };

    return data;
  }, [weeklyLogs, weightUnit]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            family: 'Poppins',
            size: 12
          },
          color: isDarkMode ? '#fff' : '#374151',
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 20
        }
      },
      tooltip: {
        titleFont: {
          family: 'Poppins',
          size: 14
        },
        bodyFont: {
          family: 'Poppins',
          size: 12
        },
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#fff' : '#374151',
        bodyColor: isDarkMode ? '#d1d5db' : '#6b7280',
        borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            
            if (datasetLabel.includes('Volume')) {
              return `${datasetLabel}: ${value} ${weightUnit}`;
            } else {
              return `${datasetLabel}: ${value}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day of Week',
          font: {
            family: 'Poppins',
            size: 14
          },
          color: isDarkMode ? '#d1d5db' : '#374151'
        },
        ticks: {
          font: {
            family: 'Poppins',
            size: 12
          },
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
          drawBorder: false
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: `Volume (${weightUnit})`,
          font: {
            family: 'Poppins',
            size: 14
          },
          color: isDarkMode ? '#d1d5db' : '#374151'
        },
        ticks: {
          font: {
            family: 'Poppins',
            size: 12
          },
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
          drawBorder: false
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Number of Workouts',
          font: {
            family: 'Poppins',
            size: 14
          },
          color: isDarkMode ? '#d1d5db' : '#374151'
        },
        ticks: {
          font: {
            family: 'Poppins',
            size: 12
          },
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          stepSize: 1,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (weeklyLogs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No workouts this week yet</p>
          <p className="text-xs mt-1">Start logging to see your daily progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Bar options={options} data={chartData} />
    </div>
  );
}