import React from 'react';
import { Car, Bike, Accessibility, Wrench, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';

const SlotCard = ({ slot, onSelect, isSelected }) => {
  const status = slot.calculatedStatus || slot.status || 'available';

  const getTypeIcon = () => {
    switch (slot.slotType) {
      case 'two-wheeler':
        return <Bike className="w-5 h-5" />;
      case 'accessible':
        return <Accessibility className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (slot.slotType) {
      case 'two-wheeler':
        return '2-Wheeler';
      case 'accessible':
        return 'Accessible';
      default:
        return '4-Wheeler';
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'available':
        return {
          border: 'border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/90 text-emerald-950',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-600',
          indicator: 'bg-emerald-500',
          label: 'Available',
          canBook: true,
        };
      case 'occupied':
        return {
          border: 'border-rose-400 bg-rose-50/30 text-rose-950 opacity-90',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          iconColor: 'text-rose-600',
          indicator: 'bg-rose-500',
          label: 'Occupied',
          canBook: false,
        };
      case 'reserved':
        return {
          border: 'border-amber-400 bg-amber-50/30 text-amber-950 opacity-90',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600',
          indicator: 'bg-amber-500',
          label: 'Reserved',
          canBook: false,
        };
      case 'maintenance':
      default:
        return {
          border: 'border-slate-300 bg-slate-100 text-slate-700 opacity-75 cursor-not-allowed',
          badge: 'bg-slate-200 text-slate-700 border-slate-300',
          iconColor: 'text-slate-500',
          indicator: 'bg-slate-400',
          label: 'Maintenance',
          canBook: false,
        };
    }
  };

  const config = getStatusStyles();

  return (
    <div
      onClick={() => config.canBook && onSelect && onSelect(slot)}
      className={`relative group rounded-2xl border-2 p-3.5 transition-all duration-200 flex flex-col justify-between min-h-[140px] select-none ${
        config.border
      } ${
        config.canBook
          ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
          : 'cursor-not-allowed'
      } ${
        isSelected
          ? 'ring-3 ring-teal-500 ring-offset-2 border-teal-600 bg-teal-50 shadow-md'
          : ''
      }`}
    >
      {/* Top row: Slot Number & Status Indicator */}
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-base font-black tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
            {slot.slotNumber}
          </span>
          <p className="text-[11px] font-semibold text-slate-500">{getTypeLabel()}</p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shadow-2xs"
             style={{ backgroundColor: 'white' }}>
          <span className={`w-2 h-2 rounded-full ${config.indicator} animate-pulse`} />
          <span className="text-slate-700">{config.label}</span>
        </div>
      </div>

      {/* Center bay illustration / vehicle icon */}
      <div className="my-2 flex items-center justify-center py-2 relative">
        {/* Subtle parking bay line marks */}
        <div className="absolute inset-x-2 top-0 border-t border-dashed border-slate-300 pointer-events-none" />
        <div className="absolute inset-x-2 bottom-0 border-b border-dashed border-slate-300 pointer-events-none" />

        <div className={`p-2 rounded-xl bg-white shadow-2xs border border-slate-100 ${config.iconColor}`}>
          {status === 'maintenance' ? (
            <Wrench className="w-5 h-5 text-slate-400" />
          ) : (
            getTypeIcon()
          )}
        </div>
      </div>

      {/* Bottom row: Rate & Action / Plate */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
        <span className="font-bold text-slate-700">₹{slot.basePricePerHour}/hr</span>

        {config.canBook ? (
          <span className="text-[11px] font-bold text-teal-600 group-hover:text-teal-700 group-hover:underline">
            Book Now →
          </span>
        ) : slot.currentReservation?.vehiclePlate ? (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-white rounded">
            {slot.currentReservation.vehiclePlate}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 capitalize">
            {status}
          </span>
        )}
      </div>
    </div>
  );
};

export default SlotCard;
