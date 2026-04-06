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
import { CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────
const applySchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Please enter a valid phone number'),
  gender: z
    .string()
    .refine((v) => ['Male', 'Female', 'Other'].includes(v), {
      message: 'Please select your gender',
    }),
  highestQualification: z
    .string()
    .min(1, 'Please enter your qualification'),
  collegeName: z
    .string()
    .min(2, 'Please enter your college name (do not use abbreviations)'),
  passingYear: z.string().min(1, 'Please select your passing year'),
  country: z.string().min(1, 'Please select your country'),
  trackSlug: z.string().min(1, 'Please select an internship track'),
  joinedSocials: z.boolean().refine((v) => v === true, {
    message: 'Please join all community channels before applying',
  }),
});

type ApplyFormData = z.infer<typeof applySchema>;

interface SuccessData {
  trackName: string;
  applicantName: string;
}

const PASSING_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', 'Other'];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'UAE',
  'Other',
];

// ─── Apply Form ───────────────────────────────────────────────────────────────
function ApplyForm() {
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

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
      country: 'India',
      joinedSocials: false,
    },
  });

  async function onSubmit(data: ApplyFormData) {
    setServerError(null);
    try {
      const { data: res } = await applicationsApi.create({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        trackSlug: data.trackSlug,
        gender: data.gender,
        collegeName: data.collegeName,
        highestQualification: data.highestQualification,
        passingYear: data.passingYear,
        country: data.country,
        joinedSocials: data.joinedSocials,
      });
      setSuccessData({
        trackName: res.data.track.name,
        applicantName: res.data.applicant.name,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        const code = err.response?.data?.error?.code;
        if (code === 'DUPLICATE_APPLICATION') {
          setServerError(
            'You have already applied for an internship this month. Please wait until next month.'
          );
        } else {
          setServerError(
            err.response?.data?.error?.message ?? 'Something went wrong.'
          );
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
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application Submitted!
              </h1>
              <p className="text-gray-600">
                Your application for <strong>{successData.trackName}</strong> has been received.
              </p>
            </div>

            {/* Reference removed — students identify by email */}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-1">
                Joined us at LinkedIn, Telegram & Instagram?
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Stay updated with announcements, task updates, and connect with other interns
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  {
                    name: 'LinkedIn',
                    url: 'https://www.linkedin.com/company/prodigy-infotech/',
                    color: '#0077b5',
                  },
                  {
                    name: 'Telegram',
                    url: 'https://t.me/prodigy_infotech',
                    color: '#0088cc',
                  },
                  {
                    name: 'Instagram',
                    url: 'https://instagram.com/prodigy_infotech',
                    color: '#e1306c',
                  },
                ].map(({ name, url, color }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all text-sm font-medium"
                    style={{ color }}
                  >
                    {name}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-gray-900 text-lg border-b pb-2">
                📋 Next Steps & Instructions
              </h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-1">⏰ When to Start</h4>
                <p className="text-sm text-gray-700">
                  Only start tasks <strong>after your internship begins</strong>.
                  The start date will be in your <strong>Offer Letter email</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="font-bold text-emerald-900 mb-2">
                    🏆 Certificate Requirements
                  </h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• <strong>2 Tasks</strong> → Completion Certificate</li>
                    <li>• <strong>4 Tasks</strong> → Letter of Recommendation</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 mb-2">
                    📂 GitHub Repository
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Name your repos:
                  </p>
                  <code className="text-xs font-mono bg-white border rounded px-2 py-1 block text-blue-900">
                    Prodigy_[Track]_[TaskNo]
                  </code>
                  <p className="text-xs text-blue-700 mt-1">
                    e.g. <code>Prodigy_WD_02</code>
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-bold text-purple-900 mb-1">📢 LinkedIn Posts</h4>
                <p className="text-sm text-purple-800">
                  <strong>Mandatory:</strong> Post on LinkedIn after <strong>each task</strong>.
                  Tag <strong>Prodigy InfoTech</strong> and use <strong>#ProdigyInfoTech</strong>.
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h4 className="font-bold text-indigo-900 mb-1">🛠️ Guidelines</h4>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• Self-paced — no fixed timings</li>
                  <li>• Any programming language allowed</li>
                  <li>• Task Submission Form sent mid-internship</li>
                  <li>• Track-specific guidelines in your Offer Letter</li>
                </ul>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 border-t pt-4 mb-4">
              ✅ Confirmation email sent · ⏳ Check spam folder ·
              📅 Offer Letter sent on 1st or 15th of month
            </div>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-gray-700 font-medium px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Apply for Internship
          </h1>
          <p className="text-gray-500 text-sm mb-2">
            All virtual internships are for <strong>4 weeks</strong>.
            Fill in your details carefully — this information will appear on
            your Offer Letter and Certificate.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
            <p className="font-semibold mb-1">Perks of our Internships:</p>
            <ul className="space-y-0.5">
              <li>• Offer Letter</li>
              <li>• Industry Experience</li>
              <li>• <strong>Verified Internship Certificate</strong></li>
              <li>• Letter of Recommendation (as per performance)</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="As you want it on your certificate"
              required
              error={errors.fullName?.message}
              hint="Fill precisely as you wish it to appear on the certificate"
              {...register('fullName')}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                {...register('gender')}
                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${
                  errors.gender ? 'border-red-300 text-red-900' : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select gender...</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              {errors.gender && (
                <p className="text-xs text-red-600">{errors.gender.message}</p>
              )}
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              required
              error={errors.email?.message}
              hint="Offer Letter and Certificate will be sent here"
              {...register('email')}
            />

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="+91 9876543210 (include country code)"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Internship Track <span className="text-red-500">*</span>
              </label>
              <select
                {...register('trackSlug')}
                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${
                  errors.trackSlug ? 'border-red-300 text-red-900' : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select a track...</option>
                {tracks.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
              {errors.trackSlug && (
                <p className="text-xs text-red-600">{errors.trackSlug.message}</p>
              )}
            </div>

            <Input
              label="Highest Academic Qualification"
              placeholder="e.g. B.Tech / B.E / M.C.A"
              required
              error={errors.highestQualification?.message}
              hint="Most recent or currently pursuing academic degree"
              {...register('highestQualification')}
            />

            <Input
              label="College Name"
              placeholder="Full college name (no abbreviations)"
              required
              error={errors.collegeName?.message}
              hint="Do NOT use short forms like 'MU' for Mumbai University"
              {...register('collegeName')}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Passing Year <span className="text-red-500">*</span>
              </label>
              <select
                {...register('passingYear')}
                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${
                  errors.passingYear ? 'border-red-300 text-red-900' : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select passing year...</option>
                {PASSING_YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              {errors.passingYear && (
                <p className="text-xs text-red-600">{errors.passingYear.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                {...register('country')}
                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${
                  errors.country ? 'border-red-300 text-red-900' : 'border-gray-300 text-gray-900'
                }`}
              >
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              {errors.country && (
                <p className="text-xs text-red-600">{errors.country.message}</p>
              )}
            </div>

            <div className={`rounded-xl border p-4 ${
              errors.joinedSocials ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <p className="text-sm font-medium text-gray-800 mb-3">
                Joined us at LinkedIn, Telegram & Instagram? <span className="text-red-500">*</span>
              </p>
              <div className="flex gap-3 mb-3">
                {[
                  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/prodigy-infotech/' },
                  { name: 'Telegram', url: 'https://t.me/prodigy_infotech' },
                  { name: 'Instagram', url: 'https://instagram.com/prodigy_infotech' },
                ].map(({ name, url }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs font-medium bg-white border border-gray-200 rounded-lg py-2 hover:bg-blue-50 hover:border-blue-300 transition-colors text-blue-600"
                  >
                    {name} ↗
                  </a>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('joinedSocials')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Yes, I have joined all channels
                </span>
              </label>
              {errors.joinedSocials && (
                <p className="text-xs text-red-600 mt-2">
                  {errors.joinedSocials.message}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <strong>Note:</strong> You can apply for one internship per month.
              Offer Letters are processed on the 1st and 15th of each month.
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

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