import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Eye, EyeOff, Copy, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

type Credential = {
    id: string;
    service_name: string;
    username: string;
    password_encrypted: string;
    notes?: string;
};

export function StripeData() {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchStripeAccesses();
    }, []);

    const fetchStripeAccesses = async () => {
        try {
            // Filter only to show credentials that have "Stripe" in the name
            const { data, error } = await supabase
                .from('vault_credentials')
                .select('*')
                .ilike('service_name', '%stripe%')
                .order('service_name');

            if (error) throw error;
            setCredentials(data || []);
        } catch (err) {
            console.error("Error fetching stripe credentials:", err);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[var(--color-brand-500)]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                Loading safe data...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert className="w-8 h-8 text-[var(--color-brand-500)]" />
                    <h2 className="text-2xl font-bold text-gray-100">Stripe Access Details</h2>
                </div>
                <p className="text-gray-400 mb-8 ml-11">
                    Read-only view of current administrative Stripe credentials.
                </p>

                {credentials.length === 0 ? (
                    <div className="text-center py-12 bg-[#0e1420] rounded-xl border border-[var(--color-dark-border)]">
                        <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-300">No Stripe Data Found</h3>
                        <p className="text-gray-500">The administrator hasn't added any Stripe credentials to the Vault yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {credentials.map((cred) => (
                            <div key={cred.id} className="bg-[#0e1420] border border-[var(--color-dark-border)] rounded-xl p-6 relative group overflow-hidden">
                                {/* Decorative gradient top border */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-green)] opacity-50"></div>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-[var(--color-dark-bg)] p-2.5 rounded-lg border border-[var(--color-dark-border)]">
                                        <CreditCard className="w-5 h-5 text-[var(--color-brand-400)]" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-200">{cred.service_name}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Email / Username</label>
                                        <div className="flex items-center justify-between bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] rounded-lg p-3">
                                            <span className="text-gray-300 font-mono text-sm">{cred.username}</span>
                                            <button
                                                onClick={() => copyToClipboard(cred.username, `user-${cred.id}`)}
                                                className="text-gray-500 hover:text-[var(--color-brand-400)] transition-colors"
                                                title="Copy username"
                                            >
                                                {copiedId === `user-${cred.id}` ? <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-green)]" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Password</label>
                                        <div className="flex items-center justify-between bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] rounded-lg p-3">
                                            <span className="text-gray-300 font-mono text-sm tracking-wider">
                                                {visiblePasswords[cred.id] ? cred.password_encrypted : '••••••••••••'}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => togglePasswordVisibility(cred.id)}
                                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                                    title={visiblePasswords[cred.id] ? "Hide password" : "Show password"}
                                                >
                                                    {visiblePasswords[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <div className="w-px h-4 bg-gray-700"></div>
                                                <button
                                                    onClick={() => copyToClipboard(cred.password_encrypted, `pass-${cred.id}`)}
                                                    className="text-gray-500 hover:text-[var(--color-brand-400)] transition-colors"
                                                    title="Copy password"
                                                >
                                                    {copiedId === `pass-${cred.id}` ? <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-green)]" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {cred.notes && (
                                        <div className="pt-2 border-t border-[var(--color-dark-border)] border-dashed mt-4">
                                            <label className="text-xs text-gray-500 font-medium block mb-1">Notes</label>
                                            <p className="text-sm text-gray-400 italic">{cred.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
