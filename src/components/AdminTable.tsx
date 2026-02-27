import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { CheckCircle2, Clock, ExternalLink, Calculator, DollarSign, Loader2, MessageSquare, Trash2 } from 'lucide-react';

type Transaction = {
    id: string;
    amount: number;
    receipt_url: string;
    date_expected: string;
    status: 'pending' | 'approved' | 'rejected';
    profit_percentage: number;
    notes?: string;
    companies: { name: string };
};

export function AdminTable() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Stats
    const [totalPending, setTotalPending] = useState(0);
    const [totalApproved, setTotalApproved] = useState(0);
    const [estimatedProfit, setEstimatedProfit] = useState(0);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const { data: txs, error } = await supabase
                .from('transactions')
                .select(`
          *,
          companies ( name )
        `)
                .order('date_expected', { ascending: false });

            if (error) throw error;

            setData(txs as Transaction[]);
            calculateStats(txs as Transaction[]);
        } catch (err) {
            console.error("Error fetching admin table data:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (txs: Transaction[]) => {
        let pending = 0;
        let approved = 0;
        let profit = 0;

        txs.forEach(tx => {
            if (tx.status === 'pending') pending += tx.amount;
            if (tx.status === 'approved') {
                approved += tx.amount;
                profit += (tx.amount * (tx.profit_percentage / 100));
            }
        });

        setTotalPending(pending);
        setTotalApproved(approved);
        setEstimatedProfit(profit);
    };

    const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            await fetchTransactions(); // refresh
        } catch (err) {
            console.error("Error updating status", err);
        } finally {
            setProcessingId(null);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this manual upload?')) return;
        try {
            setProcessingId(id);
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchTransactions(); // refresh
        } catch (err) {
            console.error("Error deleting", err);
        } finally {
            setProcessingId(null);
        }
    };

    const updateProfitPercentage = async (id: string, percentage: number) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ profit_percentage: percentage })
                .eq('id', id);

            if (error) throw error;
            await fetchTransactions(); // refresh to recalculate
        } catch (err) {
            console.error("Error updating profit %", err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-gray-400 mb-2">
                        <Clock className="w-5 h-5" />
                        <h3 className="font-medium">Total Pending</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-100">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-[var(--color-accent-green)] mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-medium text-green-400/80">Total Approved</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-400">${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-gradient-to-br from-[var(--color-dark-card)] to-[#0e1628] border border-[var(--color-brand-600)]/30 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-[var(--color-brand-500)]/5">
                        <DollarSign className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-3 text-[var(--color-brand-500)] mb-2 relative z-10">
                        <Calculator className="w-5 h-5" />
                        <h3 className="font-medium">Estimated Profit</h3>
                    </div>
                    <p className="text-3xl font-bold text-white relative z-10">${estimatedProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Main Excel-like Table */}
            <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#0e1420] text-gray-400 uppercase font-medium text-xs border-b border-[var(--color-dark-border)]">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Company (LLC)</th>
                                <th className="px-6 py-4">Receipt</th>
                                <th className="px-6 py-4 text-right">Deposited Amount</th>
                                <th className="px-6 py-4">Notes</th>
                                <th className="px-6 py-4 w-32">Profit %</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-dark-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-brand-500)]" />
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-[#0a0f1a]/50">
                                        No transactions registered yet.
                                    </td>
                                </tr>
                            ) : (
                                data.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(tx.date_expected), "MMM dd, yyyy", { locale: enUS })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-200">
                                            {tx.companies.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.receipt_url ? (
                                                <a
                                                    href={tx.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[var(--color-brand-600)] hover:text-[var(--color-brand-500)] transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> View
                                                </a>
                                            ) : <span className="text-gray-600">N/A</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={tx.notes || ''}>
                                            {tx.notes ? (
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{tx.notes}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    defaultValue={tx.profit_percentage}
                                                    onBlur={(e) => updateProfitPercentage(tx.id, parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-[#0a0f1a] border border-[var(--color-dark-border)] rounded-md py-1.5 px-3 text-right text-gray-200 focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none disabled:opacity-50"
                                                    disabled={tx.status !== 'pending'}
                                                />
                                                <span className="absolute right-8 top-1.5 text-gray-500">%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tx.status === 'approved'
                                                ? 'bg-[var(--color-accent-green)]/10 text-green-400 border-[var(--color-accent-green)]/20'
                                                : tx.status === 'rejected'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {tx.status === 'approved' ? 'Approved' : tx.status === 'rejected' ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {tx.status === 'pending' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => updateStatus(tx.id, 'approved')}
                                                        className="p-1.5 bg-[var(--color-accent-green)]/10 text-green-400 hover:bg-[var(--color-accent-green)]/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        {processingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        disabled={processingId === tx.id}
                                                        onClick={() => deleteTransaction(tx.id)}
                                                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Delete permanently"
                                                    >
                                                        {processingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
