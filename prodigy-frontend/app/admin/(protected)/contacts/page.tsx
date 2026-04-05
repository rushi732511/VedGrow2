'use client';

import { useEffect, useState } from 'react';
import { adminContactsApi } from '@/lib/api';
import type { ContactSubmission } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle } from 'lucide-react';
import { AxiosError } from 'axios';

export default function ContactsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterResolved, setFilterResolved] = useState('false');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  async function fetchSubmissions() {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {};
      if (filterResolved !== '') params.isResolved = filterResolved;
      const { data } = await adminContactsApi.list(params);
      setSubmissions(data.data.submissions);
      setTotal(data.meta.total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchSubmissions(); }, [filterResolved]);

  async function handleResolve(id: string) {
    setActionLoading(id);
    try {
      await adminContactsApi.resolve(id);
      showSuccess('Marked as resolved.');
      fetchSubmissions();
    } catch (err) {
      if (err instanceof AxiosError) {
        setErrorMessage(err.response?.data?.error?.message ?? 'Failed to resolve.');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">{total} submissions</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm">
          ✅ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
          ❌ {errorMessage}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Show:</span>
        {[
          { label: 'Unresolved', value: 'false' },
          { label: 'Resolved', value: 'true' },
          { label: 'All', value: '' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterResolved(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterResolved === opt.value
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Submissions list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16
          text-center text-gray-400">
          No submissions found.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id}
              className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{sub.fullName}</p>
                    <Badge variant={sub.isResolved ? 'success' : 'warning'}>
                      {sub.isResolved ? 'Resolved' : 'Open'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {sub.email}
                    {sub.phone && ` · ${sub.phone}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(sub.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpanded(expanded === sub.id ? null : sub.id)
                    }
                  >
                    {expanded === sub.id ? 'Hide' : 'Read'}
                  </Button>
                  {!sub.isResolved && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResolve(sub.id)}
                      isLoading={actionLoading === sub.id}
                    >
                      <CheckCircle size={14} />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded message */}
              {expanded === sub.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {sub.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}