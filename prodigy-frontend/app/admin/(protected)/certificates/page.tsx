'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminCertificatesApi, adminApplicationsApi, adminLorApi } from '@/lib/api';
import type { Certificate, Application } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Award, CheckCircle, Clock,
  ChevronLeft, ChevronRight, Link2, ExternalLink,
} from 'lucide-react';
import { AxiosError } from 'axios';
import Link from 'next/link';

interface Meta { total: number; page: number; totalPages: number; }

export default function CertificatesPage() {
  // ── Certificates list state ──────────────────────────────────────────────
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterActivated, setFilterActivated] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Bulk generation state ────────────────────────────────────────────────
  const [completedApps, setCompletedApps] = useState<Application[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    success: string[]; failed: { applicationId: string; reason: string }[];
  } | null>(null);

  // ── LoR state ────────────────────────────────────────────────────────────
  const [lorApps, setLorApps] = useState<Application[]>([]);
  const [lorLoading, setLorLoading] = useState<string | null>(null);

  // ── Flash messages ───────────────────────────────────────────────────────
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  function showError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  }

  function handleError(err: unknown, defaultMsg: string) {
    if (err instanceof AxiosError) {
      showError(err.response?.data?.error?.message ?? defaultMsg);
    } else {
      showError(defaultMsg);
    }
  }

  // ── Fetch certificates ───────────────────────────────────────────────────
  const fetchCertificates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page, limit: 20,
      };
      if (filterActivated !== '') params.isActivated = filterActivated;
      const { data } = await adminCertificatesApi.list(params);
      setCertificates(data.data.certificates);
      setMeta(data.meta as Meta);
    } catch (err) {
      handleError(err, 'Failed to load certificates.');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterActivated]);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  // ── Fetch completed applications (for bulk generation) ───────────────────
  useEffect(() => {
    adminApplicationsApi
      .list({ status: 'COMPLETED', limit: 100 })
      .then(({ data }) => setCompletedApps(data.data.applications))
      .catch(() => {});

    adminLorApi
      .getEligible()
      .then(({ data }) => setLorApps(data.data.applications))
      .catch(() => {});
  }, []);

  // ── Single certificate actions ────────────────────────────────────────────
  async function handleGenerate(applicationId: string) {
    setActionLoading('gen-' + applicationId);
    try {
      const { data } = await adminCertificatesApi.generate(applicationId);
      showSuccess(`Certificate generated: ${data.data.certificate.cin}`);
      fetchCertificates();
    } catch (err) {
      handleError(err, 'Failed to generate certificate.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivate(cin: string) {
    if (!confirm(`Activate ${cin}? This will send the certificate email with PDF.`)) return;
    setActionLoading(cin);
    try {
      await adminCertificatesApi.activate(cin);
      showSuccess(`Certificate ${cin} activated and email sent.`);
      fetchCertificates();
    } catch (err) {
      handleError(err, 'Failed to activate.');
    } finally {
      setActionLoading(null);
    }
  }

  // ── Bulk certificate generation ───────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    // Only select apps that don't already have a certificate
    const withoutCert = completedApps
      .filter((a) => !a.certificate)
      .map((a) => a.id);

    if (selectedIds.size === withoutCert.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withoutCert));
    }
  }

  async function handleBulkGenerate() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Generate certificates for ${selectedIds.size} application(s)?`)) return;

    setIsBulkLoading(true);
    setBulkResult(null);
    try {
      const { data } = await adminCertificatesApi.bulkGenerate(
        Array.from(selectedIds)
      );
      const result = data.data as {
        success: string[];
        failed: { applicationId: string; reason: string }[];
      };
      setBulkResult(result);
      setSelectedIds(new Set());
      fetchCertificates();
      showSuccess(
        `Bulk generation: ${result.success.length} succeeded, ${result.failed.length} failed.`
      );
    } catch (err) {
      handleError(err, 'Bulk generation failed.');
    } finally {
      setIsBulkLoading(false);
    }
  }

  // ── LoR sending ───────────────────────────────────────────────────────────
  async function handleSendLor(applicationId: string) {
    if (!confirm('Send Letter of Recommendation email with PDF attachment?')) return;
    setLorLoading(applicationId);
    try {
      await adminLorApi.send(applicationId);
      showSuccess('LoR email queued successfully.');
    } catch (err) {
      handleError(err, 'Failed to send LoR.');
    } finally {
      setLorLoading(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate, activate and manage certificates
        </p>
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

      {/* ── Bulk Certificate Generation ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Bulk Certificate Generation
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {completedApps.filter(a => !a.certificate).length} completed
              applications without certificates
            </p>
          </div>
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkGenerate}
              isLoading={isBulkLoading}
            >
              <Award size={16} />
              Generate {selectedIds.size} Certificate{selectedIds.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        {completedApps.filter(a => !a.certificate).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            All completed applications have certificates.
          </p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        selectedIds.size > 0 &&
                        selectedIds.size ===
                          completedApps.filter(a => !a.certificate).length
                      }
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Track
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completedApps
                  .filter(a => !a.certificate)
                  .map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-gray-50 ${
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
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {app.updatedAt
                        ? new Date(app.updatedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerate(app.id)}
                        isLoading={actionLoading === 'gen-' + app.id}
                      >
                        Generate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bulk result */}
        {bulkResult && (
          <div className="mt-4 space-y-2">
            {bulkResult.success.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Generated: {bulkResult.success.join(', ')}
                </p>
              </div>
            )}
            {bulkResult.failed.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium mb-1">
                  ❌ Failed:
                </p>
                {bulkResult.failed.map((f) => (
                  <p key={f.applicationId} className="text-xs text-red-700">
                    {f.applicationId.slice(0, 8)}: {f.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Letter of Recommendation ── */}
      {lorApps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">
              Letter of Recommendation
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {lorApps.length} applicant{lorApps.length > 1 ? 's' : ''} eligible
              (completed 4 tasks)
            </p>
          </div>

          <div className="space-y-3">
            {lorApps.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4
                  bg-primary-50 border border-primary-200 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {app.user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {app.user?.email} · {app.track?.name}
                  </p>
                  {app.certificate?.cin && (
                    <p className="text-xs text-primary-600 font-mono mt-0.5">
                      CIN: {app.certificate.cin}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSendLor(app.id)}
                  isLoading={lorLoading === app.id}
                  disabled={!app.certificate?.isActivated}
                >
                  Send LoR + PDF
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certificates Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center
          justify-between">
          <h2 className="font-semibold text-gray-900">
            All Certificates ({meta.total})
          </h2>
          <div className="flex items-center gap-2">
            {['', 'true', 'false'].map((val) => (
              <button
                key={val}
                onClick={() => { setFilterActivated(val); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-colors ${
                  filterActivated === val
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {val === '' ? 'All' : val === 'true' ? 'Activated' : 'Pending'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            No certificates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">CIN</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Holder</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Track</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Issued</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Verified</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-700">
                        {cert.cin}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {cert.user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{cert.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{cert.track?.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(cert.issuedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {cert.isActivated ? (
                        <Badge variant="success">
                          <CheckCircle size={12} className="mr-1 inline" />
                          Activated
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock size={12} className="mr-1 inline" />
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {cert.verifiedCount}×
                    </td>
                    <td className="px-6 py-4">
                      {!cert.isActivated ? (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(cert.cin)}
                          isLoading={actionLoading === cert.cin}
                        >
                          Activate & Send
                        </Button>
                      ) : (
                        <Link
                          href={`/verify?cin=${cert.cin}`}
                          target="_blank"
                          className="text-primary-600 hover:underline text-sm
                            inline-flex items-center gap-1"
                        >
                          View <ExternalLink size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center
            justify-between text-sm text-gray-600">
            <span>Page {page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="secondary" size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary" size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= meta.totalPages}
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