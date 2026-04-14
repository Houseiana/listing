import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
}

export function StatCard({ label, value, icon, iconBgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-[14px] md:rounded-[20px] border border-[#E8EAED] px-3 md:px-5 flex items-center justify-between h-[68px] md:h-[82px]">
      <div className="flex flex-col gap-1 md:gap-2 min-w-0">
        <p className="text-[10px] md:text-xs font-medium text-[#9CA3AF] truncate">{label}</p>
        <p className="text-[17px] md:text-[22px] font-bold text-[#1D242B] leading-none truncate">{value}</p>
      </div>
      <div
        className={`w-9 h-9 md:w-11 md:h-11 ${iconBgColor} rounded-full flex items-center justify-center flex-shrink-0 ml-2`}
      >
        {icon}
      </div>
    </div>
  );
}
