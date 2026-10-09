import React, { useState, useEffect } from 'react';
import { Car, Bike, Accessibility, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const MyVehiclesPage = () => {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleType: 'four-wheeler',
    model: '',
    color: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load registered vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      registrationNumber: '',
      vehicleType: 'four-wheeler',
      model: '',
      color: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (vehicle) => {
    setIsEditing(true);
    setEditingId(vehicle._id);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      model: vehicle.model || '',
      color: vehicle.color || ''
    });
    setModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!formData.registrationNumber.trim()) {
      toast.warning('Please enter vehicle registration plate number.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await api.put(`/vehicles/${editingId}`, formData);
        if (res.data.success) {
          toast.success('Vehicle details updated successfully.');
          setModalOpen(false);
          fetchVehicles();
        }
      } else {
        const res = await api.post('/vehicles', formData);
        if (res.data.success) {
          toast.success(`Vehicle ${res.data.data.registrationNumber} added successfully.`);
          setModalOpen(false);
          fetchVehicles();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/vehicles/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success(`Vehicle ${deleteTarget.registrationNumber} removed.`);
        setDeleteTarget(null);
        fetchVehicles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete vehicle.');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'two-wheeler':
        return <Bike className="w-6 h-6 text-indigo-600" />;
      case 'accessible':
        return <Accessibility className="w-6 h-6 text-amber-600" />;
      default:
        return <Car className="w-6 h-6 text-teal-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registered Vehicles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal vehicles authorized for campus parking
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading your vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Vehicles Registered</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add your car or two-wheeler to begin making automated parking bookings.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            + Register First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    {getTypeIcon(v.vehicleType)}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {v.vehicleType}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="font-mono text-lg font-black text-slate-900 tracking-wide">
                    {v.registrationNumber}
                  </span>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    {v.model || 'Model not specified'}
                  </p>
                  {v.color && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Color: {v.color}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit Vehicle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(v)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Vehicle Details' : 'Register New Vehicle'}
        subtitle="Ensure registration plate matches your vehicle documents"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Registration Number Plate *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KA-01-AB-1234"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Vehicle Type *
            </label>
            <select
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            >
              <option value="four-wheeler">Four-Wheeler (Car / SUV / Sedan)</option>
              <option value="two-wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
              <option value="accessible">Accessible / Adapted Mobility Vehicle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Make & Model
            </label>
            <input
              type="text"
              placeholder="e.g. Honda City, Royal Enfield..."
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Vehicle Color
            </label>
            <input
              type="text"
              placeholder="e.g. Polar White, Metallic Grey..."
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Vehicle"
        message={`Are you sure you want to remove vehicle ${deleteTarget?.registrationNumber}? If this vehicle has active reservations, cancellation is required first.`}
        confirmText="Delete Vehicle"
        isLoading={deleting}
      />
    </div>
  );
};

export default MyVehiclesPage;
