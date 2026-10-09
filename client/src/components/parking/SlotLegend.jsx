import React from 'react';

const SlotLegend = ({ counts = {} }) => {
  const items = [
    { label: 'Available', color: 'bg-emerald-500', count: counts.available ?? 0, desc: 'Ready for booking' },
    { label: 'Occupied', color: 'bg-rose-500', count: counts.occupied ?? 0, desc: 'Vehicle currently parked' },
    { label: 'Reserved', color: 'bg-amber-500', count: counts.reserved ?? 0, desc: 'Booked for this time' },
    { label: 'Maintenance', color: 'bg-slate-400', count: counts.maintenance ?? 0, desc: 'Out of service' },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Legend:</span>
      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${item.color} shadow-xs`} />
            <span className="text-xs font-semibold text-slate-700">{item.label}</span>
            {item.count !== undefined && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {item.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotLegend;
