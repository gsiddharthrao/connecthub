import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUser, clearAuthError } from '../store/slices/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    headline: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, router, dispatch]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
    dispatch(registerUser(formData));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Join ConnectHub | Professional Community</title>
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
          Make the most of your professional life
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join your colleagues, classmates, and industry peers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-xs uppercase tracking-wider">
                  {error.includes('unreachable') || error.includes('server') ? 'Connection Error' : 'Registration Error'}
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  {typeof error === 'string' ? error : 'Registration failed'}
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
              label="Full Name"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Sarah Chen"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              required
            />

            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
            />

            <Input
              label="Professional Headline (Optional)"
              id="headline"
              name="headline"
              type="text"
              placeholder="e.g. Senior Software Engineer at TechCorp"
              value={formData.headline}
              onChange={handleChange}
              helperText="Brief summary of your current role or specialty"
            />

            <Input
              label="Password (6 or more characters)"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Choose a strong password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
            />

            <p className="text-xs text-gray-500 pt-1">
              By clicking Agree & Join, you agree to the ConnectHub User Agreement,
              Privacy Policy, and Cookie Policy.
            </p>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              className="mt-2"
            >
              Agree & Join
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
            Already on ConnectHub?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
