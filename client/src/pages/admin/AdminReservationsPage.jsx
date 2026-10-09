import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Car,
  User,
  MapPin,
  RefreshCw,
  QrCode
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';

const AdminReservationsPage = () => {
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Selected reservation for view details modal
  const [viewReservation, setViewReservation] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, dateFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

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

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/reservations/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Booking status changed to '${newStatus}'`);
        fetchReservations();
        if (viewReservation && viewReservation._id === id) {
          setViewReservation(res.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filtered = reservations.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.bookingReference?.toLowerCase().includes(term) ||
      r.user?.name?.toLowerCase().includes(term) ||
      r.user?.email?.toLowerCase().includes(term) ||
      r.vehicle?.registrationNumber?.toLowerCase().includes(term) ||
      r.parkingSlot?.slotNumber?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">Confirmed</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campus Parking Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide view of all current, upcoming, and past reservations
          </p>
        </div>

        <button
          onClick={fetchReservations}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter */}
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

        {/* Date Filter & Search */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
            title="Filter by Date"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}

          <div className="relative w-48 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref, driver, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading reservation ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">No reservations matched your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Driver</th>
                  <th className="px-6 py-3.5">Slot / Section</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Date & Window</th>
                  <th className="px-6 py-3.5">Fee</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {res.bookingReference}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">{res.user?.name || 'Driver'}</p>
                      <p className="text-[11px] text-slate-400">{res.user?.email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {res.parkingSlot?.slotNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                          {res.parkingSlot?.section}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-700">
                      {res.vehicle?.registrationNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      <p className="font-medium text-slate-800">
                        {new Date(res.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-teal-700">
                      ₹{res.totalAmount}
                    </td>
                    <td className="px-6 py-3.5">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setViewReservation(res)}
                        className="p-1 text-slate-500 hover:text-slate-900 rounded"
                        title="View Pass & Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {res.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(res._id, 'active')}
                          className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200"
                          title="Vehicle arrived, check in"
                        >
                          Check In
                        </button>
                      )}

                      {res.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(res._id, 'completed')}
                          className="px-2 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200"
                          title="Vehicle departed, complete"
                        >
                          Check Out
                        </button>
                      )}

                      {['confirmed', 'pending'].includes(res.status) && (
                        <button
                          onClick={() => handleUpdateStatus(res._id, 'cancelled')}
                          className="px-2 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reservation Details / Pass Modal */}
      {viewReservation && (
        <Modal
          isOpen={!!viewReservation}
          onClose={() => setViewReservation(null)}
          title={`Booking ${viewReservation.bookingReference}`}
          subtitle="Full reservation details and control"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-sm text-teal-400 font-bold">{viewReservation.bookingReference}</span>
                {getStatusBadge(viewReservation.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Driver Name</span>
                  <p className="font-semibold text-slate-100">{viewReservation.user?.name}</p>
                  <p className="text-[11px] text-slate-400">{viewReservation.user?.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle</span>
                  <p className="font-mono font-bold text-slate-100">{viewReservation.vehicle?.registrationNumber}</p>
                  <p className="text-[11px] text-slate-400">{viewReservation.vehicle?.model || viewReservation.vehicle?.vehicleType}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Slot</span>
                  <p className="font-mono text-lg font-black text-teal-400">{viewReservation.parkingSlot?.slotNumber}</p>
                  <p className="text-[11px] text-slate-400">{viewReservation.parkingSlot?.section}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Fee</span>
                  <p className="text-lg font-black text-white">₹{viewReservation.totalAmount}</p>
                  <p className="text-[11px] text-slate-400">{viewReservation.durationHours} hours</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                <p><strong>Scheduled:</strong> {new Date(viewReservation.startTime).toLocaleString()} - {new Date(viewReservation.endTime).toLocaleTimeString()}</p>
                {viewReservation.checkInTime && (
                  <p className="text-emerald-400 mt-1">✓ Checked-in at: {new Date(viewReservation.checkInTime).toLocaleTimeString()}</p>
                )}
                {viewReservation.checkOutTime && (
                  <p className="text-indigo-400 mt-1">✓ Checked-out at: {new Date(viewReservation.checkOutTime).toLocaleTimeString()}</p>
                )}
                {viewReservation.cancelledAt && (
                  <p className="text-rose-400 mt-1">✕ Cancelled: {viewReservation.cancellationReason || 'No reason specified'}</p>
                )}
              </div>
            </div>

            {/* Admin Status Overrides */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {viewReservation.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateStatus(viewReservation._id, 'active')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Mark Active (Check-in)
                </button>
              )}
              {viewReservation.status === 'active' && (
                <button
                  onClick={() => handleUpdateStatus(viewReservation._id, 'completed')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Mark Completed (Check-out)
                </button>
              )}
              {['confirmed', 'pending', 'active'].includes(viewReservation.status) && (
                <button
                  onClick={() => handleUpdateStatus(viewReservation._id, 'cancelled')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel Reservation
                </button>
              )}
              <button
                onClick={() => setViewReservation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminReservationsPage;
