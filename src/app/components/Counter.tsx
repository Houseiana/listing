import { Minus, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface CounterProps {
  label: string;
  sublabel?: string;
  value: number;
  field: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (field: string, delta: number) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  unit?: string;
}

export const Counter = ({
  label,
  sublabel,
  value,
  field,
  min = 1,
  max,
  step = 1,
  onChange,
  disabled,
  icon,
  unit,
}: CounterProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-6 h-[90px]">
      <div className="flex items-center gap-5">
        {icon && (
          <div className="w-12 h-12 bg-[#F0F2F5] rounded-[14px] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-[#2F3A45]">{label}</span>
          {sublabel && (
            <p className="text-xs text-[#9CA3AF]">{sublabel}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-5">
        <button
          type="button"
          title={`${t('common.decrease')} ${label}`}
          onClick={() => onChange(field, -step)}
          disabled={value <= min || disabled}
          className={`w-[42px] h-[42px] rounded-full border flex items-center justify-center transition-all ${
            value <= min || disabled
              ? 'border-[#F0F2F5] text-[#D1D5DB] cursor-not-allowed opacity-50'
              : 'border-[#F0F2F5] text-[#1D242B] hover:border-[#FCC519] hover:text-[#FCC519]'
          }`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-7 text-center text-base text-[#1D242B]">{value}{unit ? <span className="text-xs text-[#9CA3AF] ml-0.5">{unit}</span> : null}</span>
        <button
          type="button"
          title={`${t('common.increase')} ${label}`}
          onClick={() => onChange(field, step)}
          disabled={(max ? value >= max : false) || disabled}
          className={`w-[42px] h-[42px] rounded-full border flex items-center justify-center transition-all ${
            max && value >= max
              ? 'border-[#F0F2F5] text-[#D1D5DB] cursor-not-allowed opacity-50'
              : 'border-[#F0F2F5] text-[#1D242B] hover:border-[#FCC519] hover:text-[#FCC519]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
