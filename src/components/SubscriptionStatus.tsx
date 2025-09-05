import React from 'react';
import { Crown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export function SubscriptionStatus() {
  const { getCurrentPlan, isLoading } = useStripe();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  const getStatusIcon = () => {
    if (currentPlan.name === 'Free') {
      return <Crown className="w-4 h-4 text-gray-500" />;
    }

    switch (currentPlan.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'trialing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'past_due':
      case 'canceled':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Crown className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusColor = () => {
    if (currentPlan.name === 'Free') {
      return 'text-gray-600 dark:text-gray-400';
    }

    switch (currentPlan.status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'trialing':
        return 'text-blue-600 dark:text-blue-400';
      case 'past_due':
      case 'canceled':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {currentPlan.name}
        {currentPlan.status && currentPlan.name !== 'Free' && (
          <span className="ml-1 text-xs opacity-75">
            ({currentPlan.status})
          </span>
        )}
      </span>
    </div>
  );
}