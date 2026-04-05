'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsApi } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { StatCard } from '@/components/admin/StatCard';
import { ApplicationStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  FileText,
  CreditCard,
  Award,
  Users,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await adminAnalyticsApi.dashboard();
        setStats(data.data);
      } catch {
        setError('Failed to load dashboard stats.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Platform overview and recent activity
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Applications"
          value={stats.overview.totalApplications}
          subtitle={`${stats.overview.thisMonthApplications} this month`}
          icon={FileText}
          color="blue"
          trend={{
            value: stats.overview.monthOverMonthGrowth,
            label: 'vs last month',
          }}
        />
        <StatCard
          title="Payment Conversion"
          value={`${stats.overview.paymentConversionRate}%`}
          subtitle={`${stats.overview.paidApplications} paid applications`}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Certificates Issued"
          value={stats.pipeline.certificatesIssued}
          subtitle={`${stats.pipeline.certificateIssuanceRate}% issuance rate`}
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Enrolled"
          value={stats.pipeline.enrolled}
          subtitle="In active batches"
          icon={Users}
          color="orange"
        />
        <StatCard
          title="Active Batches"
          value={stats.batches.active}
          subtitle={`${stats.batches.open} open for applications`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Open Support Tickets"
          value={stats.support.unresolvedContacts}
          subtitle="Unresolved contact submissions"
          icon={MessageSquare}
          color={stats.support.unresolvedContacts > 10 ? 'orange' : 'green'}
        />
      </div>

      {/* ── Recent Applications ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
        </div>

        {stats.recentApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No applications yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentApplications.map((app) => (
              <div
                key={app.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {app.user?.fullName ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {app.user?.email} · {app.track?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PaymentStatusBadge status={app.paymentStatus} />
                  <ApplicationStatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}