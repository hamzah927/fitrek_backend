import React, { useState } from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';

export function FloatingCoachButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-20 xs:bottom-24 sm:bottom-6 right-4 z-40 bg-gradient-to-r from-primary to-primary/80 text-white p-3 xs:p-4 rounded-full shadow-elevation-4 dark:shadow-elevation-4-dark hover:shadow-elevation-6 dark:hover:shadow-elevation-6-dark transition-all duration-300 transform hover:scale-110 active:scale-95 group ripple-effect"
        aria-label="Ask Coach FiTrek"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <X className="w-5 h-5 xs:w-6 xs:h-6" />
          ) : (
            <>
              <Bot className="w-5 h-5 xs:w-6 xs:h-6 group-hover:animate-bounce-gentle" />
              <span className="hidden sm:inline text-button font-semibold">Ask Coach</span>
            </>
          )}
        </div>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elevation-6 dark:shadow-elevation-6-dark w-full max-w-4xl h-[80vh] max-h-[600px] flex flex-col modal-content">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-blue-50/50 dark:from-primary/20 dark:to-blue-900/30 border-b border-primary/15 dark:border-primary/25 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-subheader text-gray-900 dark:text-white">Coach FiTrek</h3>
                    <p className="text-body text-gray-600 dark:text-gray-400">Your AI fitness assistant</p>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <p className="text-body text-primary/80 dark:text-primary/70 mt-2">
                Ask me anything about fitness, exercises, nutrition, or workout planning!
              </p>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src="https://www.chatbase.co/chatbot-iframe/GmvE2QUv17veIwCqB3Rj0"
                width="100%"
                height="100%"
                frameBorder="0"
                className="w-full h-full bg-white dark:bg-gray-900"
                title="Coach FiTrek Chat"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}