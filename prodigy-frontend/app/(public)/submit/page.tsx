'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { taskSubmissionApi } from '@/lib/api';
import { Navbar } from '@/components/public/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AxiosError } from 'axios';
import {
  CheckCircle, ArrowLeft, Link2, ExternalLink,
  AlertCircle, CreditCard, Award
} from 'lucide-react';

// ─── Razorpay types ───────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayInstance {
  open(): void;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const urlOptional = z
  .string()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal(''));

const submitSchema = z.object({
  task1GithubUrl:   urlOptional,
  task1LinkedinUrl: urlOptional,
  task2GithubUrl:   urlOptional,
  task2LinkedinUrl: urlOptional,
  task3GithubUrl:   urlOptional,
  task3LinkedinUrl: urlOptional,
  task4GithubUrl:   urlOptional,
  task4LinkedinUrl: urlOptional,
}).refine(
  (d) => (d.task1GithubUrl && d.task1LinkedinUrl) ||
         (d.task2GithubUrl && d.task2LinkedinUrl) ||
         (d.task3GithubUrl && d.task3LinkedinUrl) ||
         (d.task4GithubUrl && d.task4LinkedinUrl),
  { message: 'Please submit at least 1 complete task (both GitHub and LinkedIn links)' }
);

type SubmitFormData = z.infer<typeof submitSchema>;

