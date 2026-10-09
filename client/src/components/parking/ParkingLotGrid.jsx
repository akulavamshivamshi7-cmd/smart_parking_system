import React, { useState } from 'react';
import SlotCard from './SlotCard';
import SlotLegend from './SlotLegend';
import { Filter, Search, Calendar, Clock, RefreshCw, MapPin } from 'lucide-react';

const ParkingLotGrid = ({
  slots = [],
  sections = [],
  counts = {},
  selectedSection,
  setSelectedSection,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,
  dateTimeFilter,
  setDateTimeFilter,
  onRefresh,
  onSelectSlot,
  isLoading
}) => {
  // Group slots by section
  const groupedSlots = slots.reduce((acc, slot) => {
    const sec = slot.section || 'General Parking';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Interactive Parking Grid</h2>
            <p className="text-xs text-slate-500">
              Select your required time window to visualize real-time slot availability.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start md:self-auto flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Availability</span>
          </button>
        </div>

        {/* Date and Time Window Controls */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Target Date</span>
            </label>
            <input
              type="date"
              value={dateTimeFilter.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateTimeFilter({ ...dateTimeFilter, date: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Start Time</span>
            </label>
            <input
              type="time"
              value={dateTimeFilter.startTime}
              onChange={(e) => setDateTimeFilter({ ...dateTimeFilter, startTime: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>End Time</span>
            </label>
            <input
              type="time"
              value={dateTimeFilter.endTime}
              onChange={(e) => setDateTimeFilter({ ...dateTimeFilter, endTime: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Secondary filters: Section, Type, Status & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium text-slate-700"
            >
              <option value="all">All Sections</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Slot Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Slot Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium text-slate-700"
            >
              <option value="all">All Types</option>
              <option value="four-wheeler">Four-Wheeler (Car)</option>
              <option value="two-wheeler">Two-Wheeler (Bike)</option>
              <option value="accessible">Accessible Parking</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Availability</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Only</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Search by Slot */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search Slot</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. A-01"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <SlotLegend counts={counts} />

      {/* Grid Display */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Calculating parking slot availability...</p>
        </div>
      ) : Object.keys(groupedSlots).length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-base font-bold text-slate-700">No parking slots matched your filters.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the filters or selecting another date.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSlots).map(([sectionName, sectionSlots]) => {
            const availCount = sectionSlots.filter((s) => (s.calculatedStatus || s.status) === 'available').length;

            return (
              <div
                key={sectionName}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs"
              >
                {/* Section Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <h3 className="font-bold text-sm tracking-wide">{sectionName}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-300">
                      Total: <strong className="text-white">{sectionSlots.length}</strong>
                    </span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      {availCount} Available
                    </span>
                  </div>
                </div>

                {/* Road Lane Indicator */}
                <div className="h-4 bg-slate-800 flex items-center justify-center">
                  <div className="w-full border-t border-dashed border-amber-400/60" />
                </div>

                {/* Slots Grid */}
                <div className="p-6 bg-slate-50/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                    {sectionSlots.map((slot) => (
                      <SlotCard
                        key={slot._id}
                        slot={slot}
                        onSelect={onSelectSlot}
                      />
                    ))}
                  </div>
                </div>

                {/* Lower Road Lane Indicator */}
                <div className="h-4 bg-slate-800 flex items-center justify-center">
                  <div className="w-full border-t border-dashed border-amber-400/60" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParkingLotGrid;
