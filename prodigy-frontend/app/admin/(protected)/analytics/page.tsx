'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsApi } from '@/lib/api';
import type { FunnelStage } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAnalyticsApi.funnel()
      .then(({ data }) => setFunnel(data.data.funnel))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
      {error}
    </div>
  );

  const maxCount = Math.max(...funnel.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Internship pipeline conversion funnel
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="font-semibold text-gray-900 mb-6">Conversion Funnel</h2>
        <div className="space-y-5">
          {funnel.map((stage, i) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700
                    text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {stage.stage}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {i > 0 && (
                    <span className={`text-xs font-medium ${
                      stage.conversionFromPrevious >= 75
                        ? 'text-green-600'
                        : stage.conversionFromPrevious >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {stage.conversionFromPrevious}% conversion
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">
                    {stage.count}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${maxCount > 0 ? (stage.count / maxCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {funnel.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {funnel[0]?.count ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Applicants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {funnel[funnel.length - 1]?.count ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Certificates Issued</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {funnel[0]?.count > 0
                  ? Math.round(
                      ((funnel[funnel.length - 1]?.count ?? 0) /
                        funnel[0].count) * 100
                    )
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">End-to-End Rate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}