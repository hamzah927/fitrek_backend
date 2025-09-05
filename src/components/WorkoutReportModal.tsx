import React, { useState, useMemo } from 'react';
import { X, Calendar, TrendingUp, Dumbbell, Clock, Target, Award, BarChart3, Download, Share2 } from 'lucide-react';
import { WeeklyProgressChart } from './WeeklyProgressChart';

interface WorkoutReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutLogs: WorkoutLog[];
  programs: WorkoutProgram[];
  allExercises: Exercise[];
  userData: UserData | null;
}

export function WorkoutReportModal({ 
  isOpen, 
  onClose, 
  workoutLogs, 
  programs, 
  allExercises, 
  userData 
}: WorkoutReportModalProps) {
  const [reportPeriod, setReportPeriod] = useState<'week' | '2weeks' | 'month' | 'all'>('week');

  const reportData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let periodLabel: string;

    switch (reportPeriod) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        periodLabel = 'Last 7 Days';
        break;
      case '2weeks':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        periodLabel = 'Last 2 Weeks';
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        periodLabel = 'Last 30 Days';
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        periodLabel = 'All Time';
        break;
    }

    const filteredLogs = workoutLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate;
    });

    // Calculate comprehensive stats
    const totalWorkouts = filteredLogs.length;
    const totalVolume = filteredLogs.reduce((total, log) => {
      return total + log.exercises.reduce((logTotal, exercise) => {
        return logTotal + exercise.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);
    }, 0);

    const totalSets = filteredLogs.reduce((total, log) => {
      return total + log.exercises.reduce((logTotal, exercise) => {
        return logTotal + exercise.sets.length;
      }, 0);
    }, 0);

    const totalReps = filteredLogs.reduce((total, log) => {
      return total + log.exercises.reduce((logTotal, exercise) => {
        return logTotal + exercise.sets.reduce((setTotal, set) => {
          return setTotal + set.reps;
        }, 0);
      }, 0);
    }, 0);

    // Calculate unique exercises and muscle groups
    const uniqueExercises = new Set<string>();
    const muscleGroupsWorked = new Set<string>();
    const exerciseFrequency = new Map<string, number>();

    filteredLogs.forEach(log => {
      log.exercises.forEach(ex => {
        uniqueExercises.add(ex.exerciseId.toString());
        
        const exercise = allExercises.find(e => e.id === ex.exerciseId);
        if (exercise) {
          muscleGroupsWorked.add(exercise.muscle_group);
          exerciseFrequency.set(exercise.name, (exerciseFrequency.get(exercise.name) || 0) + 1);
        }
      });
    });

    // Find most performed exercises
    const topExercises = Array.from(exerciseFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);


    // Calculate consistency (days with workouts / total days in period)
    // Calculate target workouts based on user's weekly goal and period
    const weeklyGoal = userData?.weeklyWorkoutGoal || 3;
    let targetWorkouts: number;
    let totalDays: number;
    
    switch (reportPeriod) {
      case 'week':
        targetWorkouts = weeklyGoal;
        totalDays = 7;
        break;
      case '2weeks':
        targetWorkouts = weeklyGoal * 2;
        totalDays = 14;
        break;
      case 'month':
        targetWorkouts = Math.round(weeklyGoal * 4.3); // ~4.3 weeks in a month
        totalDays = 30;
        break;
      case 'all':
        const daysSinceFirst = filteredLogs.length > 0 
          ? Math.max(1, Math.ceil((now.getTime() - new Date(filteredLogs[filteredLogs.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)))
          : 1;
        const weeksSinceFirst = Math.max(1, daysSinceFirst / 7);
        targetWorkouts = Math.round(weeklyGoal * weeksSinceFirst);
        totalDays = daysSinceFirst;
        break;
    }
    
    const workoutDays = new Set(filteredLogs.map(log => new Date(log.date).toDateString())).size;
    const consistencyPercentage = Math.min(100, Math.round((totalWorkouts / targetWorkouts) * 100));

    // Calculate personal records in this period
    const personalRecords: string[] = [];
    if (filteredLogs.length > 1) {
      const sortedLogs = filteredLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const recentLog = sortedLogs[sortedLogs.length - 1];
      const previousLogs = sortedLogs.slice(0, -1);

      recentLog.exercises.forEach(exercise => {
        const exerciseDetails = allExercises.find(e => e.id === exercise.exerciseId);
        if (!exerciseDetails || !exercise.sets || exercise.sets.length === 0) return;

        const recentMaxWeight = Math.max(...exercise.sets.map(set => set.weight || 0));
        if (recentMaxWeight === 0) return;

        let historicalMaxWeight = 0;
        previousLogs.forEach(log => {
          const historicalExercise = log.exercises.find(ex => ex.exerciseId === exercise.exerciseId);
          if (historicalExercise && historicalExercise.sets && historicalExercise.sets.length > 0) {
            const maxWeight = Math.max(...historicalExercise.sets.map(set => set.weight || 0));
            historicalMaxWeight = Math.max(historicalMaxWeight, maxWeight);
          }
        });

        const threshold = userData?.weightUnit === 'Pounds' ? 2.5 : 1.25;
        if (historicalMaxWeight > 0 && recentMaxWeight > historicalMaxWeight + threshold) {
          personalRecords.push(exerciseDetails.name);
        }
      });
    }

    return {
      periodLabel,
      startDate,
      endDate: now,
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      totalSets,
      totalReps,
      uniqueExercises: uniqueExercises.size,
      muscleGroups: muscleGroupsWorked.size,
      consistencyPercentage,
      workoutDays,
      totalDays,
      targetWorkouts,
      topExercises,
      personalRecords,
      filteredLogs,
    };
  }, [workoutLogs, allExercises, userData, reportPeriod]);

  const generateReportText = () => {
    const { periodLabel, totalWorkouts, totalVolume, consistencyPercentage, personalRecords } = reportData;
    
    return `
FiTrek Workout Report - ${periodLabel}
Generated on ${new Date().toLocaleDateString()}

📊 SUMMARY
• Workouts Completed: ${totalWorkouts}
• Total Volume: ${totalVolume} ${userData?.weightUnit || 'Kgs'}
• Consistency: ${consistencyPercentage}%
• Personal Records: ${personalRecords.length}

🏆 TOP ACHIEVEMENTS
${personalRecords.length > 0 ? personalRecords.map(pr => `• New PR: ${pr}`).join('\n') : '• Keep pushing for new personal records!'}

💪 KEEP UP THE GREAT WORK!
    `.trim();
  };

  const handleDownloadReport = () => {
    const reportText = generateReportText();
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitrek-report-${reportData.periodLabel.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareReport = async () => {
    const reportText = generateReportText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My FiTrek ${reportData.periodLabel} Report`,
          text: reportText,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(reportText);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(reportText);
        alert('Report copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy report:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-large border border-white/30 dark:border-gray-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-poppins text-gray-900 dark:text-white">
                  Workout Report
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reportData.periodLabel} • {reportData.totalWorkouts} workouts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="button-icon p-2 rounded-full"
                title="Download Report"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleShareReport}
                className="button-icon p-2 rounded-full"
                title="Share Report"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="button-icon p-2 rounded-full"
                aria-label="Close report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Period Selection */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'week', label: 'Last 7 Days' },
                { key: '2weeks', label: 'Last 2 Weeks' },
                { key: 'month', label: 'Last 30 Days' },
                { key: 'all', label: 'All Time' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setReportPeriod(key as any)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    reportPeriod === key
                      ? 'bg-primary text-white shadow-elevation-2 dark:shadow-elevation-2-dark'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {reportData.totalWorkouts === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No workouts in this period
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try selecting a different time period or log some workouts first.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Dumbbell className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{reportData.totalWorkouts}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Workouts</p>
                </div>

                <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl p-4 text-center border border-secondary/20">
                  <div className="w-8 h-8 bg-gradient-to-r from-secondary to-secondary/80 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-secondary">{reportData.totalVolume}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Volume ({userData?.weightUnit})</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{reportData.consistencyPercentage}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Consistency</p>
                </div>
              </div>

              {/* Activity Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Activity Overview
                </h3>
                <WeeklyProgressChart 
                  weeklyLogs={reportData.filteredLogs} 
                  allExercises={allExercises} 
                />
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Sets</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{reportData.totalSets}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Reps</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{reportData.totalReps}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unique Exercises</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{reportData.uniqueExercises}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Muscle Groups</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{reportData.muscleGroups}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Workout Days</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{reportData.totalWorkouts}/{reportData.targetWorkouts}</span>
                    </div>
                  </div>
                </div>

                {/* Top Exercises */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Most Performed Exercises
                  </h3>
                  <div className="space-y-3">
                    {reportData.topExercises.length > 0 ? (
                      reportData.topExercises.map(([exerciseName, count], index) => (
                        <div key={exerciseName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{exerciseName}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{count}x</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No exercises logged yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Records */}
              {reportData.personalRecords.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    Personal Records Achieved
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reportData.personalRecords.map((exerciseName, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{exerciseName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Workouts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Recent Workouts ({reportData.filteredLogs.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reportData.filteredLogs
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10) // Show last 10 workouts
                    .map((log) => {
                      const program = programs.find(p => p.id === log.workoutId);
                      const totalVolume = log.exercises.reduce((total, exercise) => {
                        return total + exercise.sets.reduce((setTotal, set) => {
                          return setTotal + (set.weight * set.reps);
                        }, 0);
                      }, 0);

                      return (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {program?.name || 'Unknown Workout'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{Math.round(totalVolume)} {userData?.weightUnit}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{log.exercises.length} exercises</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Motivational Summary */}
              <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-xl p-6 border border-primary/10 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {reportData.consistencyPercentage >= 80 ? '🔥 Outstanding Performance!' :
                   reportData.consistencyPercentage >= 60 ? '💪 Great Progress!' :
                   reportData.consistencyPercentage >= 40 ? '📈 Building Momentum!' :
                   '🌟 Every Step Counts!'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {reportData.consistencyPercentage >= 80 ? 
                    `You've been incredibly consistent with ${reportData.consistencyPercentage}% consistency! Your dedication is paying off with ${reportData.personalRecords.length} personal records.` :
                   reportData.consistencyPercentage >= 60 ?
                    `You're making solid progress with ${reportData.workoutDays} workout days. Keep building that momentum!` :
                   reportData.consistencyPercentage >= 40 ?
                    `You're on the right track! ${reportData.totalWorkouts} workouts completed. Consistency is key to reaching your goals.` :
                    `Every workout matters! You've logged ${reportData.totalWorkouts} workouts. Small steps lead to big changes.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}