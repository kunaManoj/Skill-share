import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import AddSkillPage from './pages/AddSkillPage';
import MarketplacePage from './pages/MarketplacePage';
import SkillDetailPage from './pages/SkillDetailPage';
import BookingsPage from './pages/BookingsPage';
import WalletPage from './pages/WalletPage';
import ChatPage from './pages/ChatPage';
import MeetingPage from './pages/MeetingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import { SignedIn } from '@clerk/clerk-react';
import { Toaster } from 'sonner';
import SEO from './components/SEO';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-gray-900 font-sans transition-colors duration-300">
        <SEO title="Home" />
        <Toaster position="top-center" richColors />
        <Navbar />
        <main className="relative pt-16">
          <Routes>
            <Route path="/" element={
              <div className="relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl opacity-50 animate-blob mix-blend-multiply filter"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary-200/40 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000 mix-blend-multiply filter"></div>

                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center relative z-10">
                  <div className="max-w-3xl space-y-6 py-12">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/50 border border-primary-100 text-primary-600 text-[10px] font-bold tracking-widest uppercase mb-4 backdrop-blur-sm">
                      <span>Revolutionizing Campus Learning</span>
                    </div>

                    <h1 className="flex flex-col items-center font-black tracking-tight text-black leading-[1.1]">
                      <span className="text-4xl md:text-6xl">Master New Skills with</span>
                      <span className="text-4xl md:text-6xl text-primary-600">Campus Peers</span>
                    </h1>

                    <p className="text-base md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed font-medium">
                      The simplest way to learn and teach within your campus.
                      Peer-to-peer learning, made premium.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                      <Link
                        to="/marketplace"
                        className="inline-flex justify-center items-center py-4 px-10 text-sm font-black text-white rounded-xl bg-primary-600 hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/25 active:scale-95"
                      >
                        Browse Skills
                      </Link>
                      <Link
                        to="/skills/new"
                        className="inline-flex justify-center items-center py-4 px-10 text-sm font-black text-gray-900 rounded-xl bg-white/60 border border-gray-200 hover:bg-white/90 transition-all shadow-sm active:scale-95 backdrop-blur-sm"
                      >
                        Become a Mentor
                      </Link>
                    </div>


                  </div>
                </div>
              </div>
            } />


            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/skills/:id" element={<SkillDetailPage />} />
            <Route path="/skills/new" element={
              <SignedIn><AddSkillPage /></SignedIn>
            } />
            <Route path="/bookings" element={
              <SignedIn><BookingsPage /></SignedIn>
            } />
            <Route path="/wallet" element={
              <SignedIn><WalletPage /></SignedIn>
            } />
            <Route path="/chat" element={
              <SignedIn><ChatPage /></SignedIn>
            } />
            <Route path="/meeting/:bookingId" element={
              <SignedIn><MeetingPage /></SignedIn>
            } />
            <Route path="/admin" element={
              <SignedIn><AdminDashboardPage /></SignedIn>
            } />
            <Route path="/notifications" element={
              <SignedIn><NotificationsPage /></SignedIn>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
