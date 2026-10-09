import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Car, AlertCircle, CheckCircle, ArrowRight, Plus } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const BookingModal = ({ isOpen, onClose, slot, onBookingSuccess, initialTimes }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Default times
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const defaultStartH = String(Math.min(23, now.getHours() + 1)).padStart(2, '0') + ':00';
  const defaultEndH = String(Math.min(23, now.getHours() + 3)).padStart(2, '0') + ':00';

  const [date, setDate] = useState(initialTimes?.date || todayStr);
  const [startTime, setStartTime] = useState(initialTimes?.startTime || defaultStartH);
  const [endTime, setEndTime] = useState(initialTimes?.endTime || defaultEndH);

  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Quick vehicle registration inline
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('four-wheeler');
  const [newModel, setNewModel] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Fetch user vehicles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      if (initialTimes) {
        if (initialTimes.date) setDate(initialTimes.date);
        if (initialTimes.startTime) setStartTime(initialTimes.startTime);
        if (initialTimes.endTime) setEndTime(initialTimes.endTime);
      }
    }
  }, [isOpen, initialTimes]);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
        if (res.data.data.length > 0 && !selectedVehicle) {
          // Select first compatible vehicle if possible
          const compatible = res.data.data.find(v => slot?.slotType === 'two-wheeler' ? v.vehicleType === 'two-wheeler' : true);
          setSelectedVehicle(compatible ? compatible._id : res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load vehicles', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Calculate duration and total price
  const calculateBookingDetails = () => {
    if (!date || !startTime || !endTime) return { hours: 0, total: 0, isValid: false, error: 'Missing times' };

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const currentTime = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { hours: 0, total: 0, isValid: false, error: 'Invalid date/time format' };
    }

    if (start.getTime() < currentTime.getTime() - 10 * 60 * 1000) {
      return { hours: 0, total: 0, isValid: false, error: 'Start time cannot be in the past' };
    }

    if (end <= start) {
      return { hours: 0, total: 0, isValid: false, error: 'End time must be after start time' };
    }

    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 30 * 60 * 1000) {
      return { hours: 0, total: 0, isValid: false, error: 'Minimum booking duration is 30 minutes' };
    }

    const hours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    const rate = slot?.basePricePerHour || 20;
    const total = Math.round(hours * rate);

    return { hours, total, isValid: true, start, end, error: null };
  };

  const bookingDetails = calculateBookingDetails();

  // Check availability when slot or times change
  useEffect(() => {
    if (isOpen && slot && bookingDetails.isValid) {
      checkRealTimeAvailability();
    }
  }, [isOpen, slot?._id, date, startTime, endTime]);

  const checkRealTimeAvailability = async () => {
    if (!slot?._id || !bookingDetails.isValid) return;
    setAvailabilityChecking(true);
    setAvailabilityResult(null);

    try {
      const res = await api.get('/reservations/availability', {
        params: {
          slotId: slot._id,
          startTime: bookingDetails.start.toISOString(),
          endTime: bookingDetails.end.toISOString()
        }
      });
      setAvailabilityResult(res.data);
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setAvailabilityChecking(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      toast.warning('Please enter vehicle registration plate number.');
      return;
    }

    setAddingVehicle(true);
    try {
      const res = await api.post('/vehicles', {
        registrationNumber: newPlate.toUpperCase().trim(),
        vehicleType: newType,
        model: newModel.trim()
      });
      if (res.data.success) {
        toast.success(`Vehicle ${res.data.data.registrationNumber} added!`);
        setVehicles((prev) => [res.data.data, ...prev]);
        setSelectedVehicle(res.data.data._id);
        setShowAddVehicle(false);
        setNewPlate('');
        setNewModel('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle.');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!bookingDetails.isValid) {
      toast.error(bookingDetails.error);
      return;
    }

    if (!selectedVehicle) {
      toast.error('Please select or add a vehicle for this reservation.');
      return;
    }

    // Check slot compatibility
    const veh = vehicles.find(v => v._id === selectedVehicle);
    if (slot?.slotType === 'two-wheeler' && veh?.vehicleType !== 'two-wheeler') {
      toast.error('A four-wheeler cannot reserve a two-wheeler slot. Please select a two-wheeler vehicle.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/reservations', {
        parkingSlotId: slot._id,
        vehicleId: selectedVehicle,
        bookingDate: date,
        startTime: bookingDetails.start.toISOString(),
        endTime: bookingDetails.end.toISOString()
      });

      if (res.data.success) {
        toast.success(`Booking Confirmed! Ref: ${res.data.data.bookingReference}`);
        if (onBookingSuccess) onBookingSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      toast.error(msg);
      // Recheck availability immediately to refresh status
      checkRealTimeAvailability();
    } finally {
      setBookingLoading(false);
    }
  };

  if (!slot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reserve Slot ${slot.slotNumber}`}
      subtitle={`${slot.section} • ${slot.slotType?.replace('-', ' ').toUpperCase()} PARKING`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Slot Info Summary Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">Assigned Slot</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono tracking-tight">{slot.slotNumber}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {slot.slotType}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hourly Rate</span>
            <p className="text-xl font-bold text-teal-400">₹{slot.basePricePerHour}/hr</p>
          </div>
        </div>

        {/* Date and Time Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Parking Date
            </label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Live Slot Conflict Feedback Banner */}
        {bookingDetails.isValid && (
          <div className="text-xs">
            {availabilityChecking ? (
              <div className="p-3 bg-slate-100 rounded-xl text-slate-600 flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Checking real-time slot conflicts...</span>
              </div>
            ) : availabilityResult?.isAvailable === false ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Slot Unavailable for Selected Time</p>
                  <p className="text-[11px] mt-0.5">{availabilityResult.reason}</p>
                </div>
              </div>
            ) : availabilityResult?.isAvailable === true ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Slot is 100% available for this reservation window!</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Time Error if invalid */}
        {!bookingDetails.isValid && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{bookingDetails.error}</span>
          </div>
        )}

        {/* Vehicle Selection Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Your Vehicle
            </label>
            <button
              type="button"
              onClick={() => setShowAddVehicle(!showAddVehicle)}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddVehicle ? 'Choose Existing' : 'Add New Vehicle'}</span>
            </button>
          </div>

          {showAddVehicle ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-800">Quick Add Vehicle</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Plate (e.g. KA-01-AB-1234)"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono uppercase"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="four-wheeler">4-Wheeler (Car)</option>
                  <option value="two-wheeler">2-Wheeler (Bike)</option>
                  <option value="accessible">Accessible / Adapted</option>
                </select>
                <input
                  type="text"
                  placeholder="Model (e.g. Honda City)"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateVehicle}
                disabled={addingVehicle}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {addingVehicle ? 'Saving Vehicle...' : 'Save & Select Vehicle'}
              </button>
            </div>
          ) : (
            <div>
              {loadingVehicles ? (
                <div className="p-3 text-center text-xs text-slate-400">Loading vehicles...</div>
              ) : vehicles.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-xs font-semibold text-amber-800">No vehicles registered under your account yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddVehicle(true)}
                    className="mt-2 text-xs font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    + Register Vehicle Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicle === v._id;
                    const isMismatched = slot?.slotType === 'two-wheeler' && v.vehicleType !== 'two-wheeler';

                    return (
                      <div
                        key={v._id}
                        onClick={() => !isMismatched && setSelectedVehicle(v._id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isMismatched
                            ? 'opacity-40 border-slate-200 bg-slate-100 cursor-not-allowed'
                            : isSelected
                            ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">{v.registrationNumber}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">{v.vehicleType}</span>
                        </div>
                        {v.model && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{v.model}</p>}
                        {isMismatched && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">Slot requires two-wheeler</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing Summary Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Estimated Duration:</span>
            <span className="font-bold text-slate-800">{bookingDetails.hours} hrs</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Slot Rate:</span>
            <span className="font-medium text-slate-800">₹{slot.basePricePerHour} / hr</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900">Total Parking Fee:</span>
            <span className="text-lg font-black text-teal-600">₹{bookingDetails.total}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmReservation}
            disabled={
              !bookingDetails.isValid ||
              !selectedVehicle ||
              bookingLoading ||
              availabilityResult?.isAvailable === false
            }
            className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2"
          >
            {bookingLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Confirming Booking...</span>
              </>
            ) : (
              <>
                <span>Confirm & Reserve Slot</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BookingModal;
