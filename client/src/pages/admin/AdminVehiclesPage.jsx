import React, { useState, useEffect } from 'react';
import { Car, Bike, Accessibility, Search, Filter, RefreshCw, Trash2, User } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminVehiclesPage = () => {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [typeFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await api.get('/vehicles', { params });
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load registered vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/vehicles/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success(`Vehicle ${deleteTarget.registrationNumber} deleted.`);
        setDeleteTarget(null);
        fetchVehicles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete vehicle.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      v.registrationNumber.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.owner?.name?.toLowerCase().includes(term) ||
      v.owner?.email?.toLowerCase().includes(term)
    );
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'two-wheeler':
        return <Bike className="w-5 h-5 text-indigo-600" />;
      case 'accessible':
        return <Accessibility className="w-5 h-5 text-amber-600" />;
      default:
        return <Car className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campus Registered Vehicles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Database of all student, faculty, and visitor vehicles authorized for campus access
          </p>
        </div>

        <button
          onClick={fetchVehicles}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="all">All Vehicle Types</option>
            <option value="four-wheeler">Four-Wheeler</option>
            <option value="two-wheeler">Two-Wheeler</option>
            <option value="accessible">Accessible</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search plate or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading campus vehicle registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">No vehicles found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Registration Plate</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Model & Color</th>
                  <th className="px-6 py-3.5">Registered Owner</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getTypeIcon(v.vehicleType)}
                        </div>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {v.registrationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 uppercase font-bold text-slate-600">
                      {v.vehicleType}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      <p className="font-semibold">{v.model || 'Standard'}</p>
                      {v.color && <p className="text-[11px] text-slate-400">{v.color}</p>}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{v.owner?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{v.owner?.email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(v)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete vehicle record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Vehicle Record"
        message={`Are you sure you want to remove vehicle ${deleteTarget?.registrationNumber}?`}
        confirmText="Delete Vehicle"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminVehiclesPage;
