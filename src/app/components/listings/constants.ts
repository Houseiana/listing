import { PauseIcon, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export const statusConfig: Record<string, { labelKey: string; color: string; dotColor: string; icon: any }> = {
  active: {
    labelKey: 'statusActive',
    color: 'bg-[#ECFDF5] text-[#00BC7D]',
    dotColor: 'bg-[#00BC7D]',
    icon: CheckCircle,
  },
  pending: {
    labelKey: 'statusPending',
    color: 'bg-[#FFF7ED] text-[#F97316]',
    dotColor: 'bg-[#F97316]',
    icon: Clock,
  },
  paused: {
    labelKey: 'statusPaused',
    color: 'bg-[#FFFBEB] text-[#FFB900]',
    dotColor: 'bg-[#FFB900]',
    icon: PauseIcon,
  },
  draft: {
    labelKey: 'statusDraft',
    color: 'bg-[#F5F6F8] text-[#6B7280]',
    dotColor: 'bg-[#9CA3AF]',
    icon: FileText,
  },
  inactive: {
    labelKey: 'statusInactive',
    color: 'bg-[#FEF2F2] text-[#EF4444]',
    dotColor: 'bg-[#EF4444]',
    icon: XCircle,
  },
  actionrequired: {
    labelKey: 'statusActionRequired',
    color: 'bg-[#FFFBEB] text-[#D97706]',
    dotColor: 'bg-[#D97706]',
    icon: AlertTriangle,
  },
};
