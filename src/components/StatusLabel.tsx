import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Wrench, AlertTriangle } from 'lucide-react';
import { ProjectStatus } from '../types/psu';
import { getStatusMeta } from '../utils/formatters';

interface StatusLabelProps {
  status: ProjectStatus;
  compact?: boolean;
}

export const StatusLabel: React.FC<StatusLabelProps> = ({ status, compact = false }) => {
  const meta = getStatusMeta(status);

  const Icon =
    status === 'BAST_SELESAI_BMD'
      ? CheckCircle2
      : status === 'BA_ADMIN_PEMELIHARAAN'
        ? Clock
        : status === 'PERBAIKAN_DEFECT' || status === 'PROSES_ADMIN'
          ? Wrench
          : status === 'TERLANTAR_PAILIT'
            ? AlertTriangle
            : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.textClass} ${meta.bgClass} border ${meta.borderClass} px-2 py-0.5 rounded`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="whitespace-nowrap">{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
};
