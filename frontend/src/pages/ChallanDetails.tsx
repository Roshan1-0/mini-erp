import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, FileDown, Building2, Phone } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { getChallan, confirmChallan, cancelChallan, downloadInvoice } from '../services/challans';
import { useAuth } from '../context/AuthContext';
import type { SalesChallan } from '../types';

export default function ChallanDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAct = user?.role === 'ADMIN' || user?.role === 'SALES';
  const canInvoice = user?.role === 'ADMIN' || user?.role === 'ACCOUNTS';

  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getChallan(parseInt(id))
      .then(setChallan)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    if (!challan || !window.confirm('Confirm this challan? Stock will be deducted.')) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await confirmChallan(challan.id);
      setChallan(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!challan || !window.confirm('Cancel this challan?')) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await cancelChallan(challan.id);
      setChallan(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePDF() {
    if (!challan) return;
    setActionLoading(true);
    try {
      const blob = await downloadInvoice(challan.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${challan.challanNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Challan Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700" />
        </div>
      </AppLayout>
    );
  }

  if (!challan) {
    return <AppLayout title="Challan Details"><p className="text-gray-500">Challan not found.</p></AppLayout>;
  }

  return (
    <AppLayout title={challan.challanNumber}>
      <div className="mb-4">
        <Link to="/challans" className="inline-flex items-center gap-1.5 text-forest-700 text-sm hover:underline">
          <ArrowLeft size={14} /> Back to Challans
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Info card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-1 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Challan Number</p>
                <p className="font-bold text-forest-950 font-mono text-lg">{challan.challanNumber}</p>
              </div>
              <StatusBadge status={challan.status} />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-forest-950">{challan.customerNameSnapshot}</p>
                  <p className="text-xs text-gray-400">{challan.businessNameSnapshot}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Phone size={14} className="text-gray-400" />
                {challan.mobileSnapshot}
              </div>
              {challan.gstNumberSnapshot && (
                <div className="text-xs text-gray-500">GST: {challan.gstNumberSnapshot}</div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-sage-400/20 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created by</span>
                <span>{challan.createdBy?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span>{new Date(challan.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm text-forest-950">
                <span>Total</span>
                <span>₹{Number(challan.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
            {canAct && challan.status === 'DRAFT' && (
              <div className="mt-4 space-y-2">
                <button id="confirm-btn" onClick={handleConfirm} disabled={actionLoading} className="btn-primary w-full justify-center">
                  <Check size={14} /> {actionLoading ? 'Confirming...' : 'Confirm Challan'}
                </button>
                <button id="cancel-btn" onClick={handleCancel} disabled={actionLoading} className="btn-danger w-full justify-center">
                  <X size={14} /> {actionLoading ? 'Cancelling...' : 'Cancel Challan'}
                </button>
              </div>
            )}
            {canInvoice && challan.status === 'CONFIRMED' && (
              <button id="download-pdf-btn" onClick={handlePDF} disabled={actionLoading} className="btn-secondary w-full justify-center mt-4">
                <FileDown size={14} /> {actionLoading ? 'Generating...' : 'Download Invoice PDF'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Items table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-2 card overflow-hidden self-start">
          <div className="px-5 py-3.5 border-b border-sage-400/20">
            <h2 className="text-sm font-semibold text-forest-950">Challan Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sage-400">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Unit Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {challan.items.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="px-5 py-3 font-medium text-forest-950">{item.productNameSnapshot}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuSnapshot}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(item.totalPrice).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-forest-950">
                  <td colSpan={2} className="px-5 py-3 text-sage-50 font-semibold">Total</td>
                  <td className="px-4 py-3 text-right text-sage-50 font-bold">{challan.totalQuantity} units</td>
                  <td />
                  <td className="px-4 py-3 text-right text-sage-50 font-bold">
                    ₹{Number(challan.totalAmount).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
