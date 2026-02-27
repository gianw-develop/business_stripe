import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, CheckCircle2, CircleDashed, Loader2, Clock } from 'lucide-react';

type CompanyUploadStatus = {
    id: string;
    name: string;
    has_uploaded: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    amount?: number;
};

export function DashboardOverview() {
    const [data, setData] = useState<CompanyUploadStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        total_companies: 0,
        uploaded_count: 0,
        total_amount: 0
    });

    useEffect(() => {
        fetchTodayOverview();
    }, []);

    const fetchTodayOverview = async () => {
        try {
            // 1. Get all companies
            const { data: companies, error: compError } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (compError) throw compError;

            // 2. Get today's transactions
            const today = new Date().toISOString().split('T')[0];
            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('company_id, amount, status')
                .eq('date_expected', today);

            if (txError) throw txError;

            // Build map
            const txMap = new Map();
            let totalDayAmount = 0;

            txs?.forEach(tx => {
                txMap.set(tx.company_id, tx.amount);
                totalDayAmount += Number(tx.amount);
            });

            const processedData = companies.map(c => {
                const tx = txs?.find(t => t.company_id === c.id);
                return {
                    id: c.id,
                    name: c.name,
                    has_uploaded: !!tx,
                    status: tx?.status,
                    amount: tx?.amount
                };
            });

            setData(processedData);
            setSummary({
                total_companies: companies.length,
                uploaded_count: txs?.length || 0,
                total_amount: totalDayAmount
            });

        } catch (err) {
            console.error("Error fetching dashboard overview", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-500)]" />
            </div>
        );
    }

    const progressPercentage = summary.total_companies > 0
        ? (summary.uploaded_count / summary.total_companies) * 100
        : 0;

    return (
        <div className="mb-10 animate-in fade-in duration-500">

            {/* Progress Header Row */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
                <div className="w-full md:w-2/3">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-gray-400 font-medium">Daily Upload Progress (Today)</h3>
                        <span className="text-[var(--color-brand-500)] font-bold">{summary.uploaded_count} / {summary.total_companies} Completed</span>
                    </div>
                    <div className="w-full bg-[#0e1420] rounded-full h-3 overflow-hidden border border-[var(--color-dark-border)] relative">
                        <div
                            className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-400)] h-3 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div
                                className="absolute top-0 right-0 bottom-0 left-0 opacity-20"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23fff' fill-opacity='0.1'%3E%3C/rect%3E%3Cpath d='M0 8L8 0Z' stroke='%23000' stroke-opacity='0.1' stroke-width='1'%3E%3C/path%3E%3C/svg%3E")`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/3 bg-[#0e1420] border border-[var(--color-brand-500)]/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(0,210,255,0.05)]">
                    <div>
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Total Processed Today</p>
                        <p className="text-2xl font-bold text-white">${summary.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[var(--color-brand-500)]/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[var(--color-brand-500)]" />
                    </div>
                </div>
            </div>

            {/* Company Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data.map(company => (
                    <div
                        key={company.id}
                        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 transform hover:-translate-y-1 ${company.status === 'approved'
                            ? 'bg-gradient-to-br from-[var(--color-dark-card)] to-[var(--color-accent-green)]/10 border-[var(--color-accent-green)]/30 shadow-[0_4px_15px_rgba(34,197,94,0.1)]'
                            : company.status === 'pending'
                                ? 'bg-gradient-to-br from-[var(--color-dark-card)] to-yellow-500/10 border-yellow-500/30'
                                : 'bg-[#0e1420] border-[var(--color-dark-border)] opacity-70 hover:opacity-100'
                            }`}
                    >
                        {/* Status Icon */}
                        <div className="absolute top-3 right-3">
                            {company.status === 'approved' ? (
                                <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-green)]" />
                            ) : company.status === 'pending' ? (
                                <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
                            ) : (
                                <CircleDashed className="w-5 h-5 text-gray-600" />
                            )}
                        </div>

                        <h4 className={`font-bold mt-2 mb-3 pr-6 truncate ${company.has_uploaded ? 'text-gray-100' : 'text-gray-500'}`}>
                            {company.name}
                        </h4>

                        <div className="mt-auto">
                            {company.has_uploaded ? (
                                <p className="text-lg font-mono font-medium text-[var(--color-accent-green)]">
                                    ${company.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            ) : (
                                <p className="text-sm font-medium tracking-wide text-gray-600 uppercase">
                                    Pending
                                </p>
                            )}
                        </div>

                        {/* Very subtle background pattern for uploaded cards */}
                        {company.has_uploaded && (
                            <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12 pointer-events-none">
                                <CheckCircle2 className="w-24 h-24" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
