import React, { useState, useEffect, useCallback } from 'react';
import ParkingLotGrid from '../../components/parking/ParkingLotGrid';
import BookingModal from '../../components/parking/BookingModal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SlotsBookingPage = () => {
  const toast = useToast();
  const [slots, setSlots] = useState([]);
  const [sections, setSections] = useState([]);
  const [counts, setCounts] = useState({ available: 0, occupied: 0, reserved: 0, maintenance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Default time window: Today, next hour to 2 hours later
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const startH = String(Math.min(23, now.getHours() + 1)).padStart(2, '0') + ':00';
  const endH = String(Math.min(23, now.getHours() + 3)).padStart(2, '0') + ':00';

  const [dateTimeFilter, setDateTimeFilter] = useState({
    date: todayStr,
    startTime: startH,
    endTime: endH
  });

  // Booking Modal
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build ISO intervals
      const startIso = new Date(`${dateTimeFilter.date}T${dateTimeFilter.startTime}`).toISOString();
      const endIso = new Date(`${dateTimeFilter.date}T${dateTimeFilter.endTime}`).toISOString();

      const params = {
        startTime: startIso,
        endTime: endIso
      };

      if (selectedSection !== 'all') params.section = selectedSection;
      if (selectedType !== 'all') params.slotType = selectedType;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/slots', { params });
      if (res.data.success) {
        setSlots(res.data.data);
        if (res.data.sections) {
          setSections(res.data.sections);
        }

        // Calculate counts based on dynamic status
        const c = { available: 0, occupied: 0, reserved: 0, maintenance: 0 };
        res.data.data.forEach((s) => {
          const st = s.calculatedStatus || s.status;
          if (c[st] !== undefined) c[st]++;
          else c.available++;
        });
        setCounts(c);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      toast.error('Could not fetch parking slots. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [dateTimeFilter, selectedSection, selectedType, selectedStatus, searchTerm]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleSelectSlot = (slot) => {
    setSelectedSlotForBooking(slot);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = () => {
    fetchSlots(); // Refresh slot statuses immediately
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campus Parking Slots</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual map of all parking bays across campus sections
          </p>
        </div>
      </div>

      <ParkingLotGrid
        slots={slots}
        sections={sections}
        counts={counts}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateTimeFilter={dateTimeFilter}
        setDateTimeFilter={setDateTimeFilter}
        onRefresh={fetchSlots}
        onSelectSlot={handleSelectSlot}
        isLoading={isLoading}
      />

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlotForBooking(null);
          }}
          slot={selectedSlotForBooking}
          initialTimes={dateTimeFilter}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default SlotsBookingPage;
