import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { History, Calendar as CalendarIcon, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

type Transaction = {
    id: string;
    amount: number;
    date_expected: string;
    status: 'pending' | 'approved' | 'rejected';
    receipt_url: string;
    companies: { name: string };
};

export function PartnerHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [commissionRate, setCommissionRate] = useState(10);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // Fetch Global Commission Rate
            const { data: settingsData } = await supabase
                .from('global_settings')
                .select('setting_value')
                .eq('setting_key', 'platform_fee_percentage')
                .maybeSingle();

            if (settingsData) {
                setCommissionRate(Number(settingsData.setting_value) || 10);
            }

            // Fetch transactions for THIS specific user ONLY
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;

            if (!userId) return;

            const { data: txs, error } = await supabase
                .from('transactions')
                .select(`
                    id,
                    amount,
                    date_expected,
                    status,
                    receipt_url,
                    companies (name)
                `)
                .eq('user_id', userId)
                .order('date_expected', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(txs as any || []);
        } catch (error) {
            console.error("Error fetching history", error);
        } finally {
            setLoading(false);
        }
    };

    const pendingTxs = transactions.filter(t => t.status === 'pending');
    // Ensure rejected are also in history
    const processedTxs = transactions.filter(t => t.status !== 'pending');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[var(--color-brand-500)]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                Charging History...
            </div>
        );
    }

    const TransactionCard = ({ tx }: { tx: Transaction }) => {
        const commission = tx.amount * (commissionRate / 100);
        const finalUSDT = tx.amount - commission;

        return (
            <div className="bg-[#0e1420] border border-[var(--color-dark-border)] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-[var(--color-dark-border)]/30">
                <div className="flex items-center gap-4">
                    <div className="bg-[var(--color-dark-bg)] p-3 rounded-lg border border-[var(--color-dark-border)]">
                        {tx.status === 'pending' ? <Clock className="w-6 h-6 text-yellow-500" /> :
                            tx.status === 'approved' ? <CheckCircle2 className="w-6 h-6 text-green-500" /> :
                                <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-200">{tx.companies?.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CalendarIcon className="w-3 h-3" />
                            {format(new Date(tx.date_expected), "PP", { locale: enUS })}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                tx.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                    'bg-red-500/10 text-red-500'
                                }`}>
                                {tx.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-[var(--color-dark-bg)]/50 p-3 rounded-lg border border-[var(--color-dark-border)]/50">
                    <div>
                        <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">Gross</p>
                        <p className="font-medium text-gray-300 text-sm">${tx.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-red-400/70 mb-0.5 uppercase tracking-wider">Fee</p>
                        <p className="font-medium text-red-400/80 text-sm">-${commission.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-[var(--color-brand-400)] mb-0.5 uppercase tracking-wider font-semibold">USDT</p>
                        <p className="font-bold text-[var(--color-brand-400)] text-lg">
                            {finalUSDT.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Pending Section */}
            {pendingTxs.length > 0 && (
                <section>
                    <h3 className="text-lg font-bold mb-4 text-yellow-500 flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Awaiting Processing
                    </h3>
                    <div className="space-y-4">
                        {pendingTxs.map(tx => <TransactionCard key={tx.id} tx={tx} />)}
                    </div>
                </section>
            )}

            {/* History Section */}
            <section>
                <h3 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-[var(--color-brand-500)]" /> Upload History
                </h3>
                {processedTxs.length === 0 ? (
                    <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-8 text-center text-gray-500">
                        No processed transactions yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {processedTxs.map(tx => <TransactionCard key={tx.id} tx={tx} />)}
                    </div>
                )}
            </section>
        </div>
    );
}
