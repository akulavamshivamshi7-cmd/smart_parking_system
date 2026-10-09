import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Layers,
  Car,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Plus,
  RefreshCw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_COLORS = {
  active: '#10b981',
  confirmed: '#3b82f6',
  completed: '#64748b',
  cancelled: '#ef4444',
  pending: '#f59e0b'
};

const AdminDashboard = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reservationId, newStatus) => {
    try {
      const res = await api.put(`/reservations/${reservationId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Booking status changed to '${newStatus}'`);
        fetchAdminMetrics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Gathering campus parking intelligence...</p>
      </div>
    );
  }

  const { summary, statusBreakdown, sectionUtilization, recentBookings, dailyTrends, slotTypeDistribution } = data || {};

  // Data for status donut chart
  const statusPieData = [
    { name: 'Active (Parked)', value: statusBreakdown?.active || 0, color: '#10b981' },
    { name: 'Confirmed', value: statusBreakdown?.confirmed || 0, color: '#3b82f6' },
    { name: 'Completed', value: statusBreakdown?.completed || 0, color: '#64748b' },
    { name: 'Cancelled', value: statusBreakdown?.cancelled || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator Control Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Campus Parking Overview</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time telemetry, bay allocation, and campus enforcement analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminMetrics}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/slots"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slot</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Slots */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Slots</span>
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{summary?.totalSlots || 0}</p>
          <span className="text-[11px] text-slate-500">Across campus sections</span>
        </div>

        {/* Available Right Now */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Available Now</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{summary?.availableSlots || 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Ready for drivers</span>
        </div>

        {/* Occupied Right Now */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider">Occupied</span>
            <Car className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-rose-600 mt-2">{summary?.occupiedSlots || 0}</p>
          <span className="text-[11px] text-rose-700 font-medium">Currently parked in bays</span>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Revenue</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">₹{summary?.totalRevenue || 0}</p>
          <span className="text-[11px] text-amber-700 font-medium">Total fees collected</span>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Registered Drivers:</span>
          <span className="font-bold text-slate-900 text-sm">{summary?.totalUsers || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Registered Vehicles:</span>
          <span className="font-bold text-slate-900 text-sm">{summary?.totalVehicles || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Under Maintenance:</span>
          <span className="font-bold text-slate-900 text-sm">{summary?.maintenanceSlots || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Active Bookings:</span>
          <span className="font-bold text-slate-900 text-sm">{summary?.activeReservations || 0}</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Utilization Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Section Occupancy Breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">Available vs Occupied slots across sections</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="section" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="available" name="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupied" name="Occupied" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenance" name="Maintenance" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reservation Status Distribution Donut */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Reservation Status Breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">Proportion of campus bookings by state</p>
          <div className="h-64 flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No reservations data recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Campus Bookings</h2>
            <p className="text-xs text-slate-400">Latest reservation events and check-in statuses</p>
          </div>
          <Link to="/admin/reservations" className="text-xs font-bold text-teal-600 hover:underline">
            Manage All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3">Slot</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Time Window</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {b.bookingReference}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{b.user?.name || 'Driver'}</p>
                      <p className="text-[11px] text-slate-400">{b.user?.email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {b.parkingSlot?.slotNumber}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">
                      {b.vehicle?.registrationNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${STATUS_COLORS[b.status] || '#64748b'}20`,
                          color: STATUS_COLORS[b.status] || '#64748b'
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1.5">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(b._id, 'active')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors"
                          title="Vehicle arrived, mark active"
                        >
                          Check In
                        </button>
                      )}
                      {b.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(b._id, 'completed')}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors"
                          title="Vehicle left, mark completed"
                        >
                          Check Out
                        </button>
                      )}
                      {['confirmed', 'pending'].includes(b.status) && (
                        <button
                          onClick={() => handleUpdateStatus(b._id, 'cancelled')}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No reservations recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
