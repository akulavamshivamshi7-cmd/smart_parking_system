import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Wrench,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Grid as GridIcon,
  List
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SlotCard from '../../components/parking/SlotCard';

const AdminSlotsPage = () => {
  const toast = useToast();
  const [slots, setSlots] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [filterSection, setFilterSection] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    slotNumber: '',
    slotType: 'four-wheeler',
    section: 'Ground Floor - Section A',
    basePricePerHour: 25,
    status: 'available',
    isUnderMaintenance: false,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [filterSection, filterType]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSection !== 'all') params.section = filterSection;
      if (filterType !== 'all') params.slotType = filterType;

      const res = await api.get('/slots', { params });
      if (res.data.success) {
        setSlots(res.data.data);
        if (res.data.sections) setSections(res.data.sections);
      }
    } catch (err) {
      toast.error('Failed to load parking slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      slotNumber: '',
      slotType: 'four-wheeler',
      section: sections[0] || 'Ground Floor - Section A',
      basePricePerHour: 25,
      status: 'available',
      isUnderMaintenance: false,
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (slot) => {
    setIsEditing(true);
    setEditingId(slot._id);
    setFormData({
      slotNumber: slot.slotNumber,
      slotType: slot.slotType,
      section: slot.section,
      basePricePerHour: slot.basePricePerHour || 20,
      status: slot.status,
      isUnderMaintenance: slot.isUnderMaintenance || slot.status === 'maintenance',
      description: slot.description || ''
    });
    setModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!formData.slotNumber.trim() || !formData.section.trim()) {
      toast.warning('Slot number and section are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        slotNumber: formData.slotNumber.toUpperCase().trim(),
        status: formData.isUnderMaintenance ? 'maintenance' : formData.status
      };

      if (isEditing) {
        const res = await api.put(`/slots/${editingId}`, payload);
        if (res.data.success) {
          toast.success(`Slot ${res.data.data.slotNumber} updated successfully.`);
          setModalOpen(false);
          fetchSlots();
        }
      } else {
        const res = await api.post('/slots', payload);
        if (res.data.success) {
          toast.success(`Slot ${res.data.data.slotNumber} created successfully.`);
          setModalOpen(false);
          fetchSlots();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (slot) => {
    try {
      const newStatus = slot.status === 'maintenance' || slot.isUnderMaintenance ? 'available' : 'maintenance';
      const res = await api.put(`/slots/${slot._id}`, {
        status: newStatus,
        isUnderMaintenance: newStatus === 'maintenance'
      });
      if (res.data.success) {
        toast.info(`Slot ${slot.slotNumber} is now ${newStatus}`);
        fetchSlots();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle maintenance.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/slots/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success(`Slot ${deleteTarget.slotNumber} deleted.`);
        setDeleteTarget(null);
        fetchSlots();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete slot with active reservations.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSlots = slots.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return s.slotNumber.toLowerCase().includes(term) || s.section.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Parking Slots</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure bay identifiers, sections, pricing, and maintenance status
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Parking Slot</span>
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Section Selector */}
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="all">All Sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Type Selector */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="all">All Types</option>
            <option value="four-wheeler">Four-Wheeler</option>
            <option value="two-wheeler">Two-Wheeler</option>
            <option value="accessible">Accessible</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search slot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>

        {/* View Mode Toggle: Table vs Grid */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-end md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Grid View"
          >
            <GridIcon className="w-4 h-4" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading parking inventory...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">No parking slots matched filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredSlots.map((slot) => (
            <div key={slot._id} className="relative group">
              <SlotCard slot={slot} />
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-md">
                <button
                  onClick={() => handleOpenEdit(slot)}
                  className="p-1 text-slate-700 hover:text-teal-600 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDeleteTarget(slot)}
                  className="p-1 text-rose-600 hover:text-rose-800 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Slot Number</th>
                  <th className="px-6 py-3.5">Section</th>
                  <th className="px-6 py-3.5">Slot Type</th>
                  <th className="px-6 py-3.5">Rate (₹/hr)</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlots.map((slot) => {
                  const isMaint = slot.status === 'maintenance' || slot.isUnderMaintenance;

                  return (
                    <tr key={slot._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900 text-sm">
                        {slot.slotNumber}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-700">{slot.section}</td>
                      <td className="px-6 py-3.5 capitalize font-semibold text-slate-600">
                        {slot.slotType.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">
                        ₹{slot.basePricePerHour}/hr
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isMaint
                              ? 'bg-slate-200 text-slate-700'
                              : slot.status === 'occupied'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isMaint ? 'Maintenance' : slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleToggleMaintenance(slot)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                            isMaint
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Toggle maintenance mode"
                        >
                          {isMaint ? 'Reopen' : 'Under Maint.'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(slot)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(slot)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Parking Slot' : 'Create Parking Slot'}
        subtitle="Manage parking bay parameters and allocation rules"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Slot Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A-09 or B-12"
              value={formData.slotNumber}
              onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Section / Floor *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ground Floor - Section A"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Slot Type
              </label>
              <select
                value={formData.slotType}
                onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="four-wheeler">Four-Wheeler</option>
                <option value="two-wheeler">Two-Wheeler</option>
                <option value="accessible">Accessible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rate (₹/hour)
              </label>
              <input
                type="number"
                min={0}
                value={formData.basePricePerHour}
                onChange={(e) => setFormData({ ...formData, basePricePerHour: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="maintToggle"
              checked={formData.isUnderMaintenance}
              onChange={(e) => setFormData({ ...formData, isUnderMaintenance: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="maintToggle" className="text-xs font-semibold text-slate-700 select-none">
              Mark slot as Under Maintenance (Out of service)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Near Stairwell 2, EV charger installed"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Slot' : 'Create Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Parking Slot"
        message={`Are you sure you want to permanently delete Slot ${deleteTarget?.slotNumber}? This will fail if there are active bookings.`}
        confirmText="Delete Slot"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminSlotsPage;
