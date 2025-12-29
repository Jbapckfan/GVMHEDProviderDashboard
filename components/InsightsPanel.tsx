"use client";

import { DataInsight, HealthcareMetrics } from '@/lib/dataAnalyzer';
import Card from './Card';

/**
 * InsightsPanel - Display AI-generated insights and healthcare metrics
 */

interface InsightsPanelProps {
  insights: DataInsight[];
  healthcareMetrics?: HealthcareMetrics;
}

export default function InsightsPanel({ insights, healthcareMetrics }: InsightsPanelProps) {
  if (insights.length === 0 && !healthcareMetrics) {
    return null;
  }

  const getInsightIcon = (type: DataInsight['type']) => {
    switch (type) {
      case 'trend':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'anomaly':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'recommendation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getSeverityColor = (severity?: DataInsight['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-[#5E6AD2] bg-[#5E6AD2]/10 border-[#5E6AD2]/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Healthcare Metrics */}
      {healthcareMetrics && (
        <Card variant="gradient" className="p-6">
          <h3 className="text-xl font-semibold text-[#EDEDEF] mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#5E6AD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Healthcare Metrics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthcareMetrics.patientVolume !== undefined && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs font-mono tracking-wider uppercase text-[#8A8F98] mb-1">Patient Volume</p>
                <p className="text-3xl font-semibold gradient-text-accent">
                  {healthcareMetrics.patientVolume.toLocaleString()}
                </p>
              </div>
            )}

            {healthcareMetrics.averageWaitTime !== undefined && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs font-mono tracking-wider uppercase text-[#8A8F98] mb-1">Avg Wait Time</p>
                <p className="text-3xl font-semibold gradient-text-accent">
                  {healthcareMetrics.averageWaitTime.toFixed(0)} <span className="text-base text-[#8A8F98]">min</span>
                </p>
              </div>
            )}

            {healthcareMetrics.peakHours && healthcareMetrics.peakHours.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs font-mono tracking-wider uppercase text-[#8A8F98] mb-1">Peak Hours</p>
                <p className="text-xl font-semibold text-[#EDEDEF]">
                  {healthcareMetrics.peakHours[0]}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold text-[#EDEDEF] mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#5E6AD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Insights
          </h3>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`
                  rounded-xl p-4 border transition-all duration-200
                  ${getSeverityColor(insight.severity)}
                  hover:scale-[1.01]
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#EDEDEF] mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-[#8A8F98]">
                      {insight.description}
                    </p>
                    {insight.value !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-1 rounded bg-white/[0.05] border border-white/[0.10] text-[#EDEDEF]">
                          {typeof insight.value === 'number' ? insight.value.toLocaleString() : insight.value}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
