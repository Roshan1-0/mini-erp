import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Pencil, Filter } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { getCustomers, createCustomer, updateCustomer } from '../services/customers';
import { useAuth } from '../context/AuthContext';
import type { Customer, CustomerStatus, CustomerType } from '../types';

const emptyForm = {
  name: '', mobile: '', email: '', businessName: '', gstNumber: '',
  type: 'WHOLESALE' as CustomerType, address: '', status: 'LEAD' as CustomerStatus,
};

export default function Customers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomers({ page, limit: 10, search: search || undefined, status: statusFilter || undefined });
      setCustomers(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  function openCreate() {
    setEditCustomer(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setForm({
      name: c.name, mobile: c.mobile, email: c.email,
      businessName: c.businessName, gstNumber: c.gstNumber || '',
      type: c.type, address: c.address, status: c.status,
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editCustomer) {
        await updateCustomer(editCustomer.id, form);
      } else {
        await createCustomer(form);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Customers">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="customer-search"
            type="text"
            placeholder="Search name, business, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-gray-400" />
          <select
            id="customer-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input !w-auto text-xs"
          >
            <option value="">All Status</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {canEdit && (
          <button id="add-customer-btn" onClick={openCreate} className="btn-primary ml-auto">
            <Plus size={14} /> Add Customer
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-5 py-3 text-xs font-semibold text-sage-400">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Business</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Mobile</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Follow-up</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No customers found.</td></tr>
              ) : (
                customers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="px-5 py-3 font-medium text-forest-950">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.businessName}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.mobile}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          to={`/customers/${c.id}`}
                          className="p-1.5 text-forest-700 hover:bg-sage-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 text-gray-500 hover:bg-sage-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 border-t border-sage-400/20">
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSave} className="space-y-3">
          {formError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Mobile *</label>
              <input className="input" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className="label">Business Name *</label>
            <input className="input" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>

          <div>
            <label className="label">GST Number</label>
            <input className="input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CustomerType })}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Address *</label>
            <textarea className="input resize-none" rows={2} required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
