import React, { useState, useEffect, useMemo } from 'react';
import {
  Gift,
  Share2,
  Copy,
  Check,
  Trophy,
  Crown,
  ArrowRight,
  Users,
  Calendar,
  Zap,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { SkeletonLoader } from './SkeletonLoader';

export function ReferralSystem() {
  const {
    userData,
    isLoadingData,
    generateReferralCode,
    completedReferralsCount,
    showToastMessage,
  } = useUserStore();
  const [copied, setCopied] = useState(false);
  
  // Debug logging
  console.log('🔍 ReferralSystem - userData:', userData);
  console.log('🔍 ReferralSystem - referralCode:', userData?.referralCode);
  console.log('🔍 ReferralSystem - isLoadingData:', isLoadingData);

  const referralLink = useMemo(() => {
    if (userData?.referralCode) {
      return `${window.location.origin}/signup?ref=${userData.referralCode}`;
    }
    return '';
  }, [userData?.referralCode]);
  
  console.log('🔍 ReferralSystem - referralLink:', referralLink);

  const handleCopyLink = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        showToastMessage('Referral link copied!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        showToastMessage('Failed to copy link.');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'FiTrek Referral',
          text: `Join FiTrek and get fit with me! Use my referral code for a discount: ${userData?.referralCode}`,
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        showToastMessage('Failed to share. Please copy the link manually.');
      }
    } else {
      handleCopyLink(); // Fallback to copy if Web Share API is not available
    }
  };

  const MILESTONE_REWARDS = useMemo(
    () => [
      { count: 1, months: 0.25, label: '1 Week Free', icon: Gift },
      { count: 3, months: 0.5, label: '14 Days Free', icon: Gift },
      { count: 5, months: 1, label: '1 Month Free', icon: Trophy },
      { count: 10, months: 2, label: '2 Months Free', icon: Trophy },
      { count: 20, months: 3, label: '3 Months Free', icon: Trophy },
      { count: 50, months: 12, label: '1 Year Free', icon: Crown },
    ],
    []
  );

  const nextMilestone = useMemo(() => {
    return MILESTONE_REWARDS.find(
      (milestone) => completedReferralsCount < milestone.count
    );
  }, [completedReferralsCount, MILESTONE_REWARDS]);

  const progressPercentage = useMemo(() => {
    if (!nextMilestone) return 100; // All milestones achieved

    const prevMilestoneCount =
      MILESTONE_REWARDS.filter(
        (m) => m.count < nextMilestone.count
      ).pop()?.count || 0;
    const range = nextMilestone.count - prevMilestoneCount;
    const progress = completedReferralsCount - prevMilestoneCount;

    return (progress / range) * 100;
  }, [completedReferralsCount, nextMilestone, MILESTONE_REWARDS]);

  // Ensure referral code is generated if not present
  useEffect(() => {
    if (!isLoadingData && !userData?.referralCode) {
      generateReferralCode();
    }
  }, [isLoadingData, userData?.referralCode, generateReferralCode]);

  if (isLoadingData) {
    return (
      <div className="card space-y-6">
        <SkeletonLoader className="h-8 w-1/2" />
        <SkeletonLoader className="h-12 w-full" />
        <SkeletonLoader className="h-6 w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold font-poppins bg-gradient-to-r from-primary to-accent-dark bg-clip-text text-transparent">
            Refer a Friend
          </h2>
        </div>

        <div className="space-y-6">
          {/* Your Referral Code */}
          <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-5 sm:p-6 border border-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Your Referral Code
            </h3>
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-elevation-1 dark:shadow-elevation-1-dark border border-gray-200 dark:border-gray-700">
              <span className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
                {userData?.referralCode || 'Generating...'}
              </span>
              <button
                onClick={handleCopyLink}
                className="button-secondary flex items-center gap-2 px-3 py-2 text-sm"
                disabled={!userData?.referralCode}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Share this code with your friends. They can use it during signup or checkout.
            </p>
            <button
              onClick={handleShare}
              className="button-primary flex items-center gap-2 px-3 py-2 text-sm mt-4"
              disabled={!userData?.referralCode}
            >
              <Share2 className="w-4 h-4" /> Share Link
            </button>
          </div>

        </div>
      </div>

      {/* Referral Progress */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 sm:h-7 sm:w-7 text-secondary" />
          <h2 className="text-xl sm:text-2xl font-bold font-poppins bg-gradient-to-r from-secondary to-accent-dark bg-clip-text text-transparent">
            Your Referral Progress
          </h2>
        </div>

        <div className="space-y-6">
          {/* Current Referrals */}
          <div className="bg-gradient-to-br from-secondary/5 to-violet-50/50 dark:from-secondary/10 dark:to-violet-900/20 rounded-2xl p-5 sm:p-6 border border-secondary/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Completed Referrals
              </h3>
              <span className="text-3xl font-bold text-secondary">
                {completedReferralsCount}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've successfully referred {completedReferralsCount} friend
              {completedReferralsCount !== 1 ? 's' : ''}!
            </p>
          </div>

          {/* Progress Bar to Next Milestone */}
          {nextMilestone && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-elevation-1 dark:shadow-elevation-1-dark border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Next Reward: {nextMilestone.label}
                </h4>
                <span className="text-sm font-medium text-primary">
                  {completedReferralsCount}/{nextMilestone.count}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Refer {nextMilestone.count - completedReferralsCount} more friend
                {nextMilestone.count - completedReferralsCount !== 1 ? 's' : ''} to unlock this reward!
              </p>
            </div>
          )}

          {/* Milestone Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {MILESTONE_REWARDS.map((milestone) => {
              const Icon = milestone.icon;
              const achieved = completedReferralsCount >= milestone.count;
              const isNext = nextMilestone && milestone.count === nextMilestone.count;

              return (
                <div
                  key={milestone.count}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                    achieved
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-elevation-2 dark:shadow-elevation-2-dark'
                      : isNext
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-elevation-1 dark:shadow-elevation-1-dark'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      achieved
                        ? 'bg-green-500 shadow-elevation-2 dark:shadow-elevation-2-dark'
                        : isNext
                        ? 'bg-gradient-to-r from-primary to-secondary shadow-elevation-2 dark:shadow-elevation-2-dark'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        achieved ? 'text-white' : isNext ? 'text-white' : 'text-gray-500 dark:text-gray-300'
                      }`}
                    />
                  </div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {milestone.count} Referrals
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {milestone.label}
                  </p>
                  {achieved && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Achieved!
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-accent-dark" />
          <h2 className="text-xl sm:text-2xl font-bold font-poppins bg-gradient-to-r from-accent-dark to-secondary bg-clip-text text-transparent">
            How it Works
          </h2>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-elevation-1 dark:shadow-elevation-1-dark border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                1. Share Your Code
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Give your unique referral code to friends, family, or anyone who wants to get fit!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-elevation-1 dark:shadow-elevation-1-dark border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                2. You Earn Rewards
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Once they subscribe, you'll earn free months of FiTrek Pro based on your referral milestones!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 border border-primary/10">
        <h2 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white mb-6 text-center">
          Referral FAQ
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How do my friends use the referral code?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              They can either click on your unique referral link, or manually enter your referral code during signup or checkout when subscribing to FiTrek Pro.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              When do I receive my free months?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your free months are automatically added to your FiTrek Pro subscription as soon as your referred friend completes their first payment.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Is there a limit to how many friends I can refer?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No, there's no limit! The more friends you refer, the more free months you can earn, all the way up to lifetime access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}