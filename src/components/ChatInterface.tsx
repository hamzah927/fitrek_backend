import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import type { UserData, WorkoutLog, Exercise } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

declare function runAction(actionName: string, inputs: Record<string, any>): Promise<Record<string, any>>;
interface ChatInterfaceProps {
  userData: UserData | null;
  workoutLogs: WorkoutLog[];
  allExercises: Exercise[];
  className?: string;
}

// Import runAction from Bolt SDK (this would be provided by the Bolt platform)
export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear messages when theme changes to force a fresh start with new theme
  useEffect(() => {
    setMessages([]);
    setError(null);
    // Add a small delay to ensure the theme change is processed
    const timer = setTimeout(() => {
      // Theme change processed, ready for new messages
    }, 100);
    return () => clearTimeout(timer);
  }, [isDarkMode]);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Prepare dynamic user data for the system prompt
    const userGoal = userData?.goal || 'general_fitness';
    const userExperience = userData?.experience_level || 'beginner';
    const weightUnit = userData?.weightUnit || 'Kgs';

    let lastWorkoutDetails = 'N/A';
    if (workoutLogs.length > 0) {
      const lastWorkout = workoutLogs[0]; // workoutLogs is sorted by date descending
      if (lastWorkout && lastWorkout.exercises.length > 0) {
        const firstExerciseInLastWorkout = lastWorkout.exercises[0];
        const exerciseName = allExercises.find(ex => ex.id === firstExerciseInLastWorkout.exerciseId)?.name || 'Unknown Exercise';
        
        if (firstExerciseInLastWorkout.sets.length > 0) {
          const totalReps = firstExerciseInLastWorkout.sets.reduce((sum, set) => sum + set.reps, 0);
          const avgWeight = firstExerciseInLastWorkout.sets.reduce((sum, set) => sum + set.weight, 0) / firstExerciseInLastWorkout.sets.length;
          lastWorkoutDetails = `${exerciseName}, ${firstExerciseInLastWorkout.sets.length} sets x ${totalReps} reps @ ${avgWeight.toFixed(1)}${weightUnit}`;
        } else {
          lastWorkoutDetails = `${exerciseName}, no sets logged`;
        }
      }
    }

    // Construct the dynamic system context
    const systemContext = `You are Fitrek, a hypertrophy training AI coach inside a fitness app.
You always respond with encouragement, evidence-based advice, and clear steps.

Here is the user’s data:
- Goal: ${userGoal}
- Training experience: ${userExperience}
- Last workout: ${lastWorkoutDetails}
- Macros: Protein N/A, Carbs N/A, Fats N/A, Calories N/A (Nutrition data not yet integrated)

If the user asks to log a workout, reply in this format:
ACTION: log_workout [exercise] [sets]x[reps] @ [weight]

If the user asks to update goal, reply in this format:
ACTION: update_goal strength`;

    try {
      // Define system context for the AI coach
      // Call the ChatbaseCoach API action
      const result = await runAction('ChatbaseCoach', {
        system_context: systemContext,
        user_message: userMessage.content
      });

      if (!result || !result.ai_response) {
        throw new Error('No response received from AI coach');
      }

      const assistantMessage: Message = { role: 'assistant', content: result.ai_response };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('ChatbaseCoach API error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from AI coach');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-b-2xl transition-colors duration-300 ${className}`}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center transition-colors duration-300">
            <Bot className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-semibold">How can I help you today?</p>
            <p className="text-sm">Ask me anything about fitness, exercises, or nutrition!</p>
            <div className="mt-4 px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
              <p className="text-xs text-primary dark:text-primary-light">
                Theme: {isDarkMode ? 'Dark' : 'Light'} Mode
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start gap-2 p-3 rounded-lg max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none shadow-elevation-1 dark:shadow-elevation-1-dark'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-elevation-1 dark:shadow-elevation-1-dark transition-colors duration-300'
              }`}
            >
              {msg.role === 'assistant' && (
                <Bot className="w-5 h-5 flex-shrink-0 text-primary transition-colors duration-300" />
              )}
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.role === 'user' && (
                <User className="w-5 h-5 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-elevation-1 dark:shadow-elevation-1-dark transition-colors duration-300">
              <Bot className="w-5 h-5 flex-shrink-0 text-primary transition-colors duration-300" />
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              <p className="text-sm leading-relaxed">Thinking...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-elevation-1 dark:shadow-elevation-1-dark transition-colors duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <input
            type="text"
            className="input-field flex-1 transition-colors duration-300"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="button-primary p-3 rounded-full transition-all duration-300"
            disabled={isLoading || input.trim() === ''}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}