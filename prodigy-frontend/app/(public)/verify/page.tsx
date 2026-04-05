'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { certificatesApi } from '@/lib/api';
import type { CertificateVerification } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AxiosError } from 'axios';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

// ─── Result States ────────────────────────────────────────────────────────────
type VerifyState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; data: CertificateVerification }
  | { status: 'pending' }
  | { status: 'invalid' };

// ─── Inner component (uses useSearchParams — must be in Suspense) ─────────────
function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cin, setCin] = useState(searchParams.get('cin') ?? '');
  const [result, setResult] = useState<VerifyState>({ status: 'idle' });

  // Auto-verify if CIN is in URL on mount
  useEffect(() => {
    const urlCin = searchParams.get('cin');
    if (urlCin) {
      handleVerify(urlCin);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(cinToVerify?: string) {
    const target = (cinToVerify ?? cin).trim().toUpperCase();
    if (!target) return;

    // Update URL so result is shareable
    router.replace(`/verify?cin=${encodeURIComponent(target)}`);
    setResult({ status: 'loading' });

    try {
      const { data } = await certificatesApi.verify(target);
      setResult({ status: 'valid', data: data.data });
    } catch (err) {
      if (err instanceof AxiosError) {
        const code = err.response?.data?.error?.code;
        if (code === 'CERTIFICATE_PENDING') {
          setResult({ status: 'pending' });
        } else {
          setResult({ status: 'invalid' });
        }
      } else {
        setResult({ status: 'invalid' });
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white
      flex flex-col items-center justify-center px-4 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16
          bg-primary-600 rounded-2xl mb-4">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Certificate Verification
        </h1>
        <p className="text-gray-500 mt-2 max-w-md">
          Enter a Certificate Identification Number (CIN) to verify the
          authenticity of a Prodigy InfoTech certificate.
        </p>
      </div>

      {/* Verify Form */}
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. PI-250201-A3K9Q"
                value={cin}
                onChange={(e) => setCin(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="font-mono"
              />
            </div>
            <Button
              onClick={() => handleVerify()}
              isLoading={result.status === 'loading'}
              disabled={!cin.trim()}
              size="md"
            >
              Verify
            </Button>
          </div>

          {/* ── Result ── */}
          {result.status === 'valid' && (
            <div className="mt-6 bg-green-50 border border-green-200
              rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={20} />
                <span className="font-semibold text-lg">
                  Valid Certificate
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Certificate ID
                  </p>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">
                    {result.data.cin}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Issued Date
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {new Date(result.data.issuedDate).toLocaleDateString(
                      'en-IN',
                      { day: 'numeric', month: 'long', year: 'numeric' }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Certificate Holder
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {result.data.holderName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Internship Track
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {result.data.trackName}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-2 border-t border-green-200">
                Verified {result.data.verifiedCount} time
                {result.data.verifiedCount !== 1 ? 's' : ''} ·
                Issued by Prodigy InfoTech
              </p>
            </div>
          )}

          {result.status === 'pending' && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200
              rounded-xl p-6 flex items-start gap-3">
              <Clock size={20} className="text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">
                  Certificate Not Yet Issued
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  This certificate exists but has not been issued yet.
                  Certificates are sent after the batch end date.
                  Please check back later.
                </p>
              </div>
            </div>
          )}

          {result.status === 'invalid' && (
            <div className="mt-6 bg-red-50 border border-red-200
              rounded-xl p-6 flex items-start gap-3">
              <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">
                  Invalid Certificate
                </p>
                <p className="text-sm text-red-700 mt-1">
                  No certificate found with this CIN. Please double-check
                  the number and try again. CINs are case-insensitive.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          All Prodigy InfoTech certificates include a unique CIN that can
          be verified here at any time.
        </p>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense ───────────────────────────────────────────────
// useSearchParams requires Suspense in Next.js App Router
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}