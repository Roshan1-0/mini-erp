import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { getCustomers } from '../services/customers';
import { getProducts } from '../services/products';
import { createChallan } from '../services/challans';
import type { Customer, Product } from '../types';

interface Item {
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export default function CreateChallan() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getCustomers({ limit: 200 }),
      getProducts({ limit: 200 }),
    ]).then(([c, p]) => {
      setCustomers(c.items);
      setProducts(p.items);
    }).finally(() => setLoading(false));
  }, []);

  function addItem() {
    if (!selectedProduct || selectedQty < 1) return;
    const product = products.find((p) => p.id === parseInt(selectedProduct));
    if (!product) return;

    // Don't add duplicate products
    if (items.find((i) => i.productId === product.id)) {
      setError(`${product.name} is already in the list. Update the quantity instead.`);
      return;
    }

    const unitPrice = Number(product.unitPrice);
    setItems([...items, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice,
      quantity: selectedQty,
      totalPrice: unitPrice * selectedQty,
    }]);
    setSelectedProduct('');
    setSelectedQty(1);
    setError('');
  }

  function removeItem(productId: number) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function updateQty(productId: number, qty: number) {
    if (qty < 1) return;
    setItems(items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: qty, totalPrice: i.unitPrice * qty }
        : i
    ));
  }

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);

  async function handleSave(confirm: boolean) {
    if (!customerId) { setError('Please select a customer'); return; }
    if (items.length === 0) { setError('Please add at least one product'); return; }

    setSaving(true);
    setError('');
    try {
      const challan = await createChallan({
        customerId: parseInt(customerId),
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (confirm) {
        const { confirmChallan } = await import('../services/challans');
        await confirmChallan(challan.id);
      }

      navigate(`/challans/${challan.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create challan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Create Challan">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Create Challan">
      <div className="mb-4">
        <button onClick={() => navigate('/challans')} className="inline-flex items-center gap-1.5 text-forest-700 text-sm hover:underline">
          <ArrowLeft size={14} /> Back to Challans
        </button>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* Customer */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h2 className="text-sm font-semibold text-forest-950 mb-3">1. Select Customer</h2>
          <div>
            <label className="label">Customer *</label>
            <select
              id="challan-customer-select"
              className="input"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">— Select a customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.businessName}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Add Product */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <h2 className="text-sm font-semibold text-forest-950 mb-3">2. Add Products</h2>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Product</label>
              <select
                id="challan-product-select"
                className="input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">— Select a product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.currentStock}) — ₹{Number(p.unitPrice).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="label">Quantity</label>
              <input
                id="challan-qty-input"
                type="number"
                min="1"
                className="input"
                value={selectedQty}
                onChange={(e) => setSelectedQty(parseInt(e.target.value))}
              />
            </div>
            <button
              id="add-item-btn"
              type="button"
              onClick={addItem}
              disabled={!selectedProduct}
              className="btn-secondary h-[38px] flex-shrink-0"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </motion.div>

        {/* Items Table */}
        {items.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-sage-400/20">
              <h2 className="text-sm font-semibold text-forest-950">3. Review Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-sage-400/20">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">SKU</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Unit Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId} className="border-b border-sage-400/10">
                      <td className="px-5 py-3 font-medium text-forest-950">{item.productName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.productId, parseInt(e.target.value))}
                          className="w-16 text-right border border-sage-400/40 rounded px-2 py-1 text-sm
                                     focus:outline-none focus:ring-1 focus:ring-forest-700/30"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeItem(item.productId)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-forest-950">
                    <td colSpan={3} className="px-5 py-3 text-sage-50 font-semibold text-sm">Total</td>
                    <td className="px-4 py-3 text-right text-sage-50 font-bold">{totalQuantity} units</td>
                    <td className="px-4 py-3 text-right text-sage-50 font-bold">₹{totalAmount.toLocaleString('en-IN')}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-sage-400/20">
              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button
                  id="save-draft-btn"
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="btn-secondary"
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  id="confirm-challan-btn"
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Confirming...' : 'Confirm Challan'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {items.length === 0 && error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </div>
    </AppLayout>
  );
}
