'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Login functionality will be added later
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Left side - Decorative */}
      <div className="hidden lg:block lg:w-1/2 h-screen relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,215,0,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,215,0,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,215,0,0.05)_25%,transparent_25%,transparent_75%,rgba(255,215,0,0.05)_75%,rgba(255,215,0,0.05))]" style={{ backgroundSize: '40px 40px' }} />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 px-6 py-12 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-lg text-gray-600 mb-8">Plan your perfect event with us</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold-200 focus:border-gold-300 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold-200 focus:border-gold-300 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-gold-500 focus:ring-gold-200 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button type="button" className="text-sm text-gold-600 hover:text-gold-700">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white py-3 rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="text-gold-600 hover:text-gold-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 