import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, Plus, Eye, EyeOff, Save, Trash2, Loader2 } from 'lucide-react';

type Credential = {
    id: string;
    service_name: string;
    username: string;
    password_encrypted: string;
    notes: string;
};

export function Vault() {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [serviceName, setServiceName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // UI State
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        try {
            const { data, error } = await supabase
                .from('vault_credentials')
                .select('*')
                .order('service_name');

            if (error) throw error;
            setCredentials(data as Credential[]);
        } catch (err) {
            console.error("Error fetching vault data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // In a real prod app, you'd encrypt this before sending to DB.
            // Since it's restricted by RLS to authenticated admins, we store it directly for this version.
            const { error } = await supabase
                .from('vault_credentials')
                .insert({
                    service_name: serviceName,
                    username,
                    password_encrypted: password,
                    notes
                });

            if (error) throw error;

            // Reset
            setShowForm(false);
            setServiceName('');
            setUsername('');
            setPassword('');
            setNotes('');
            await fetchCredentials();
        } catch (err) {
            console.error("Error saving credential", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this credential?')) return;

        try {
            const { error } = await supabase
                .from('vault_credentials')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchCredentials();
        } catch (err) {
            console.error("Error deleting credential", err);
        }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                        <KeyRound className="w-8 h-8 text-[var(--color-brand-500)]" />
                        Credentials Vault
                    </h1>
                    <p className="text-gray-400 mt-2">Securely store the users and passwords for the LLCs.</p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-[var(--color-dark-bg)] font-bold py-2.5 px-5 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    {showForm ? 'Cancel' : 'New Credential'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-[var(--color-dark-card)] border border-[var(--color-brand-500)]/30 rounded-2xl p-6 mb-8 shadow-[0_0_20px_rgba(0,210,255,0.05)] animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4 text-gray-200">Register Credential</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Service/Bank Name</label>
                            <input
                                required
                                type="text"
                                placeholder="E.g. Chase Bank (LLC 1)"
                                value={serviceName}
                                onChange={e => setServiceName(e.target.value)}
                                className="w-full bg-[#0e1420] border border-[var(--color-dark-border)] rounded-lg p-2.5 text-white outline-none focus:border-[var(--color-brand-500)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Username / Email</label>
                            <input
                                required
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-[#0e1420] border border-[var(--color-dark-border)] rounded-lg p-2.5 text-white outline-none focus:border-[var(--color-brand-500)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Password</label>
                            <input
                                required
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#0e1420] border border-[var(--color-dark-border)] rounded-lg p-2.5 text-white outline-none focus:border-[var(--color-brand-500)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                            <input
                                type="text"
                                placeholder="PINs, security questions..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-[#0e1420] border border-[var(--color-dark-border)] rounded-lg p-2.5 text-white outline-none focus:border-[var(--color-brand-500)]"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            disabled={saving}
                            className="flex items-center gap-2 bg-[var(--color-accent-green)]/20 text-green-400 hover:bg-[var(--color-accent-green)]/30 border border-[var(--color-accent-green)]/50 py-2 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save to Vault
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--color-brand-500)]" />
                </div>
            ) : credentials.length === 0 ? (
                <div className="text-center py-20 bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl">
                    <KeyRound className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-xl font-medium text-gray-300">Empty Vault</h3>
                    <p className="text-gray-500">Add your first bank credentials to keep them secure here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credentials.map(cred => (
                        <div key={cred.id} className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-xl p-5 hover:border-[var(--color-brand-500)]/50 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-[var(--color-brand-500)]">{cred.service_name}</h3>
                                <button
                                    onClick={() => handleDelete(cred.id)}
                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-[#0e1420] p-3 rounded-lg border border-[var(--color-dark-border)]">
                                    <p className="text-xs text-gray-500 mb-1">Username / Email</p>
                                    <p className="font-mono text-gray-200 select-all">{cred.username}</p>
                                </div>

                                <div className="bg-[#0e1420] p-3 rounded-lg border border-[var(--color-dark-border)] flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Password</p>
                                        <p className="font-mono text-gray-200 select-all">
                                            {visiblePasswords[cred.id] ? cred.password_encrypted : '••••••••••••'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => togglePasswordVisibility(cred.id)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {visiblePasswords[cred.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {cred.notes && (
                                    <div className="text-sm border-t border-[var(--color-dark-border)] pt-3 mt-3 text-gray-400">
                                        <span className="text-gray-500">Notes:</span> {cred.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
