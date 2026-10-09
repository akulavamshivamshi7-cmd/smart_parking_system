import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Smartphone,
  BarChart3
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/common/Navbar';

const LandingPage = () => {
  const [stats, setStats] = useState({
    totalSlots: 24,
    availableSlots: 20,
    occupiedSlots: 2,
    sectionsCount: 3
  });

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await api.get('/slots');
        if (res.data.success) {
          const total = res.data.count;
          const available = res.data.data.filter((s) => s.calculatedStatus === 'available').length;
          const occupied = res.data.data.filter((s) => s.calculatedStatus === 'occupied').length;
          const sections = res.data.sections ? res.data.sections.length : 3;
          setStats({
            totalSlots: total,
            availableSlots: available,
            occupiedSlots: occupied,
            sectionsCount: sections
          });
        }
      } catch (err) {
        // Fallback default
      }
    };

    fetchLiveStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Hackathon Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>MERN Stack Smart Campus Parking Project</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Intelligent Parking. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400">
              Zero Congestion.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A real-time, conflict-free parking reservation system engineered for college campuses.
            Reserve slots ahead of time, manage personal vehicles, and monitor live parking occupancy.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/slots"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore & Reserve Slot</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In / Demo Login</span>
            </Link>
          </div>

          {/* Live Campus Parking Ticker */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Slots</span>
              <p className="text-3xl font-black text-white mt-1">{stats.totalSlots}</p>
              <span className="text-[11px] text-slate-500">Across campus bays</span>
            </div>

            <div className="bg-slate-900/80 border border-emerald-900/40 p-5 rounded-2xl backdrop-blur-xs">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Available Now</span>
              <p className="text-3xl font-black text-emerald-400 mt-1">{stats.availableSlots}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Ready for instant booking</span>
            </div>

            <div className="bg-slate-900/80 border border-rose-900/40 p-5 rounded-2xl backdrop-blur-xs">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Occupied</span>
              <p className="text-3xl font-black text-rose-400 mt-1">{stats.occupiedSlots}</p>
              <span className="text-[11px] text-rose-600 font-medium">Currently parked</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Sections</span>
              <p className="text-3xl font-black text-teal-400 mt-1">{stats.sectionsCount}</p>
              <span className="text-[11px] text-slate-500">Ground & Basements</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Designed For High Reliability
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Everything required to orchestrate parking efficiently without double bookings or chaos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Time-Interval Availability</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                A slot booked for tomorrow at 2 PM is available right now! The system calculates
                conflict-free availability dynamically for any chosen window.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Vehicle Type Enforcement</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Supports Two-wheelers, Four-wheelers, and Accessible spaces. Prevents incorrect
                reservations and ensures optimal space usage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Comprehensive Admin Insights</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Live utilization charts, check-in & check-out actions, slot maintenance toggles, and
                analytics computed directly from MongoDB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>ParkSmart • College Internal Hackathon Project • Built with React, Vite, Express & MongoDB</p>
      </footer>
    </div>
  );
};

export default LandingPage;
