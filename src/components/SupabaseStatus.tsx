import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Key, Wifi, Shield, Table } from 'lucide-react';
import { checkSupabaseConfiguration, type SupabaseCheckResult } from '../utils/supabaseCheck';

export function SupabaseStatus() {
  const [result, setResult] = useState<SupabaseCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const checkResult = await checkSupabaseConfiguration();
      setResult(checkResult);
    } catch (error) {
      console.error('Check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
  };

  const getStatusBg = (status: boolean) => {
    return status ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Supabase Configuration Status
          </h3>
        </div>
        <button
          onClick={runCheck}
          disabled={isChecking}
          className="button-primary flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Recheck'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${
            result.isConfigured 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center gap-3">
              <StatusIcon status={result.isConfigured} />
              <span className={`font-medium ${getStatusColor(result.isConfigured)}`}>
                {result.isConfigured ? 'Configuration Valid' : 'Configuration Issues Found'}
              </span>
            </div>
          </div>

          {/* Detailed Checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getStatusBg(result.urlValid)} ${
              result.urlValid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <Wifi className="w-4 h-4" />
                <StatusIcon status={result.urlValid} />
                <span className={`text-sm font-medium ${getStatusColor(result.urlValid)}`}>
                  Supabase URL
                </span>
              </div>
              {result.details.url && (
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
                  {result.details.url}
                </p>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${getStatusBg(result.keyValid)} ${
              result.keyValid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-4 h-4" />
                <StatusIcon status={result.keyValid} />
                <span className={`text-sm font-medium ${getStatusColor(result.keyValid)}`}>
                  Anonymous Key
                </span>
              </div>
              {result.details.keyPrefix && (
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
                  {result.details.keyPrefix}
                </p>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${getStatusBg(result.connectionWorking)} ${
              result.connectionWorking ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4" />
                <StatusIcon status={result.connectionWorking} />
                <span className={`text-sm font-medium ${getStatusColor(result.connectionWorking)}`}>
                  Database Connection
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusBg(result.authWorking)} ${
              result.authWorking ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <StatusIcon status={result.authWorking} />
                <span className={`text-sm font-medium ${getStatusColor(result.authWorking)}`}>
                  Authentication
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusBg(result.tablesAccessible)} ${
              result.tablesAccessible ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <Table className="w-4 h-4" />
                <StatusIcon status={result.tablesAccessible} />
                <span className={`text-sm font-medium ${getStatusColor(result.tablesAccessible)}`}>
                  Database Tables
                </span>
              </div>
            </div>
          </div>

          {/* Environment Variables Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-2">Environment Variables Required:</p>
                <ul className="space-y-1 text-xs">
                  <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">VITE_SUPABASE_URL</code> - Your Supabase project URL</li>
                  <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> - Your Supabase anonymous key</li>
                </ul>
                <p className="mt-2 text-xs">
                  These should be added to your <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file in the project root.
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium mb-2">Issues Found:</p>
                  <ul className="space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-xs">• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result.isConfigured && result.connectionWorking && result.authWorking && result.tablesAccessible && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  ✅ Supabase is configured correctly and ready to use!
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}