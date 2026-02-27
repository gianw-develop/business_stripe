import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export function Auth({ onLogin }: { onLogin: () => void }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            onLogin(); // User securely logged in!
        } catch (err: any) {
            setError(err.message || 'Error signing in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-dark-bg)] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-green)]"></div>

                <div className="p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                            Business <span className="text-[var(--color-brand-500)]">Admin</span>
                        </h1>
                        <p className="text-gray-400">Sign in to your premium dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-[var(--color-accent-red)] p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-[var(--color-dark-border)] rounded-xl leading-5 bg-[#0e1420] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)] sm:text-sm transition-colors"
                                        placeholder="admin@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-[var(--color-dark-border)] rounded-xl leading-5 bg-[#0e1420] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)] sm:text-sm transition-colors"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-[var(--color-dark-bg)] bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-[var(--color-dark-bg)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
