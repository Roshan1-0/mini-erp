import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Check, X, FileDown, Filter } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { getChallans, confirmChallan, cancelChallan, downloadInvoice } from '../services/challans';
import { useAuth } from '../context/AuthContext';
import type { SalesChallan } from '../types';

export default function Challans() {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';
  const canAct = user?.role === 'ADMIN' || user?.role === 'SALES';
  const canInvoice = user?.role === 'ADMIN' || user?.role === 'ACCOUNTS';

  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getChallans({ page, limit: 10, search: search || undefined, status: statusFilter || undefined });
      setChallans(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function handleConfirm(id: number) {
    if (!window.confirm('Confirm this challan? Stock will be deducted.')) return;
    setActionLoading(id);
    setActionError('');
    try {
      await confirmChallan(id);
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to confirm challan');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id: number) {
    if (!window.confirm('Cancel this challan?')) return;
    setActionLoading(id);
    setActionError('');
    try {
      await cancelChallan(id);
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownloadPDF(id: number, challanNumber: string) {
    setActionLoading(id);
    try {
      const blob = await downloadInvoice(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${challanNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <AppLayout title="Sales Challans">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="challan-search"
            type="text"
            placeholder="Search challan number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-gray-400" />
          <select
            id="challan-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input !w-auto text-xs"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {canCreate && (
          <Link to="/challans/create" id="create-challan-btn" className="btn-primary ml-auto">
            <Plus size={14} /> New Challan
          </Link>
        )}
      </div>

      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm">
          {actionError}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-5 py-3 text-xs font-semibold text-sage-400">Challan #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Items</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading challans...</td></tr>
              ) : challans.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No challans found.</td></tr>
              ) : (
                challans.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="px-5 py-3">
                      <Link to={`/challans/${c.id}`} className="text-forest-700 font-medium hover:underline font-mono text-xs">
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-forest-950">{c.customerNameSnapshot}</p>
                      <p className="text-gray-400 text-xs">{c.businessNameSnapshot}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.totalQuantity} units</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(c.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/challans/${c.id}`} className="p-1.5 text-forest-700 hover:bg-sage-50 rounded" title="View">
                          <Eye size={13} />
                        </Link>
                        {canAct && c.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleConfirm(c.id)}
                              disabled={actionLoading === c.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Confirm"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => handleCancel(c.id)}
                              disabled={actionLoading === c.id}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                        {canInvoice && c.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleDownloadPDF(c.id, c.challanNumber)}
                            disabled={actionLoading === c.id}
                            className="p-1.5 text-forest-700 hover:bg-sage-50 rounded transition-colors"
                            title="Download Invoice PDF"
                          >
                            <FileDown size={13} />
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
    </AppLayout>
  );
}
