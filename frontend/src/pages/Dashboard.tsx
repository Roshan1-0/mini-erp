import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import type { DashboardData } from '../types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-forest-950 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700" />
        </div>
      </AppLayout>
    );
  }

  if (!data) return <AppLayout title="Dashboard"><p className="text-gray-500">Failed to load dashboard.</p></AppLayout>;

  const { stats, lowStockProducts, recentChallans, followUpsDue } = data;

  return (
    <AppLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Customers" value={stats.totalCustomers} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} color="bg-forest-700/10 text-forest-700" />
        <StatCard label="Low Stock" value={stats.lowStockCount} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard label="Draft Challans" value={stats.draftChallans} icon={FileText} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Low Stock */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-sage-400/20 flex items-center justify-between">
            <h2 className="font-semibold text-forest-950 text-sm">Low Stock Products</h2>
            <Link to="/inventory" className="text-forest-700 text-xs font-medium hover:underline">View All →</Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">All products have sufficient stock.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-sage-400">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">SKU</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Current</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Min</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="table-row"
                    >
                      <td className="px-5 py-3 font-medium text-forest-950">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-red-600 font-semibold">{p.currentStock}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{p.minimumStock}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.location}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Follow-ups Due */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-sage-400/20 flex items-center justify-between">
            <h2 className="font-semibold text-forest-950 text-sm">Follow-ups Due</h2>
            <Calendar size={14} className="text-gray-400" />
          </div>

          {followUpsDue.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No follow-ups due today.</div>
          ) : (
            <ul className="divide-y divide-sage-400/15">
              {followUpsDue.map((c) => (
                <li key={c.id} className="px-5 py-3 hover:bg-sage-50 transition-colors">
                  <Link to={`/customers/${c.id}`} className="block">
                    <p className="font-medium text-forest-950 text-sm">{c.name}</p>
                    <p className="text-gray-500 text-xs">{c.businessName}</p>
                    <p className="text-red-500 text-[11px] mt-0.5">
                      Due: {new Date(c.followUpDate).toLocaleDateString('en-IN')}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Challans */}
      <div className="mt-5 card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-sage-400/20 flex items-center justify-between">
          <h2 className="font-semibold text-forest-950 text-sm">Recent Challans</h2>
          <Link to="/challans" className="text-forest-700 text-xs font-medium hover:underline">View All →</Link>
        </div>

        {recentChallans.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No challans created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sage-400">Challan #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Customer</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-sage-400">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-sage-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentChallans.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="px-5 py-3">
                      <Link to={`/challans/${c.id}`} className="text-forest-700 font-medium hover:underline font-mono text-xs">
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-forest-950">{c.customerNameSnapshot}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(c.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
