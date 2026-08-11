import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Plus, MessageSquare } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { getCustomer, getFollowUps, addFollowUp } from '../services/customers';
import { useAuth } from '../context/AuthContext';
import type { Customer, FollowUpNote } from '../types';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canAddNote = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<FollowUpNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getCustomer(parseInt(id)), getFollowUps(parseInt(id))])
      .then(([c, n]) => { setCustomer(c); setNotes(n); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setNoteError('');
    try {
      const newNote = await addFollowUp(parseInt(id!), note, followUpDate || null);
      setNotes([newNote, ...notes]);
      setNote('');
      setFollowUpDate('');
      // Refresh customer to get updated followUpDate
      const updated = await getCustomer(parseInt(id!));
      setCustomer(updated);
    } catch (err: any) {
      setNoteError(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Customer Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700" />
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout title="Customer Details">
        <p className="text-gray-500">Customer not found.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={customer.name}>
      <div className="mb-4">
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-forest-700 text-sm hover:underline">
          <ArrowLeft size={14} /> Back to Customers
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-1 card p-5 self-start"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-forest-950">{customer.name}</h2>
              <p className="text-gray-500 text-sm">{customer.businessName}</p>
            </div>
            <StatusBadge status={customer.status} />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-gray-600">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              {customer.mobile}
            </div>
            <div className="flex items-center gap-2.5 text-gray-600">
              <Mail size={14} className="text-gray-400 flex-shrink-0" />
              {customer.email}
            </div>
            <div className="flex items-start gap-2.5 text-gray-600">
              <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              {customer.address}
            </div>
            {customer.followUpDate && (
              <div className="flex items-center gap-2.5 text-gray-600">
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                Follow-up: {new Date(customer.followUpDate).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-sage-400/20 space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Type</span><span className="font-medium text-forest-800">{customer.type}</span>
            </div>
            {customer.gstNumber && (
              <div className="flex justify-between">
                <span>GST</span><span className="font-mono font-medium text-forest-800">{customer.gstNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Since</span>
              <span>{new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </motion.div>

        {/* Follow-up Notes */}
        <div className="xl:col-span-2 space-y-4">
          {/* Add Note */}
          {canAddNote && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5"
            >
              <h3 className="text-sm font-semibold text-forest-950 mb-3 flex items-center gap-2">
                <Plus size={14} /> Add Follow-up Note
              </h3>

              <form onSubmit={handleAddNote} className="space-y-3">
                {noteError && (
                  <p className="text-red-600 text-sm">{noteError}</p>
                )}
                <div>
                  <label className="label">Note *</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="What was discussed? What's the next step?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Next Follow-up Date</label>
                  <input
                    type="date"
                    className="input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving || !note.trim()} className="btn-primary">
                    {saving ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Notes List */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-sage-400/20 flex items-center gap-2">
              <MessageSquare size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-forest-950">Follow-up History</h3>
            </div>

            {notes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No follow-up notes yet.</div>
            ) : (
              <ul className="divide-y divide-sage-400/15">
                {notes.map((n) => (
                  <li key={n.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs font-medium text-forest-700">{n.createdBy.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
                    {n.followUpDate && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        Next follow-up: {new Date(n.followUpDate).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
