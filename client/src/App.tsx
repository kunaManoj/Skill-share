import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AboutSection from './components/AboutSection';
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
      <div className="min-h-screen text-gray-900 font-sans">
        <SEO title="Home" />
        <Toaster position="top-center" richColors />
        <Navbar />
        <main className="relative pt-16">
          <Routes>
            <Route path="/" element={
              <div className="relative">
                {/* Hero Section */}
                <div className="relative overflow-hidden min-h-[calc(100vh-64px)]">
                  {/* Background Image & Overlay */}
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                    style={{ backgroundImage: `url('/hero-bg-v2.png')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/95 backdrop-blur-[1px]"></div>
                  </div>

                  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full px-6 md:px-12 text-center relative z-10">
                    <div className="w-full max-w-5xl space-y-8 py-16">
                      <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-purple-200 text-primary-600 text-[10px] font-bold tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                        <span>Revolutionizing Campus Learning</span>
                      </div>

                      <h1 className="flex flex-col items-center font-black tracking-tight text-gray-900 leading-[1.1] drop-shadow-sm">
                        <span className="text-5xl md:text-7xl">Master New Skills with</span>
                        <span className="text-5xl md:text-7xl text-primary-600">Campus Peers</span>
                      </h1>

                      <p className="text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
                        The simplest way to learn and teach within your campus.
                        Peer-to-peer learning, made premium.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                        <Link
                          to="/marketplace"
                          className="inline-flex justify-center items-center py-4 px-10 text-sm font-black text-white rounded-xl bg-primary-600 hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/25 active:scale-95 hover:-translate-y-1"
                        >
                          Browse Skills
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>

                {/* About Section */}
                <AboutSection />

                {/* Footer */}
                <Footer />
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
