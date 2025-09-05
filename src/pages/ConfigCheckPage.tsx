import React from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SupabaseStatus } from '../components/SupabaseStatus';
import { AuthTester } from '../components/AuthTester';

export function ConfigCheckPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="button-icon p-2 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">
            Configuration Check
          </h1>
        </div>
      </div>

      <SupabaseStatus />

      <AuthTester />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How to Fix Configuration Issues
        </h3>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">1. Get Your Supabase Credentials</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a></li>
              <li>Select your project</li>
              <li>Go to Settings → API</li>
              <li>Copy the "Project URL" and "anon public" key</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">2. Create Environment File</h4>
            <p className="mb-2">Create a <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env</code> file in your project root with:</p>
            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">3. Run Database Migration</h4>
            <p className="mb-2">If tables are missing, you need to run the migration:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Go to your Supabase Dashboard → SQL Editor</li>
              <li>Copy and run the migration from <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">supabase/migrations/20250706233111_fancy_field.sql</code></li>
              <li>Or use the Supabase CLI if you have it set up</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">4. Restart Development Server</h4>
            <p>After making changes, restart your development server to load the new environment variables.</p>
          </div>
        </div>
      </div>
    </div>
  );
}