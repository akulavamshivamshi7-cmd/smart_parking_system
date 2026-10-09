import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Clock,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  MapPin,
  Sparkles,
  QrCode
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/user');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your parking dashboard...</p>
      </div>
    );
  }

  const { stats, activeReservation, upcomingReservations, recentHistory, vehicles } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Campus Parking Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Driver'}! 👋
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            You have <strong className="text-teal-400 font-bold">{stats?.userVehiclesCount || 0}</strong> vehicles registered and{' '}
            <strong className="text-white font-bold">{stats?.totalBookingsCount || 0}</strong> total bookings.
          </p>
        </div>

        <Link
          to="/slots"
          className="self-start md:self-auto px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-teal-500/30 transition-all flex items-center gap-2"
        >
          <span>Find Available Slot</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Available</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.liveAvailableSlots || 0}</p>
          <span className="text-[11px] text-slate-500">out of {stats?.totalSlots || 0} slots</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Vehicles</span>
            <Car className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.userVehiclesCount || 0}</p>
          <span className="text-[11px] text-teal-600 font-medium">Ready for parking</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Trips</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{upcomingReservations?.length || 0}</p>
          <span className="text-[11px] text-slate-500">Scheduled bookings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past Completed</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.completedBookingsCount || 0}</p>
          <span className="text-[11px] text-slate-500">Completed reservations</span>
        </div>
      </div>

      {/* Active Live Parking Card (If current reservation exists) */}
      {activeReservation ? (
        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-2xl text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Currently Active Parking</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-black text-slate-900">
                  {activeReservation.parkingSlot?.slotNumber}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {activeReservation.parkingSlot?.slotType?.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {activeReservation.parkingSlot?.section}
                </span>
                <span className="flex items-center gap-1.5 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                  <Car className="w-3.5 h-3.5" />
                  {activeReservation.vehicle?.registrationNumber}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <Clock className="w-4 h-4" />
                  Valid until {new Date(activeReservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center gap-2">
                <QrCode className="w-6 h-6 text-teal-400" />
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pass Ref</p>
                  <p className="text-xs font-mono font-bold text-white">{activeReservation.bookingReference}</p>
                </div>
              </div>
              <Link
                to="/reservations"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                View Pass
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grid: Upcoming Bookings & Registered Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                <h2 className="font-bold text-base text-slate-900">Upcoming Reservations</h2>
              </div>
              <Link to="/reservations" className="text-xs font-bold text-teal-600 hover:underline">
                View All →
              </Link>
            </div>

            {upcomingReservations && upcomingReservations.length > 0 ? (
              <div className="space-y-3">
                {upcomingReservations.map((res) => (
                  <div
                    key={res._id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {res.parkingSlot?.slotNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {res.parkingSlot?.section}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(res.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                          {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {res.vehicle?.registrationNumber}
                      </span>
                      <p className="text-xs font-bold text-teal-600 mt-1">₹{res.totalAmount}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No upcoming bookings scheduled</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Need a spot? Reserve your parking space in advance.</p>
                <Link
                  to="/slots"
                  className="mt-3 inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Book a Slot Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* My Registered Vehicles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-teal-600" />
                <h2 className="font-bold text-base text-slate-900">My Registered Vehicles</h2>
              </div>
              <Link to="/vehicles" className="text-xs font-bold text-teal-600 hover:underline">
                Manage All →
              </Link>
            </div>

            {vehicles && vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div
                    key={v._id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-sm font-bold text-slate-900">{v.registrationNumber}</span>
                        <p className="text-xs text-slate-500">{v.model || 'Standard Vehicle'}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 uppercase">
                      {v.vehicleType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No vehicles registered yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add your car or motorcycle to start reserving slots.</p>
                <Link
                  to="/vehicles"
                  className="mt-3 inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  + Add First Vehicle
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
