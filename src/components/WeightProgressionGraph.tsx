import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { WorkoutLog, WorkoutProgram } from '../types';
import { useUserStore } from '../store/userStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeightProgressionGraphProps {
  workoutLogs: WorkoutLog[];
  programs: WorkoutProgram[];
  exercises: Array<{ id: number | string; name: string; }>;
}

export function WeightProgressionGraph({ workoutLogs, programs, exercises }: WeightProgressionGraphProps) {
  const { isDarkMode, userData, isLoadingData } = useUserStore();
  const navigate = useNavigate();
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const weightUnit = userData?.weightUnit || 'Kgs';

  const workoutCharts = useMemo(() => {
    if (workoutLogs.length === 0 || programs.length === 0) {
      return [];
    }

    return programs.map(program => {
      // Filter logs for this specific workout program
      const programLogs = workoutLogs.filter(log => log.workoutId === program.id);
      
      if (programLogs.length === 0) {
        return { program, chartData: null };
      }

      // Sort workout logs by date
      const sortedLogs = [...programLogs].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create labels from workout dates
      const labels = sortedLogs.map((log, index) => {
        const date = new Date(log.date);
        return `Session ${index + 1}\n${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`;
      });

      // Track exercise weight progression across workouts for this program
      const exerciseProgressMap = new Map<string, number[]>();

      // Initialize exercises for this program
      program.exercises.forEach(exerciseId => {
        exerciseProgressMap.set(exerciseId.toString(), new Array(sortedLogs.length).fill(null));
      });

      // Fill in the weight data for each workout
      sortedLogs.forEach((log, workoutIndex) => {
        log.exercises.forEach(exercise => {
          const exerciseId = exercise.exerciseId.toString();
          
          // Calculate average weight from all sets
          const avgWeight = exercise.sets.length > 0 
            ? exercise.sets.reduce((sum, set) => sum + set.weight, 0) / exercise.sets.length
            : 0;
          
          const progressArray = exerciseProgressMap.get(exerciseId);
          if (progressArray) {
            progressArray[workoutIndex] = Math.round(avgWeight * 10) / 10; // Round to 1 decimal place
          }
        });
      });

      // Create datasets for each exercise in this program
      const datasets = Array.from(exerciseProgressMap.entries())
        .map(([exerciseId, data]) => {
          const exercise = exercises.find(e => e.id.toString() === exerciseId);
          if (!exercise) return null;

          // Only include exercises that have at least one data point
          if (data.every(point => point === null)) return null;

          // Generate a consistent color based on the exercise name
          const hue = Math.abs(exercise.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);

          return {
            label: exercise.name,
            data: data,
            borderColor: `hsl(${hue}, 70%, 50%)`,
            backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
            tension: 0.3,
            fill: false,
            spanGaps: false,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: `hsl(${hue}, 70%, 50%)`,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          };
        })
        .filter(Boolean);

      const chartData = {
        labels,
        datasets,
      } as ChartData<'line'>;

      return { program, chartData };
    }).filter(item => item.chartData && item.chartData.datasets.length > 0);
  }, [workoutLogs, programs, exercises]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Poppins',
            size: 12
          },
          color: isDarkMode ? '#fff' : '#374151',
          usePointStyle: true,
          pointStyle: 'circle',
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
          title: (context: any) => {
            return context[0].label.replace('\n', ' - ');
          },
          label: (context: any) => {
            const value = context.parsed.y;
            if (value === null) return null;
            return `${context.dataset.label}: ${value} ${weightUnit} avg`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Average Weight (${weightUnit})`,
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
          callback: function(value: any) {
            return value + ' ' + weightUnit;
          }
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
          drawBorder: false
        }
      },
      x: {
        title: {
          display: true,
          text: 'Workout Sessions',
          font: {
            family: 'Poppins',
            size: 14
          },
          color: isDarkMode ? '#d1d5db' : '#374151'
        },
        ticks: {
          font: {
            family: 'Poppins',
            size: 11
          },
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)',
          drawBorder: false
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      line: {
        tension: 0.3
      },
      point: {
        hoverRadius: 8
      }
    }
  };

  if (workoutCharts.length === 0) {
    if (isLoadingData) {
      return <SkeletonLoader variant="chart" className="h-96" />;
    }
    
    return (
      <div className="bg-gradient-to-br from-secondary/5 to-violet-50/50 dark:from-secondary/10 dark:to-violet-900/20 rounded-2xl p-6 sm:p-8 text-center border border-secondary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
        <div className="text-secondary/60 dark:text-secondary/50 mb-4">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
          Your progress chart awaits!
        </h3>
        <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
          Start logging your workouts to see your weight progression and strength gains visualized over time.
        </p>
      </div>
    );
  }

  const currentChart = workoutCharts[currentWorkoutIndex];

  const handlePrevious = () => {
    setCurrentWorkoutIndex(prev => prev > 0 ? prev - 1 : workoutCharts.length - 1);
  };

  const handleNext = () => {
    setCurrentWorkoutIndex(prev => prev < workoutCharts.length - 1 ? prev + 1 : 0);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-white/20 dark:border-gray-700/50 gap-4 transition-all duration-300 hover:shadow-medium">
        <button
          onClick={handlePrevious}
          className="button-secondary flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm sm:text-base"
          disabled={workoutCharts.length <= 1}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Previous
        </button>
        
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-bold font-poppins text-gray-900 dark:text-white">
            {currentChart.program.name} - Weight Progression
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentWorkoutIndex + 1} of {workoutCharts.length} workouts
          </p>
        </div>
        
        <button
          onClick={handleNext}
          className="button-secondary flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm sm:text-base"
          disabled={workoutCharts.length <= 1}
        >
          Next
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Current Chart */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-soft border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:shadow-medium">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins transition-all duration-300">
              Average Weight Progression
            </h3>
            <button
              onClick={() => setShowTooltip(!showTooltip)}
             className="button-icon flex items-center justify-center w-6 h-6 rounded-full"
              aria-label="Show chart information"
            >
              <Info className="w-4 h-4 text-primary" />
            </button>
          </div>
          
          {showTooltip && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-soft transition-all duration-300 animate-in slide-in-from-top-2">
              <p className="text-sm text-blue-700 dark:text-blue-300 transition-all duration-300">
                Track your average weight progression across all sets for each exercise in this workout
              </p>
            </div>
          )}
        </div>
        <div className="w-full h-[300px] sm:h-[400px] relative">
          <Line options={options} data={currentChart.chartData!} />
        </div>
      </div>

      {/* Progress Summary */}
      {currentChart.chartData!.datasets.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-soft border border-white/20 dark:border-gray-700/50 transition-all duration-300 hover:shadow-medium">
          <h4 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white font-poppins transition-all duration-300">
            {currentChart.program.name} Progress Summary ({currentChart.chartData!.datasets.length} exercises)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentChart.chartData!.datasets.map((dataset, index) => {
              const hue = dataset.borderColor.toString().match(/\d+/)?.[0] || '0';
              const latestValue = dataset.data.filter(val => val !== null).slice(-1)[0];
              const firstValue = dataset.data.find(val => val !== null);
              const improvement = latestValue && firstValue ? 
                ((latestValue as number - firstValue as number) / firstValue as number * 100) : 0;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50/80 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-soft hover:scale-[1.02] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {dataset.label}
                      </span>
                      {latestValue && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Latest: {latestValue} {weightUnit}
                        </p>
                      )}
                    </div>
                  </div>
                  {improvement !== 0 && (
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      improvement > 0 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => navigate('/workout-log')}
              className="text-body text-secondary hover:text-secondary/80 underline hover:no-underline transition-all duration-300 font-semibold"
            >
              Go to Workout Log to get started
            </button>
          </div>
        </div>
      )}

      {/* Workout Indicator Dots */}
      {workoutCharts.length > 1 && (
        <div className="flex justify-center gap-2">
          {workoutCharts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentWorkoutIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125 active:scale-95 shadow-soft hover:shadow-medium ${
                index === currentWorkoutIndex
                  ? 'bg-primary scale-125'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-primary/50'
              }`}
              aria-label={`Go to workout ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}