// ─── Task input pair ──────────────────────────────────────────────────────────
function TaskInputPair({
  taskNumber,
  register,
  errors,
}: {
  taskNumber: 1 | 2 | 3 | 4;
  register: ReturnType<typeof useForm<SubmitFormData>>['register'];
  errors: ReturnType<typeof useForm<SubmitFormData>>['formState']['errors'];
}) {
  const ghKey = `task${taskNumber}GithubUrl` as keyof SubmitFormData;
  const liKey = `task${taskNumber}LinkedinUrl` as keyof SubmitFormData;

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full
          flex items-center justify-center text-sm font-bold">
          {taskNumber}
        </div>
        <span className="font-semibold text-gray-900 text-sm">
          Task {taskNumber}
          {taskNumber <= 2 && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              (required for Certificate)
            </span>
          )}
          {taskNumber > 2 && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              (required for LoR)
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="relative">
          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 pointer-events-none" />
          <input
            {...register(ghKey)}
            type="url"
            placeholder="https://github.com/yourusername/repo-name"
            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors[ghKey] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
          />
          {errors[ghKey] && (
            <p className="text-xs text-red-600 mt-1">
              {errors[ghKey]?.message as string}
            </p>
          )}
        </div>

        <div className="relative">
          <ExternalLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 pointer-events-none" />
          <input
            {...register(liKey)}
            type="url"
            placeholder="https://linkedin.com/posts/your-post-id"
            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors[liKey] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
          />
          {errors[liKey] && (
            <p className="text-xs text-red-600 mt-1">
              {errors[liKey]?.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({
  tasksCompleted,
  eligibleForCert,
  eligibleForLor,
}: {
  tasksCompleted: number;
  eligibleForCert: boolean;
  eligibleForLor: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-10">
          <div className="inline-flex items-center justify-center w-20 h-20
            bg-green-100 rounded-full mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Submission Complete!
          </h1>
          <p className="text-gray-500 mb-8">
            Your tasks and payment have been received.
          </p>

          <div className="space-y-3 text-left mb-8">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Award size={20} className="text-primary-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Tasks Submitted: {tasksCompleted}
                </p>
                <p className="text-xs text-gray-500">
                  {eligibleForCert
                    ? '✅ Eligible for Certificate of Completion'
                    : '❌ Need at least 2 tasks for certificate'}
                </p>
              </div>
            </div>

            {eligibleForLor && (
              <div className="flex items-center gap-3 p-3 bg-primary-50
                rounded-xl border border-primary-200">
                <Award size={20} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary-900">
                    🎉 Eligible for Letter of Recommendation!
                  </p>
                  <p className="text-xs text-primary-700">
                    You completed 4 tasks — outstanding performance.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 space-y-2 text-left mb-8
            bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="font-semibold text-blue-900 mb-2">What happens next:</p>
            <p>📧 Our team will review your submission</p>
            <p>🏆 Certificate will be emailed after batch end date</p>
            {eligibleForLor && (
              <p>📜 Letter of Recommendation will be emailed separately</p>
            )}
            <p>🔗 Share your certificate using your CIN on our verify page</p>
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

// ─── Main form component ──────────────────────────────────────────────────────
function SubmitForm() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');

  const [serverError, setServerError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    tasksCompleted: number;
    eligibleForCert: boolean;
    eligibleForLor: boolean;
  } | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
  });

  // ── Missing applicationId ──────────────────────────────────────────────────
  if (!applicationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-10">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Invalid Link
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              This link is missing an application ID. Please use the link
              sent to you via email.
            </p>
            <Link href="/" className="text-primary-600 hover:underline text-sm">
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (successData) {
    return <SuccessScreen {...successData} />;
  }

  // ── Payment handler ────────────────────────────────────────────────────────
  async function onSubmit(formData: SubmitFormData) {
    if (!applicationId) return;
    setServerError(null);

    try {
      // 1. Submit tasks to backend → get Razorpay order
      const { data: res } = await taskSubmissionApi.submit({
        applicationId,
        ...formData,
      });

      const { payment } = res.data;
      setIsPaymentLoading(true);

      // 2. Open Razorpay payment widget
      const rzp = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.orderId,
        name: 'Prodigy InfoTech',
        description: 'Internship Task Submission Fee',
        prefill: payment.prefill,
        theme: { color: '#4F46E5' },

        handler: async (response) => {
          // 3. Verify payment with backend
          try {
            const { data: verifyRes } = await taskSubmissionApi.verifyPayment({
              applicationId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setSuccessData({
              tasksCompleted: verifyRes.data.tasksCompleted,
              eligibleForCert: verifyRes.data.eligibleForCert,
              eligibleForLor: verifyRes.data.eligibleForLor,
            });
          } catch {
            setServerError(
              'Payment succeeded but verification failed. Please contact support.'
            );
          } finally {
            setIsPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsPaymentLoading(false);
            setServerError('Payment was cancelled. Your task links have been saved — you can pay again.');
          },
        },
      });

      rzp.open();
    } catch (err) {
      setIsPaymentLoading(false);
      if (err instanceof AxiosError) {
        const code = err.response?.data?.error?.code;
        if (code === 'APPLICATION_NOT_ENROLLED') {
          setServerError(
            'This application is not yet enrolled in a batch. Please wait for your offer letter.'
          );
        } else if (code === 'ALREADY_SUBMITTED') {
          setServerError(
            'You have already submitted and paid. Check your email for confirmation.'
          );
        } else {
          setServerError(
            err.response?.data?.error?.message ?? 'Something went wrong.'
          );
        }
      }
    }
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500
            hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Task Submission Form
          </h1>
          <p className="text-gray-500 text-sm mb-2">
            Submit your GitHub repositories and LinkedIn posts for each
            completed task.
          </p>

          {/* Eligibility reminder */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 mt-4">
            <div className="flex-1 bg-emerald-50 border border-emerald-200
              rounded-xl p-4 text-sm">
              <p className="font-semibold text-emerald-800">
                🏆 Certificate of Completion
              </p>
              <p className="text-emerald-700 mt-0.5">
                Complete at least <strong>2 tasks</strong>
              </p>
            </div>
            <div className="flex-1 bg-primary-50 border border-primary-200
              rounded-xl p-4 text-sm">
              <p className="font-semibold text-primary-800">
                📜 Letter of Recommendation
              </p>
              <p className="text-primary-700 mt-0.5">
                Complete all <strong>4 tasks</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <TaskInputPair taskNumber={1} register={register} errors={errors} />
            <TaskInputPair taskNumber={2} register={register} errors={errors} />
            <TaskInputPair taskNumber={3} register={register} errors={errors} />
            <TaskInputPair taskNumber={4} register={register} errors={errors} />

            {/* Form-level validation error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            )}

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Payment notice */}
            <div className="bg-yellow-50 border border-yellow-200
              rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800">
                    ₹129 documentation fee
                  </p>
                  <p className="text-yellow-700 mt-0.5">
                    A Razorpay payment window will open after you submit.
                    Your task links are saved before payment — if you cancel,
                    your links are safe and you can pay later.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting || isPaymentLoading}
            >
              {isSubmitting
                ? 'Saving tasks...'
                : isPaymentLoading
                ? 'Opening payment...'
                : 'Submit Tasks & Pay ₹129'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SubmitForm />
    </Suspense>
  );
}