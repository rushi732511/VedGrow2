'use client';

import { useEffect, useState } from 'react';
import { adminBatchesApi, tracksApi } from '@/lib/api';
import type { Batch, Track } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BatchStatusBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Send, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';

// ─── Validation ───────────────────────────────────────────────────────────────
const createBatchSchema = z.object({
  trackId: z.string().min(1, 'Please select a track'),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((val) => {
      const day = new Date(val).getUTCDate();
      return day === 1 || day === 15;
    }, 'Start date must be the 1st or 15th of the month'),
});

type CreateBatchForm = z.infer<typeof createBatchSchema>;

// ─── Task Form Modal State ────────────────────────────────────────────────────
interface TaskFormModal {
  batchId: string;
  batchName: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskFormModal, setTaskFormModal] = useState<TaskFormModal | null>(null);
  const [taskFormUrl, setTaskFormUrl] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBatchForm>({
    resolver: zodResolver(createBatchSchema),
  });

  // ── Fetch data ─────────────────────────────────────────────────────────────
  async function fetchBatches() {
    try {
      const { data } = await adminBatchesApi.list();
      setBatches(data.data.batches);
    } catch {
      setErrorMessage('Failed to load batches.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBatches();
    tracksApi.list().then(({ data }) => setTracks(data.data.tracks));
  }, []);

  // ── Flash message helper ───────────────────────────────────────────────────
  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  function showError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  }

  // ── Create batch ───────────────────────────────────────────────────────────
  async function onCreateBatch(formData: CreateBatchForm) {
    try {
      await adminBatchesApi.create(formData);
      showSuccess('Batch created successfully.');
      reset();
      setShowCreateForm(false);
      fetchBatches();
    } catch (err) {
      if (err instanceof AxiosError) {
        showError(err.response?.data?.error?.message ?? 'Failed to create batch.');
      }
    }
  }

  // ── Update batch status ────────────────────────────────────────────────────
  async function handleStatusUpdate(
    batchId: string,
    status: 'OPEN' | 'ACTIVE' | 'COMPLETED'
  ) {
    const label = status === 'ACTIVE' ? 'activate' : 'complete';
    if (!confirm(`Are you sure you want to ${label} this batch?`)) return;

    setActionLoading(batchId + status);
    try {
      await adminBatchesApi.updateStatus(batchId, status);
      showSuccess(`Batch marked as ${status}.`);
      fetchBatches();
    } catch (err) {
      if (err instanceof AxiosError) {
        showError(err.response?.data?.error?.message ?? 'Failed to update status.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  // ── Send offer letters ─────────────────────────────────────────────────────
  async function handleSendOfferLetters(batchId: string) {
    if (!confirm('Send offer letters to all enrolled applicants in this batch?')) return;

    setActionLoading(batchId + 'offers');
    try {
      const { data } = await adminBatchesApi.sendOfferLetters(batchId);
      const result = data.data as { sent: number; failed: number };
      showSuccess(`Offer letters: ${result.sent} sent, ${result.failed} failed.`);
    } catch (err) {
      if (err instanceof AxiosError) {
        showError(err.response?.data?.error?.message ?? 'Failed to send offer letters.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  // ── Send task forms ────────────────────────────────────────────────────────
  async function handleSendTaskForms() {
    if (!taskFormModal || !taskFormUrl) return;

    setActionLoading(taskFormModal.batchId + 'tasks');
    try {
      const { data } = await adminBatchesApi.sendTaskForms(
        taskFormModal.batchId,
        taskFormUrl
      );
      const result = data.data as { sent: number; failed: number };
      showSuccess(`Task forms: ${result.sent} sent, ${result.failed} failed.`);
      setTaskFormModal(null);
      setTaskFormUrl('');
    } catch (err) {
      if (err instanceof AxiosError) {
        showError(err.response?.data?.error?.message ?? 'Failed to send task forms.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage internship cohorts and email workflows
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus size={16} />
          New Batch
        </Button>
      </div>

      {/* Flash messages */}
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

      {/* ── Create Batch Form ── */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New Batch</h2>
          <form onSubmit={handleSubmit(onCreateBatch)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Track select */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Track <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('trackId')}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select a track...</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.trackId && (
                  <p className="text-xs text-red-600">{errors.trackId.message}</p>
                )}
              </div>

              {/* Start date */}
              <Input
                label="Start Date"
                type="date"
                required
                error={errors.startDate?.message}
                hint="Must be the 1st or 15th of the month"
                {...register('startDate')}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" isLoading={isSubmitting}>
                Create Batch
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowCreateForm(false); reset(); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Batches List ── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16
          text-center text-gray-400">
          No batches yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">

                {/* Batch info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {batch.track?.name ?? 'Unknown Track'}
                    </h3>
                    <BatchStatusBadge status={batch.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(batch.startDate).toLocaleDateString()} →{' '}
                    {new Date(batch.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {batch.currentCount} / {batch.capacity} applicants
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">

                  {/* Send offer letters */}
                  {batch.status !== 'OPEN' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSendOfferLetters(batch.id)}
                      isLoading={actionLoading === batch.id + 'offers'}
                    >
                      <Mail size={14} />
                      Send Offer Letters
                    </Button>
                  )}

                  {/* Send task forms */}
                  {batch.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setTaskFormModal({
                          batchId: batch.id,
                          batchName: batch.track?.name ?? 'Batch',
                        })
                      }
                    >
                      <Send size={14} />
                      Send Task Forms
                    </Button>
                  )}

                  {/* Status transition buttons */}
                  {batch.status === 'OPEN' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(batch.id, 'ACTIVE')}
                      isLoading={actionLoading === batch.id + 'ACTIVE'}
                    >
                      <ChevronRight size={14} />
                      Activate
                    </Button>
                  )}

                  {batch.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusUpdate(batch.id, 'COMPLETED')}
                      isLoading={actionLoading === batch.id + 'COMPLETED'}
                    >
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Task Form URL Modal ── */}
      {taskFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">
              Send Task Submission Form
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {taskFormModal.batchName} batch
            </p>

            <Input
              label="Google Form URL"
              type="url"
              placeholder="https://forms.google.com/..."
              value={taskFormUrl}
              onChange={(e) => setTaskFormUrl(e.target.value)}
              hint="This link will be included in the email sent to all enrolled applicants"
            />

            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleSendTaskForms}
                isLoading={actionLoading === taskFormModal.batchId + 'tasks'}
                disabled={!taskFormUrl}
              >
                Send Emails
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setTaskFormModal(null); setTaskFormUrl(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}