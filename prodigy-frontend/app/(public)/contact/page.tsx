'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contactApi } from '@/lib/api';
import { AxiosError } from 'axios';
import { CheckCircle, ArrowLeft, Mail, MessageSquare } from 'lucide-react';

const contactSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const messageLength = watch('message', '').length;

  async function onSubmit(data: ContactFormData) {
    setServerError(null);
    try {
      await contactApi.submit({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        message: data.message,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        setServerError(
          err.response?.data?.error?.message ?? 'Failed to send message.'
        );
      } else {
        setServerError('An unexpected error occurred.');
      }
    }
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Message Sent!
            </h1>
            <p className="text-gray-500 mb-8">
              Thank you for reaching out. Our team will get back to you within 24 hours.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline"
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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Contact info sidebar ── */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Get in Touch</h1>
              <p className="text-gray-500 text-sm mt-2">
                Have a question about your application or certificate? We're here to help.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <a
                    href="mailto:support@prodigyinfotech.dev"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    support@prodigyinfotech.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Response Time</p>
                  <p className="text-sm text-gray-500">Within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <p className="text-xs text-primary-800 font-medium mb-1">Quick answers</p>
              <p className="text-xs text-primary-700">
                Check our{' '}
                <Link href="/#faq" className="underline">
                  FAQ section
                </Link>{' '}
                for instant answers to common questions.
              </p>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
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
                {...register('email')}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                hint="Optional — for faster support"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('message')}
                  rows={5}
                  placeholder="Describe your question or issue in detail..."
                  className={`block w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                <div className="flex items-center justify-between">
                  {errors.message ? (
                    <p className="text-xs text-red-600">{errors.message.message}</p>
                  ) : (
                    <span />
                  )}
                  <p
                    className={`text-xs ${
                      messageLength > 1800 ? 'text-red-500' : 'text-gray-400'
                    }`}
                  >
                    {messageLength}/2000
                  </p>
                </div>
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
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}