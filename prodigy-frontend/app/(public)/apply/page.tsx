'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { applicationsApi, tracksApi } from '@/lib/api';
import type { Track } from '@/lib/types';
import { Navbar } from '@/components/public/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AxiosError } from 'axios';
import { CheckCircle, ArrowLeft } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────
const applySchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Please enter a valid phone number'),
  trackSlug: z.string().min(1, 'Please select an internship track'),
});

type ApplyFormData = z.infer<typeof applySchema>;

interface SuccessData {
  applicationId: string;
  trackName: string;
}

// ─── Form inner component ─────────────────────────────────────────────────────
function ApplyForm() {
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch tracks on mount
  useEffect(() => {
    tracksApi.list().then(({ data }) => setTracks(data.data.tracks));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      trackSlug: searchParams.get('track') ?? '',
    },
  });

  async function onSubmit(data: ApplyFormData) {
    setServerError(null);
    try {
      const { data: res } = await applicationsApi.create(data);
      setSuccessData({
        applicationId: res.data.applicationId,
        trackName: res.data.track.name,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        const code = err.response?.data?.error?.code;
        const message = err.response?.data?.error?.message;

        if (code === 'DUPLICATE_APPLICATION') {
          setServerError(
            'You have already applied for an internship this month. Please wait until next month.'
          );
        } else {
          setServerError(message ?? 'Something went wrong. Please try again.');
        }
      } else {
        setServerError('An unexpected error occurred.');
      }
    }
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-10">
            <div className="inline-flex items-center justify-center w-16 h-16
              bg-green-100 rounded-full mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h1>
            <p className="text-gray-500 mb-6">
              Your application for{' '}
              <strong>{successData.trackName}</strong>{' '}
              has been received.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Application Reference
              </p>
              <p className="font-mono font-bold text-gray-900">
                {successData.applicationId.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="text-sm text-gray-500 space-y-2 text-left mb-8">
              <p>✅ Confirmation email sent to your inbox</p>
              <p>⏳ Check your spam folder if you don't see it</p>
              <p>📅 Offer letter sent on the 1st or 15th after payment</p>
              <p>💳 Complete your ₹129 payment to confirm your spot</p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary-600
                font-medium hover:underline"
            >
              <ArrowLeft size={16} />
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500
            hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Apply for Internship
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Fill in your details below. A ₹129 documentation fee applies.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <Input
              label="Full Name"
              placeholder="Rahul Sharma"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="rahul@example.com"
              required
              error={errors.email?.message}
              hint="We'll send your offer letter and certificate to this email"
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />

            {/* Track select */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Internship Track{' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                {...register('trackSlug')}
                className={`block w-full rounded-lg border px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  focus:border-transparent bg-white
                  ${errors.trackSlug
                    ? 'border-red-300 text-red-900'
                    : 'border-gray-300 text-gray-900'
                  }`}
              >
                <option value="">Select a track...</option>
                {tracks.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.trackSlug && (
                <p className="text-xs text-red-600">
                  {errors.trackSlug.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Fee notice */}
            <div className="bg-primary-50 border border-primary-200
              rounded-lg p-4">
              <p className="text-sm text-primary-800">
                <strong>₹129 documentation fee</strong> — payable after
                submission. Your spot is confirmed only after payment.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ApplyForm />
    </Suspense>
  );
}