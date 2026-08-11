import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, TrendingUp, TrendingDown, History, AlertTriangle, Filter } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { getProducts, createProduct, updateProduct, addStock, removeStock, getStockMovements } from '../services/products';
import { useAuth } from '../context/AuthContext';
import type { Product, StockMovement } from '../types';

const emptyForm = {
  name: '', sku: '', category: '', unitPrice: 0,
  currentStock: 0, minimumStock: 5, location: '',
};

export default function Inventory() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const canStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Stock modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockMode, setStockMode] = useState<'IN' | 'OUT'>('IN');
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState('');
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState('');

  // Movements modal
  const [showMovements, setShowMovements] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts({ page, limit: 10, search: search || undefined });
      setProducts(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  function openCreate() {
    setEditProduct(null);
    setForm(emptyForm);
    setFormError('');
    setShowProductModal(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name, sku: p.sku, category: p.category,
      unitPrice: Number(p.unitPrice), currentStock: p.currentStock,
      minimumStock: p.minimumStock, location: p.location,
    });
    setFormError('');
    setShowProductModal(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, form);
      } else {
        await createProduct(form);
      }
      setShowProductModal(false);
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  function openStock(p: Product, mode: 'IN' | 'OUT') {
    setStockProduct(p);
    setStockMode(mode);
    setStockQty(1);
    setStockReason('');
    setStockError('');
    setShowStockModal(true);
  }

  async function handleStockSave(e: React.FormEvent) {
    e.preventDefault();
    if (!stockProduct) return;
    setStockSaving(true);
    setStockError('');
    try {
      if (stockMode === 'IN') {
        await addStock(stockProduct.id, stockQty, stockReason);
      } else {
        await removeStock(stockProduct.id, stockQty, stockReason);
      }
      setShowStockModal(false);
      load();
    } catch (err: any) {
      setStockError(err.response?.data?.message || 'Stock operation failed');
    } finally {
      setStockSaving(false);
    }
  }

  async function openMovements(p: Product) {
    setStockProduct(p);
    setShowMovements(true);
    setMovementsLoading(true);
    try {
      const data = await getStockMovements(p.id);
      setMovements(data);
    } finally {
      setMovementsLoading(false);
    }
  }

  const isLowStock = (p: Product) => p.currentStock <= p.minimumStock;

  return (
    <AppLayout title="Inventory">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="inventory-search"
            type="text"
            placeholder="Search product, SKU, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        {canManage && (
          <button id="add-product-btn" onClick={openCreate} className="btn-primary ml-auto">
            <Plus size={14} /> Add Product
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-5 py-3 text-xs font-semibold text-sage-400">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Min</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No products found.</td></tr>
              ) : (
                products.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`table-row ${isLowStock(p) ? 'bg-red-50/40' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isLowStock(p) && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                        <span className="font-medium text-forest-950">{p.name}</span>
                      </div>
                      <p className="text-gray-400 text-xs">{p.location}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.category}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(p.unitPrice).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${isLowStock(p) ? 'text-red-600' : 'text-forest-800'}`}>
                        {p.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.minimumStock}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={isLowStock(p) ? 'LOW' : 'IN STOCK'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {canManage && (
                          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:bg-sage-50 rounded transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                        )}
                        {canStock && (
                          <>
                            <button onClick={() => openStock(p, 'IN')} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Add Stock">
                              <TrendingUp size={13} />
                            </button>
                            <button onClick={() => openStock(p, 'OUT')} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Remove Stock">
                              <TrendingDown size={13} />
                            </button>
                          </>
                        )}
                        <button onClick={() => openMovements(p)} className="p-1.5 text-forest-700 hover:bg-sage-50 rounded transition-colors" title="History">
                          <History size={13} />
                        </button>
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

      {/* Product Modal */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title={editProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSaveProduct} className="space-y-3">
          {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

          <div>
            <label className="label">Product Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SKU *</label>
              <input className="input" required disabled={!!editProduct} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="label">Category *</label>
              <input className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Unit Price *</label>
              <input type="number" min="0" step="0.01" className="input" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) })} />
            </div>
            {!editProduct && (
              <div>
                <label className="label">Initial Stock</label>
                <input type="number" min="0" className="input" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) })} />
              </div>
            )}
            <div>
              <label className="label">Min Stock</label>
              <input type="number" min="0" className="input" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: parseInt(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Location *</label>
            <input className="input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowProductModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal isOpen={showStockModal} onClose={() => setShowStockModal(false)} title={stockMode === 'IN' ? 'Add Stock' : 'Remove Stock'} size="sm">
        <form onSubmit={handleStockSave} className="space-y-3">
          {stockError && <p className="text-red-600 text-sm">{stockError}</p>}
          <div className="bg-sage-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-forest-950">{stockProduct?.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">Current stock: <strong>{stockProduct?.currentStock}</strong></p>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input type="number" min="1" className="input" required value={stockQty} onChange={(e) => setStockQty(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Reason *</label>
            <input className="input" required placeholder={stockMode === 'IN' ? 'e.g. Received from supplier' : 'e.g. Dispatched to customer'} value={stockReason} onChange={(e) => setStockReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={stockSaving} className={stockMode === 'IN' ? 'btn-primary' : 'btn-danger'}>
              {stockSaving ? 'Processing...' : stockMode === 'IN' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Movements Modal */}
      <Modal isOpen={showMovements} onClose={() => setShowMovements(false)} title={`Stock History — ${stockProduct?.name}`} size="lg">
        {movementsLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-forest-700" /></div>
        ) : movements.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No stock movements recorded.</p>
        ) : (
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="table-header">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-sage-400">Type</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-sage-400">Qty</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-sage-400">Reason</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-sage-400">By</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-sage-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="px-3 py-2.5"><StatusBadge status={m.movementType} /></td>
                    <td className="px-3 py-2.5 text-right font-medium">{m.quantity}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{m.reason}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{m.createdBy.name}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
