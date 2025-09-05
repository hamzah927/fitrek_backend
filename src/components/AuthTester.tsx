import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthTestResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function AuthTester() {
  const [results, setResults] = useState<AuthTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testEmail] = useState('test@example.com');
  const [testPassword] = useState('testpassword123');

  const addResult = (result: AuthTestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Check environment variables
      addResult({
        step: 'Environment Variables',
        status: import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? 'success' : 'error',
        message: import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY 
          ? 'Environment variables are configured' 
          : 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
        details: {
          url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        }
      });

      // Test 2: Check Supabase client initialization
      try {
        const { data, error } = await supabase.auth.getSession();
        addResult({
          step: 'Client Initialization',
          status: error ? 'error' : 'success',
          message: error ? `Client error: ${error.message}` : 'Supabase client initialized successfully',
          details: { hasSession: !!data.session }
        });
      } catch (err) {
        addResult({
          step: 'Client Initialization',
          status: 'error',
          message: `Failed to initialize client: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: err
        });
      }

      // Test 3: Test network connectivity
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });

        addResult({
          step: 'Network Connectivity',
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? `Connected successfully (${response.status})` 
            : `Connection failed (${response.status}: ${response.statusText})`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`
          }
        });
      } catch (err) {
        addResult({
          step: 'Network Connectivity',
          status: 'error',
          message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: err
        });
      }

      // Test 4: Test auth endpoint specifically
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
          method: 'GET',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });

        const data = await response.json();
        addResult({
          step: 'Auth Endpoint',
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? 'Auth endpoint accessible' 
            : `Auth endpoint error (${response.status})`,
          details: data
        });
      } catch (err) {
        addResult({
          step: 'Auth Endpoint',
          status: 'error',
          message: `Auth endpoint test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: err
        });
      }

      // Test 5: Test database connection
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });

        addResult({
          step: 'Database Connection',
          status: error ? 'error' : 'success',
          message: error 
            ? `Database error: ${error.message}` 
            : 'Database connection successful',
          details: { error: error?.code, count: data }
        });
      } catch (err) {
        addResult({
          step: 'Database Connection',
          status: 'error',
          message: `Database test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: err
        });
      }

      // Test 6: Test signup (if possible)
      try {
        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            addResult({
              step: 'Signup Test',
              status: 'warning',
              message: 'User already exists (this is expected for testing)',
              details: error
            });
          } else {
            addResult({
              step: 'Signup Test',
              status: 'error',
              message: `Signup failed: ${error.message}`,
              details: error
            });
          }
        } else {
          addResult({
            step: 'Signup Test',
            status: 'success',
            message: 'Signup endpoint working',
            details: { userId: data.user?.id, needsConfirmation: !data.user?.email_confirmed_at }
          });
        }
      } catch (err) {
        addResult({
          step: 'Signup Test',
          status: 'error',
          message: `Signup test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: err
        });
      }

    } catch (globalError) {
      addResult({
        step: 'Global Error',
        status: 'error',
        message: `Test suite failed: ${globalError instanceof Error ? globalError.message : 'Unknown error'}`,
        details: globalError
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: AuthTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: AuthTestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-700 dark:text-green-400';
      case 'error':
        return 'text-red-700 dark:text-red-400';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-400';
    }
  };

  const getStatusBg = (status: AuthTestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Authentication Flow Tester
          </h3>
        </div>
        <button
          onClick={runAuthTests}
          disabled={isRunning}
          className="button-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {isRunning ? 'Testing...' : 'Run Auth Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusBg(result.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.step}
                    </span>
                  </div>
                  <p className={`text-sm ${getStatusColor(result.status)}`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        Show details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isRunning && results.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Run Auth Tests" to diagnose authentication issues</p>
        </div>
      )}
    </div>
  );
}