import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, Loader2 } from 'lucide-react';

export function AdminSettings() {
    const [commission, setCommission] = useState(10); // Default to 10
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('global_settings')
                .select('setting_value')
                .eq('setting_key', 'platform_fee_percentage')
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setCommission(Number(data.setting_value));
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage('');
        try {
            const { error } = await supabase
                .from('global_settings')
                .upsert({
                    setting_key: 'platform_fee_percentage',
                    setting_value: commission.toString(),
                    description: 'Porcentaje de comisión deducido al socio'
                }, { onConflict: 'setting_key' });

            if (error) throw error;

            setSuccessMessage('Commission updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error saving setting:", err);
            alert("Error saving settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[var(--color-brand-500)]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                Loading Settings...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-8 h-8 text-[var(--color-brand-500)]" />
                    <h2 className="text-2xl font-bold text-gray-100">Platform Settings</h2>
                </div>

                <div className="bg-[#0e1420] border border-[var(--color-dark-border)] rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-200 mb-2">Partner Commission / Platform Fee</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        This percentage is automatically deducted from the daily gross total that the partner uploads.
                        The final USDT calculation on their dashboard uses this value.
                    </p>

                    <div className="flex items-end gap-4">
                        <div className="flex-1 max-w-xs">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                Fee Percentage
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={commission}
                                    onChange={(e) => setCommission(Number(e.target.value))}
                                    className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] rounded-lg py-2.5 px-4 pr-10 text-gray-100 focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent outline-none transition-all"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    %
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${saving
                                ? 'bg-[var(--color-brand-600)]/50 text-white cursor-not-allowed'
                                : 'bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] text-white shadow-lg shadow-[var(--color-brand-500)]/20 hover:shadow-[var(--color-brand-500)]/40'
                                }`}
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {successMessage && (
                        <div className="mt-4 p-3 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 text-green-400 rounded-lg text-sm text-center animate-in slide-in-from-top-2">
                            {successMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
