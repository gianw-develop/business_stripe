import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { UploadForm } from './components/UploadForm';
import { DailyChecklist } from './components/DailyChecklist';
import { AdminTable } from './components/AdminTable';
import { Vault } from './components/Vault';
import { DashboardOverview } from './components/DashboardOverview';
import { PartnerDashboardOverview } from './components/PartnerDashboardOverview';
import { PartnerHistory } from './components/PartnerHistory';
import { StripeData } from './components/StripeData';
import { AdminSettings } from './components/AdminSettings';
import { LogOut, Loader2, UploadCloud, History, CreditCard, LayoutDashboard, KeyRound, Settings } from 'lucide-react';

function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto border-transparent">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">General Dashboard</h1>
        <p className="text-gray-400 mt-2">Global overview of profits and transaction approvals.</p>
      </div>

      <DashboardOverview />
      <AdminTable />
    </div>
  );
}

function UploadReceipt() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Upload Receipts</h1>
        <p className="text-gray-400 mt-2">Upload daily LLC deposits. The system will register them automatically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <UploadForm onUploadSuccess={() => setRefreshKey(prev => prev + 1)} />
        </div>

        <div className="lg:col-span-1">
          <DailyChecklist key={refreshKey} />
        </div>
      </div>
    </div>
  );
}

function PartnerHistoryView() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <section>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Partner Dashboard</h1>
          <p className="text-gray-400 mt-2">Your daily progress, pending amounts, and approved payouts.</p>
        </div>
        <PartnerDashboardOverview />
      </section>

      <section className="pt-8 border-t border-[var(--color-dark-border)]">
        <PartnerHistory />
      </section>
    </div>
  )
}

function StripeDataView() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Stripe Integration Data</h1>
        <p className="text-gray-400 mt-2">Secure view of necessary platform credentials.</p>
      </div>
      <StripeData />
    </div>
  )
}

function MainLayout({ children, session, userRole }: { children: React.ReactNode, session: any, userRole: string | null }) {
  const location = useLocation();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-[var(--color-dark-bg)] text-white flex flex-col">
      <div className="flex flex-1">
        <aside className="w-64 bg-[var(--color-dark-card)] border-r border-[var(--color-dark-border)] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[var(--color-brand-600)]">Business Dashboard</h2>
            <span className="bg-[var(--color-brand-600)]/20 text-[var(--color-brand-400)] text-[10px] px-2 py-0.5 rounded border border-[var(--color-brand-600)]/30">v2.1</span>
          </div>
          <nav className="flex-1 space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${isActive('/') ? 'bg-[var(--color-dark-border)] text-white' : 'text-gray-400 hover:text-white hover:bg-[var(--color-dark-border)]/50'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>

            <Link
              to="/upload"
              className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${isActive('/upload') ? 'bg-[var(--color-dark-border)] text-white' : 'text-gray-400 hover:text-white hover:bg-[var(--color-dark-border)]/50'}`}
            >
              <UploadCloud className="w-5 h-5" /> Upload Payments
            </Link>

            {!isAdmin && (
              <Link
                to="/history"
                className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${isActive('/history') ? 'bg-[var(--color-dark-border)] text-white' : 'text-gray-400 hover:text-white hover:bg-[var(--color-dark-border)]/50'}`}
              >
                <History className="w-5 h-5" /> History & Payouts
              </Link>
            )}

            {!isAdmin && (
              <Link
                to="/stripe"
                className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${isActive('/stripe') ? 'bg-[var(--color-dark-border)] text-white' : 'text-gray-400 hover:text-white hover:bg-[var(--color-dark-border)]/50'}`}
              >
                <CreditCard className="w-5 h-5" /> Stripe Data
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/vault"
                className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${isActive('/vault') ? 'bg-[var(--color-dark-border)] text-white' : 'text-gray-400 hover:text-white hover:bg-[var(--color-dark-border)]/50'}`}
              >
                <KeyRound className="w-5 h-5" /> Vault
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/settings"
                className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${isActive('/settings') ? 'bg-[var(--color-dark-border)] text-white' : 'text-gray-400 hover:text-white hover:bg-[var(--color-dark-border)]/50'}`}
              >
                <Settings className="w-5 h-5" /> Settings
              </Link>
            )}
          </nav>

          <div className="mt-auto pt-4 border-t border-[var(--color-dark-border)]">
            <div className="text-xs text-gray-400 mb-1 truncate px-2 border border-[var(--color-dark-border)] rounded p-1 inline-block bg-[#0e1420]">{isAdmin ? 'Admin' : 'Partner'}</div>
            <div className="text-xs text-gray-500 mb-3 truncate px-2">{session?.user?.email}</div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
          {/* Background blur effects */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--color-brand-600)]/5 to-transparent pointer-events-none"></div>
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    console.log("Fetching role for user:", userId);

    // Safety timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase request timed out")), 5000)
    );

    try {
      const rolePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') {
        console.error("Supabase error fetching role:", error);
        throw error;
      }

      console.log("Role fetched successfully:", data?.role);
      setUserRole(data?.role || 'admin');
    } catch (e) {
      console.error("Error fetching role or request timed out", e);
      // Fallback to partner so the app at least loads
      setUserRole('partner');
    } finally {
      console.log("Finalizing loading state");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-dark-bg)] flex flex-col items-center justify-center text-[var(--color-brand-500)]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Auth onLogin={() => { }} />;
  }

  const isAdmin = userRole === 'admin';

  return (
    <Router>
      <MainLayout session={session} userRole={userRole}>
        <Routes>
          <Route path="/" element={isAdmin ? <Dashboard /> : <PartnerHistoryView />} />
          {isAdmin && <Route path="/vault" element={<Vault />} />}
          {isAdmin && <Route path="/settings" element={<div className="p-8 max-w-7xl mx-auto"><AdminSettings /></div>} />}

          <Route path="/upload" element={<UploadReceipt />} />
          <Route path="/history" element={<PartnerHistoryView />} />
          <Route path="/stripe" element={<StripeDataView />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
