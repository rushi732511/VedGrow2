'use client';

import { useEffect, useState } from 'react';
import { adminEmailsApi } from '@/lib/api';
import type { EmailLog } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function EmailStatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    SENT: 'success', QUEUED: 'info', FAILED: 'danger', BOUNCED: 'warning',
  };
  return <Badge variant={map[status] ?? 'default'}>{status}</Badge>;
}

export default function EmailsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        const { data } = await adminEmailsApi.list(params);
        setLogs(data.data.logs);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
        <p className="text-gray-500 text-sm mt-1">{total} total emails logged</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Status:</span>
        {['', 'SENT', 'FAILED', 'QUEUED', 'BOUNCED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-gray-400">No email logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Recipient</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Template</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Subject</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">{log.recipientEmail}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.templateName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {log.subject ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <EmailStatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {log.sentAt
                        ? new Date(log.sentAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"
                onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}