import React, { useState } from 'react';
import { User, Save, Bell, Mail, Target, Moon, Sun, LogOut, MessageSquare } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { ReferralSystem } from '../components/ReferralSystem';
import { FeedbackForm } from '../components/FeedbackForm';

export function ProfilePage() {
  const { userData, setUserData, isDarkMode, toggleDarkMode, logout } = useUserStore();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'referrals'>('profile');
  
  // Debug logging (kept for development, can be removed in production)
  console.log('🔍 ProfilePage - userData:', userData); 
  
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    height: userData?.height.toString() || '',
    sex: userData?.sex || 'male',
    email: userData?.email || '',
    weightUnit: userData?.weightUnit || 'Kgs',
    notifications: userData?.notifications || {
      workoutReminders: false,
      progressUpdates: false,
      newFeatures: false,
    },
    weeklyWorkoutGoal: userData?.weeklyWorkoutGoal || 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserData({
      name: formData.name,
      height: Number(formData.height),
      sex: formData.sex as 'male' | 'female' | 'other',
      email: formData.email,
      weightUnit: formData.weightUnit as 'Kgs' | 'Pounds',
      notifications: formData.notifications,
      weeklyWorkoutGoal: Number(formData.weeklyWorkoutGoal),
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="space-y-6">
      {/* Tabs for Profile and Referrals */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 text-lg font-semibold transition-colors duration-300 ${
            activeTab === 'profile'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`py-2 px-4 text-lg font-semibold transition-colors duration-300 ${
            activeTab === 'referrals'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Referrals
        </button>
      </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 xs:gap-4">
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center gap-2 xs:gap-3 p-3 xs:p-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-soft hover:shadow-medium active:shadow-soft border border-gray-300 dark:border-gray-600"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 xs:h-6 xs:w-6 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 xs:h-6 xs:w-6 text-gray-600 dark:text-gray-300" />
              )}
              <span className="text-sm xs:text-base font-medium text-gray-700 dark:text-gray-200">
                {isDarkMode ? 'Light' : 'Dark'} Mode
              </span>
            </button>

            <button
              onClick={() => setShowFeedbackForm(true)}
              className="flex items-center justify-center gap-2 xs:gap-3 p-3 xs:p-4 rounded-2xl bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-300 transform hover:scale-105 active:scale-95 text-blue-600 dark:text-blue-400 shadow-soft hover:shadow-medium active:shadow-soft border border-blue-300 dark:border-blue-600"
            >
              <MessageSquare className="h-5 w-5 xs:h-6 xs:w-6" />
              <span className="text-sm xs:text-base font-medium">
                Report Issue
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 xs:gap-3 p-3 xs:p-4 rounded-2xl bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-200 hover:to-red-300 dark:hover:from-red-900/30 dark:hover:to-red-800/30 transition-all duration-300 transform hover:scale-105 active:scale-95 text-red-600 dark:text-red-400 shadow-soft hover:shadow-medium active:shadow-soft border border-red-300 dark:border-red-600"
            >
              <LogOut className="h-5 w-5 xs:h-6 xs:w-6" />
              <span className="text-sm xs:text-base font-medium">
                Logout
              </span>
            </button>
          </div>
        </div>
      {activeTab === 'profile' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
              Profile Settings
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <h3 className="text-base sm:text-lg font-semibold font-poppins text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      className="input-field pl-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    required
                    className="input-field"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="Enter your height"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sex
                  </label>
                  <select
                    id="sex"
                    className="input-field appearance-none"
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label htmlFor="weeklyGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Weekly Workout Goal
                  </label>
                  <div className="relative">
                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      id="weeklyGoal"
                      min="1"
                      max="7"
                      required
                      className="input-field pl-12"
                      value={formData.weeklyWorkoutGoal}
                      onChange={(e) => setFormData({ ...formData, weeklyWorkoutGoal: Number(e.target.value) })}
                      placeholder="Weekly target (1-7)"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set your target number of workouts per week</p>
                </div>

                <div className="space-y-3">
                  <label htmlFor="weightUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Weight Unit
                  </label>
                  <select
                    id="weightUnit"
                    className="input-field appearance-none"
                    value={formData.weightUnit}
                    onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                  >
                    <option value="Kgs">Kilograms (Kgs)</option>
                    <option value="Pounds">Pounds</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h3 className="text-base sm:text-lg font-semibold font-poppins text-gray-900 dark:text-gray-100">Notifications</h3>
              </div>
              <div className="space-y-4 bg-accent-light dark:bg-gray-700/50 p-4 sm:p-6 rounded-2xl">
                {Object.entries({
                  workoutReminders: 'Workout Reminders',
                  progressUpdates: 'Progress Updates',
                  newFeatures: 'New Features & Updates',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData.notifications[key as keyof typeof formData.notifications]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 text-primary rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary"
                    />
                    <label htmlFor={key} className="ml-3 text-base text-gray-700 dark:text-gray-300">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="button-primary flex items-center justify-center w-full py-4">
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Save Changes
            </button>
          </form>
        </div>
      )}

      {activeTab === 'referrals' && <ReferralSystem />}

      <FeedbackForm 
        isOpen={showFeedbackForm} 
        onClose={() => setShowFeedbackForm(false)} 
      />
    </div>
  );
}