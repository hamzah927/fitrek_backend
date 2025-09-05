import React from 'react';
import { Bot } from 'lucide-react';

export function AIAssistant() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bot className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Coach FiTrek</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-300 font-semibold mb-4">
        Your personal AI fitness assistant is here to help! Ask questions about exercises,
        form guidance, or get workout recommendations tailored to your goals.
      </p>
    </div>
  );
}