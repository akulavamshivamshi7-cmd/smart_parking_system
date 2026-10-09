import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  Car,
  MapPin,
  XCircle,
  QrCode,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const MyReservationsPage = () => {
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Selected reservation for pass modal
  const [selectedPass, setSelectedPass] = useState(null);

  // Cancellation modal
  const [cancelReservationTarget, setCancelReservationTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/reservations', { params });
      if (res.data.success) {
        setReservations(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (reservation) => {
    setCancelReservationTarget(reservation);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelReservationTarget) return;

    setCancelling(true);
    try {
      const res = await api.patch(`/reservations/${cancelReservationTarget._id}/cancel`, {
        cancellationReason: cancelReason.trim() || 'Cancelled by user'
      });

      if (res.data.success) {
        toast.success(`Reservation ${cancelReservationTarget.bookingReference} cancelled successfully.`);
        setCancelReservationTarget(null);
        fetchReservations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.bookingReference?.toLowerCase().includes(term) ||
      r.parkingSlot?.slotNumber?.toLowerCase().includes(term) ||
      r.vehicle?.registrationNumber?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Active (Parked)</span>;
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Confirmed (Upcoming)</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Parking Bookings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, view digital parking passes, or manage your reservations
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reference, slot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading your reservations...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">No reservations found.</p>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilter !== 'all' ? `No bookings with status '${statusFilter}'` : 'You have not made any bookings yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => {
            const canCancel = res.status === 'confirmed' || res.status === 'pending';

            return (
              <div
                key={res._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Slot & Reference */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                      {res.parkingSlot?.slotNumber}
                    </span>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700">{res.bookingReference}</span>
                      <p className="text-xs text-slate-500">{res.parkingSlot?.section}</p>
                    </div>
                    {getStatusBadge(res.status)}
                  </div>

                  {/* Timing & Vehicle info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {new Date(res.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} •{' '}
                        {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.vehicle?.registrationNumber}</span>
                      {res.vehicle?.model && <span className="font-sans font-normal text-slate-500">({res.vehicle.model})</span>}
                    </div>

                    <div className="text-teal-700 font-bold">
                      Fee: ₹{res.totalAmount} ({res.durationHours} hrs)
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => setSelectedPass(res)}
                    className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5 text-teal-400" />
                    <span>View Pass</span>
                  </button>

                  {canCancel && (
                    <button
                      onClick={() => handleCancelClick(res)}
                      className="px-3.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Parking Pass Modal */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          title="Digital Campus Parking Pass"
          subtitle="Present this ticket at the campus boom barrier or security checkpoint"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {/* Ticket Card */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">ParkSmart Access Pass</span>
                  <h4 className="text-xl font-black font-mono mt-0.5">{selectedPass.bookingReference}</h4>
                </div>
                {getStatusBadge(selectedPass.status)}
              </div>

              <div className="py-4 grid grid-cols-2 gap-4 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bay Slot</span>
                  <span className="text-2xl font-black font-mono text-teal-400">
                    {selectedPass.parkingSlot?.slotNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle</span>
                  <span className="text-sm font-bold font-mono text-slate-100">
                    {selectedPass.vehicle?.registrationNumber}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                  <span className="text-xs font-medium text-slate-200">
                    {selectedPass.parkingSlot?.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid From</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {new Date(selectedPass.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid Until</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {new Date(selectedPass.endTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* QR Code Graphic & Barcode */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">Total Paid</p>
                  <p className="text-lg font-black text-teal-400">₹{selectedPass.totalAmount}</p>
                </div>
                <div className="p-2 bg-white rounded-xl">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Close Pass
            </button>
          </div>
        </Modal>
      )}

      {/* Cancellation Reason Modal */}
      {cancelReservationTarget && (
        <Modal
          isOpen={!!cancelReservationTarget}
          onClose={() => setCancelReservationTarget(null)}
          title="Cancel Parking Reservation"
          subtitle={`Are you sure you want to cancel booking ${cancelReservationTarget.bookingReference}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <p className="font-semibold">
                Cancelling this booking will immediately release Slot {cancelReservationTarget.parkingSlot?.slotNumber} back to available campus inventory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Schedule change, cancelled visit..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelReservationTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyReservationsPage;
