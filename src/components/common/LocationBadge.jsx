import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * LocationBadge Component
 * Splits a locationCode (e.g., "WH-ZONE-AISLE-RACK") and displays it as a 
 * series of styled emerald badges with chevrons.
 */
const LocationBadge = ({ locationCode, className = "" }) => {
  if (!locationCode) return <span className="text-gray-300 italic text-xs">Tanımsız</span>;

  const parts = locationCode.split('-');

  return (
    <div className={`flex flex-wrap items-center gap-x-1 gap-y-2 ${className}`}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100/50 shadow-sm transition-all hover:bg-emerald-100">
            {part}
          </span>
          {index < parts.length - 1 && (
            <ChevronRight className="h-3 w-3 text-emerald-300" strokeWidth={3} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LocationBadge;
