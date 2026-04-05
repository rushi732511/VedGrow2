'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminCertificatesApi } from '@/lib/api';
import type { Certificate } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Award, CheckCircle, Clock, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { AxiosError } from 'axios';
import Link from 'next/link';

interface Meta {
  total: number;
  page: number;
  totalPages: number;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterActivated, setFilterActivated] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generateAppId, setGenerateAppId] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper for consistent error reporting
  const handleError = (err: unknown, defaultMsg: string) => {
    if (err instanceof AxiosError) {
      setErrorMessage(err.response?.data?.error?.message ?? defaultMsg);
    } else {
      setErrorMessage(defaultMsg);
    }
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Memoized fetch to use in useEffect and after actions
  const fetchCertificates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit: 20 };
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

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  async function handleGenerate() {
    if (!generateAppId.trim()) return;
    setActionLoading('generate');
    try {
      const { data } = await adminCertificatesApi.generate(generateAppId.trim());
      showSuccess(`Certificate generated: ${data.data.certificate.cin}`);
      setGenerateAppId('');
      fetchCertificates();
    } catch (err) {
      handleError(err, 'Failed to generate certificate.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivate(cin: string) {
    if (!confirm(`Activate certificate ${cin}? This will send the email.`)) return;
    setActionLoading(cin);
    try {
      await adminCertificatesApi.activate(cin);
      showSuccess(`Certificate ${cin} activated.`);
      fetchCertificates();
    } catch (err) {
      handleError(err, 'Failed to activate.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and issue official completion records.</p>
      </section>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm animate-in fade-in">
          ✅ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm animate-in fade-in">
          ❌ {errorMessage}
        </div>
      )}

      {/* Action Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Manual Generation</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Application ID (e.g. app_123...)"
            value={generateAppId}
            onChange={(e) => setGenerateAppId(e.target.value)}
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Button onClick={handleGenerate} isLoading={actionLoading === 'generate'} disabled={!generateAppId.trim()}>
            <Award size={16} className="mr-2" />
            Generate
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Filter Status:</span>
        {[
          { label: 'All', value: '' },
          { label: 'Activated', value: 'true' },
          { label: 'Pending', value: 'false' },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => { setFilterActivated(opt.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterActivated === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-auto">{meta.total} records found</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : certificates.length === 0 ? (
          <div className="p-20 text-center text-gray-400 italic">No certificates match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">CIN</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Holder</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-700 font-bold">{cert.cin}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{cert.user?.fullName}</div>
                      <div className="text-xs text-gray-500">{cert.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={cert.isActivated ? "success" : "warning"}>
                        {cert.isActivated ? <CheckCircle size={12} className="mr-1"/> : <Clock size={12} className="mr-1"/>}
                        {cert.isActivated ? 'Activated' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!cert.isActivated ? (
                        <Button size="sm" onClick={() => handleActivate(cert.cin)} isLoading={actionLoading === cert.cin}>
                          Activate
                        </Button>
                      ) : (
                        <Link 
                          href={`/verify?cin=${cert.cin}`} 
                          target="_blank" 
                          className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
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

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}