'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApplicationsApi, adminBatchesApi } from '@/lib/api';
import type { Application, Batch } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import {
  ApplicationStatusBadge,
  PaymentStatusBadge,
} from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [applications, setApplications] = useState<Application[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBatchId, setBulkBatchId] = useState('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  // Read filters from URL
  const page = Number(searchParams.get('page') ?? 1);
  const status = searchParams.get('status') ?? '';
  const paymentStatus = searchParams.get('paymentStatus') ?? '';
  const search = searchParams.get('search') ?? '';

  // ── Fetch Applications ─────────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setSelectedIds(new Set());
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search) params.search = search;

      const { data } = await adminApplicationsApi.list(params);
      setApplications(data.data.applications);
      setMeta(data.meta as Meta);
    } catch {
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, paymentStatus, search]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // Fetch batches for the assign dropdown
  useEffect(() => {
    adminBatchesApi.list({ status: 'OPEN' })
      .then(({ data }) => setBatches(data.data.batches))
      .catch(() => {});
  }, []);

  // ── URL helpers ────────────────────────────────────────────────────────────
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // reset to page 1 on filter change
    router.push(`?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  }

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', searchInput);
    }, 400); // wait 400ms after user stops typing
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Checkbox selection ─────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    }
  }

  // ── Bulk Actions ───────────────────────────────────────────────────────────
  async function handleBulkAction(action: string) {
    if (selectedIds.size === 0) return;
    if (action === 'assign_batch' && !bulkBatchId) {
      alert('Please select a batch first.');
      return;
    }

    setIsBulkLoading(true);
    try {
      await adminApplicationsApi.bulkAction({
        applicationIds: Array.from(selectedIds),
        action,
        ...(action === 'assign_batch' && { batchId: bulkBatchId }),
      });
      await fetchApplications();
      setBulkBatchId('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Action failed.';
      alert(message);
    } finally {
      setIsBulkLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 text-sm mt-1">
          {meta.total} total applications
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="COMPLETED">Completed</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          {/* Payment filter */}
          <select
            value={paymentStatus}
            onChange={(e) => updateParam('paymentStatus', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Clear filters */}
          {(status || paymentStatus || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/admin/applications');
                setSearchInput('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4
          flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-primary-800">
            {selectedIds.size} selected
          </span>

          <select
            value={bulkBatchId}
            onChange={(e) => setBulkBatchId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-primary-300 rounded-lg
              bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select batch to assign...</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.track?.name} — {new Date(b.startDate).toLocaleDateString()}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={() => handleBulkAction('assign_batch')}
            isLoading={isBulkLoading}
            disabled={!bulkBatchId}
          >
            Assign to Batch
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleBulkAction('mark_completed')}
            isLoading={isBulkLoading}
          >
            Mark Completed
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() => handleBulkAction('mark_withdrawn')}
            isLoading={isBulkLoading}
          >
            Withdraw
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Filter size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No applications match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === applications.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Applicant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Track</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.has(app.id) ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {app.user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{app.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {app.track?.name}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={app.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {app.batch
                        ? new Date(app.batch.startDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center
            justify-between text-sm text-gray-600">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} results
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(meta.page - 1)}
                disabled={meta.page <= 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}