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
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface RepsProgressionGraphProps {
  workoutLogs: WorkoutLog[];
  programs: WorkoutProgram[];
  exercises: Array<{ id: number | string; name: string; }>;
}

export function RepsProgressionGraph({ workoutLogs, programs, exercises }: RepsProgressionGraphProps) {
  const { isDarkMode, userData } = useUserStore();
  const navigate = useNavigate();
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);

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

      // Track exercise reps progression with weight-based resets for this program
      const exerciseProgressMap = new Map<string, Array<{ reps: number | null; weight: number | null; resetPoint?: boolean }>>();

      // Initialize exercises for this program
      program.exercises.forEach(exerciseId => {
        exerciseProgressMap.set(exerciseId.toString(), new Array(sortedLogs.length).fill({ reps: null, weight: null }));
      });

      // Fill in the reps data for each workout, tracking weight changes
      sortedLogs.forEach((log, workoutIndex) => {
        log.exercises.forEach(exercise => {
          const exerciseId = exercise.exerciseId.toString();
          
          // Calculate average reps and weight from all sets
          const avgReps = exercise.sets.length > 0 
            ? exercise.sets.reduce((sum, set) => sum + set.reps, 0) / exercise.sets.length
            : 0;
          const avgWeight = exercise.sets.length > 0 
            ? exercise.sets.reduce((sum, set) => sum + set.weight, 0) / exercise.sets.length
            : 0;
          
          const progressArray = exerciseProgressMap.get(exerciseId);
          
          if (progressArray) {
            // Check if this is a weight change from the previous workout
            let isResetPoint = false;
            if (workoutIndex > 0) {
              // Find the last recorded weight for this exercise
              for (let i = workoutIndex - 1; i >= 0; i--) {
                const prevData = progressArray[i];
                if (prevData.weight !== null) {
                  if (Math.abs(prevData.weight - avgWeight) > 0.5) { // Consider 0.5kg difference as weight change
                    isResetPoint = true;
                  }
                  break;
                }
              }
            }

            progressArray[workoutIndex] = { 
              reps: avgReps, 
              weight: avgWeight, 
              resetPoint: isResetPoint 
            };
          }
        });
      });

      // Create datasets for each exercise with weight-based resets
      const datasets = Array.from(exerciseProgressMap.entries())
        .map(([exerciseId, dataPoints]) => {
          const exercise = exercises.find(e => e.id.toString() === exerciseId);
          if (!exercise) return null;

          // Only include exercises that have at least one data point
          if (dataPoints.every(point => point.reps === null)) return null;

          // Generate a consistent color based on the exercise name
          const hue = Math.abs(exercise.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);

          // Create a dataset that shows all segments as one continuous line but with resets
          const finalData = new Array(dataPoints.length).fill(null);
          
          dataPoints.forEach((point, index) => {
            if (point.reps !== null) {
              finalData[index] = Math.round(point.reps * 10) / 10; // Round to 1 decimal place
            }
          });

          return {
            label: exercise.name,
            data: finalData,
            borderColor: `hsl(${hue}, 70%, 50%)`,
            backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
            tension: 0.3,
            fill: false,
            spanGaps: false, // Don't connect across weight changes
            pointRadius: (context: any) => {
              const index = context.dataIndex;
              const point = dataPoints[index];
              return point?.resetPoint ? 8 : 6; // Larger points for reset points
            },
            pointHoverRadius: 8,
            pointBackgroundColor: (context: any) => {
              const index = context.dataIndex;
              const point = dataPoints[index];
              return point?.resetPoint ? '#ef4444' : `hsl(${hue}, 70%, 50%)`; // Red for reset points
            },
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
            segment: {
              borderDash: (ctx: any) => {
                const currentIndex = ctx.p1DataIndex;
                const point = dataPoints[currentIndex];
                return point?.resetPoint ? [5, 5] : undefined; // Dashed line after reset
              }
            }
          };
        })
        .filter(Boolean);

      const chartData = {
        labels,
        datasets,
      } as ChartData<'line'>;

      return { program, chartData, dataPoints: exerciseProgressMap };
    }).filter(item => item.chartData && item.chartData.datasets.length > 0);
  }, [workoutLogs, programs, exercises]);

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
            
            const exerciseName = context.dataset.label;
            const weightUnit = userData?.weightUnit || 'Kgs';
            
            // Find the corresponding workout log to get weight info
            const workoutIndex = context.dataIndex;
            const exercise = exercises.find(e => e.name === exerciseName);
            
            // Find the chart data for this specific workout
            const chartItem = workoutCharts[currentWorkoutIndex];
            
            if (chartItem && exercise) {
              const dataPoints = chartItem.dataPoints?.get(exercise.id.toString());
              if (dataPoints && dataPoints[workoutIndex]) {
                const exerciseData = dataPoints[workoutIndex];
                if (exerciseData.weight !== null) {
                  return `${exerciseName}: ${value} avg reps @ ${Math.round(exerciseData.weight * 10) / 10} ${weightUnit} avg`;
                }
              }
            }
            
            return `${exerciseName}: ${value} avg reps`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Repetitions',
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
            return value + ' reps';
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
    return (
      <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 text-center border border-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
        <div className="text-primary/60 dark:text-primary/50 mb-4">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-subheader text-gray-900 dark:text-white mb-3">
          Track your rep improvements!
        </h3>
        <p className="text-body text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
          Log your workouts to see how your repetitions improve over time and celebrate your endurance gains.
        </p>
        <div className="flex items-center justify-center gap-2 text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-body">Start logging to see your progress</span>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/workout-log')}
            className="button-primary flex items-center justify-center gap-2 mx-auto"
          >
            Go to Workout Log
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
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
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <button
          onClick={handlePrevious}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-all"
          disabled={workoutCharts.length <= 1}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        
        <div className="text-center">
          <h3 className="text-xl font-bold font-poppins text-gray-900 dark:text-white">
            {currentChart.program.name} - Reps Progression
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentWorkoutIndex + 1} of {workoutCharts.length} workouts
          </p>
        </div>
        
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-all"
          disabled={workoutCharts.length <= 1}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Current Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Average Reps Progression</p>
                <p>This chart shows the average reps across all sets for each exercise. When you significantly change the weight (±0.5kg), the progression tracking resets. Red points indicate weight increases.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-[400px] relative">
          <Line options={options} data={currentChart.chartData!} />
        </div>
      </div>

      {/* Progress Summary */}
      {currentChart.chartData!.datasets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white font-poppins">
            {currentChart.program.name} Reps Summary ({currentChart.chartData!.datasets.length} exercises)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {currentChart.chartData!.datasets.map((dataset, index) => {
              const hue = dataset.borderColor.toString().match(/\d+/)?.[0] || '0';
              const latestValue = dataset.data.filter(val => val !== null).slice(-1)[0];

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
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
                          Latest: {latestValue} avg reps
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
              className={`w-3 h-3 rounded-full transition-all ${
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