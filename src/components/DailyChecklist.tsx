import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, CircleDashed, Calculator, Wallet } from 'lucide-react';

type CompanyStatus = {
    id: string;
    name: string;
    has_uploaded: boolean;
};

export function DailyChecklist() {
    const [companies, setCompanies] = useState<CompanyStatus[]>([]);
    const [loading, setLoading] = useState(true);

    // Financial Stats for Partner
    const [dailyTotal, setDailyTotal] = useState(0);
    const [commissionRate, setCommissionRate] = useState(10); // Default to 10%

    useEffect(() => {
        fetchDailyStatus();
    }, []);

    const fetchDailyStatus = async () => {
        try {
            // Fetch Global Commission Rate first
            const { data: settingsData, error: settingsError } = await supabase
                .from('global_settings')
                .select('setting_value')
                .eq('setting_key', 'platform_fee_percentage')
                .maybeSingle();

            if (!settingsError && settingsData) {
                setCommissionRate(Number(settingsData.setting_value) || 10);
            }

            // Get all companies
            const { data: allCompanies, error: compError } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (compError) throw compError;

            // Get today's uploads WITH the amount from transactions
            const today = new Date().toISOString().split('T')[0];

            // We need to join with transactions to get the amount for today
            const { data: todayTracking, error: trackError } = await supabase
                .from('daily_tracking')
                .select(`
                    company_id,
                    has_uploaded,
                    transactions(amount)
                `)
                .eq('tracking_date', today)
                .eq('has_uploaded', true);

            if (trackError) throw trackError;

            const validTrackingIds = new Set<string>();
            let total = 0;

            todayTracking?.forEach((t: any) => {
                let hasValidTransaction = false;

                if (t.transactions) {
                    // Supabase 1:1 vs 1:N relations sometimes return objects or arrays.
                    if (Array.isArray(t.transactions) && t.transactions.length > 0) {
                        total += Number(t.transactions[0].amount);
                        hasValidTransaction = true;
                    } else if (!Array.isArray(t.transactions) && t.transactions.amount !== undefined) {
                        total += Number(t.transactions.amount);
                        hasValidTransaction = true;
                    }
                }

                if (hasValidTransaction) {
                    validTrackingIds.add(t.company_id);
                }
            });

            setDailyTotal(total);

            const statusMap = allCompanies.map(c => ({
                id: c.id,
                name: c.name,
                has_uploaded: validTrackingIds.has(c.id)
            }));

            setCompanies(statusMap);
        } catch (error) {
            console.error("Error fetching daily checklist", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse flex flex-col gap-3 p-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-10 bg-[var(--color-dark-border)] rounded-lg"></div>)}
        </div>;
    }

    const completed = companies.filter(c => c.has_uploaded).length;
    const totalCompanies = companies.length;
    const progress = totalCompanies > 0 ? (completed / totalCompanies) * 100 : 0;

    // Partner Math
    const commission = dailyTotal * (commissionRate / 100);
    const finalUSDT = dailyTotal - commission;

    return (
        <div className="space-y-6">
            {/* 1. Statistics Panel (New Request) */}
            <div className="bg-gradient-to-br from-[#0d1424] to-[#0a0f1a] border border-[var(--color-brand-600)]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,210,255,0.05)] relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-[var(--color-brand-500)]/5">
                    <Wallet className="w-40 h-40" />
                </div>

                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                    <Calculator className="w-4 h-4 text-[var(--color-brand-500)]" /> Today's Payout Estimate
                </h3>

                <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-center text-sm border-b border-[var(--color-dark-border)]/50 pb-2">
                        <span className="text-gray-400">Gross Deposited:</span>
                        <span className="text-gray-200 font-medium">${dailyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-[var(--color-dark-border)]/50 pb-2">
                        <span className="text-red-400/80">Platform Fee ({commissionRate}%):</span>
                        <span className="text-red-400/80 font-medium">-${commission.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-gray-400 text-sm">You receive:</span>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-accent-green)]">
                                {finalUSDT.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[var(--color-accent-green)] font-bold ml-1">USDT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Checklist Panel */}
            <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-100">Daily Upload Progress</h3>
                    <span className="text-sm font-medium text-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 px-3 py-1 rounded-md">
                        {completed} / {totalCompanies}
                    </span>
                </div>

                <div className="w-full bg-[#0e1420] rounded-full h-2 mb-6 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-green)] h-2 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="space-y-3">
                    {companies.map(company => (
                        <div
                            key={company.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${company.has_uploaded
                                ? 'bg-[var(--color-accent-green)]/10 border-[var(--color-accent-green)]/30 text-green-400'
                                : 'bg-[#0e1420] border-[var(--color-dark-border)] text-gray-400'
                                }`}
                        >
                            {company.has_uploaded ? (
                                <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-green)]" />
                            ) : (
                                <CircleDashed className="w-5 h-5 text-gray-500" />
                            )}
                            <span className={`font-medium ${company.has_uploaded ? 'text-gray-200' : 'text-gray-400'}`}>
                                {company.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
