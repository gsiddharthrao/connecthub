import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, demoLoginUser, clearAuthError } from '../store/slices/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = router.query.redirect || '/';
      router.push(redirect);
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, router, dispatch]);

  const validate = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(loginUser(formData));
  };

  const handleDemoFill = () => {
    const demoCredentials = {
      email: 'sarah.chen@techcorp.io',
      password: 'Password123!',
    };
    setFormData(demoCredentials);
    setFormErrors({});
    dispatch(demoLoginUser());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Sign In | ConnectHub</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              CH
            </div>
            <span className="font-bold text-2xl text-gray-900 tracking-tight">
              Connect<span className="text-brand-600">Hub</span>
            </span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Stay connected with your professional network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-xs uppercase tracking-wider">
                  {error.includes('unreachable') || error.includes('server') ? 'Connection Error' : 'Authentication Error'}
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  {typeof error === 'string' ? error : 'Authentication failed'}
                </p>
                {(error.includes('unreachable') || error.includes('port 5000')) && (
                  <div className="mt-2 text-[11px] bg-red-100/70 border border-red-200 text-red-800 rounded p-2">
                    <span className="font-medium">Quick Fix:</span> Run{' '}
                    <code className="bg-white px-1 py-0.5 rounded font-mono border border-red-300">npm run dev</code>{' '}
                    in your terminal to start both backend & frontend servers concurrently.
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 mr-2"
                />
                Remember me
              </label>
              <a href="#" className="font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Helper Section (Enabled in development or when explicitly configured) */}
          {(process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true') && (
            <div className="mt-6 pt-5 border-t border-gray-200">
              <div className="relative flex justify-center text-xs uppercase mb-3">
                <span className="bg-white px-2 text-gray-500 font-medium">Demo Experience</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="md"
                icon={<Sparkles className="w-4 h-4 text-brand-600" />}
                onClick={handleDemoFill}
                disabled={loading}
                className="border border-gray-300 hover:bg-gray-50"
              >
                Demo Login (Instant Sign-in)
              </Button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Auto-fills credentials for test account: <code>sarah.chen@techcorp.io</code>
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
            New to ConnectHub?{' '}
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Join now
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
