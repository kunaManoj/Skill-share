import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SignedIn } from '@clerk/clerk-react';
import AboutSection from './AboutSection';
import Footer from './Footer';
import SignInPage from '../pages/SignInPage';
import SignUpPage from '../pages/SignUpPage';
import AddSkillPage from '../pages/AddSkillPage';
import MarketplacePage from '../pages/MarketplacePage';
import SkillDetailPage from '../pages/SkillDetailPage';
import BookingsPage from '../pages/BookingsPage';
import WalletPage from '../pages/WalletPage';
import ChatPage from '../pages/ChatPage';
import MeetingPage from '../pages/MeetingPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import NotificationsPage from '../pages/NotificationsPage';
import ComplaintPage from '../pages/ComplaintPage';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Hero Section */}
                        <div className="relative overflow-hidden min-h-[calc(100vh-64px)]">
                            {/* Background Image & Overlay */}
                            <motion.div
                                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url('/hero-bg-v2.png')` }}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1.05 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/95 backdrop-blur-[1px]"></div>
                            </motion.div>

                            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full px-6 md:px-12 text-center relative z-10">
                                <div className="w-full max-w-5xl space-y-8 py-16">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-purple-200 text-primary-600 text-[10px] font-bold tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-shadow duration-300"
                                    >
                                        <span>Revolutionizing Campus Learning</span>
                                    </motion.div>

                                    <motion.h1
                                        className="flex flex-col items-center font-black tracking-tight text-gray-900 leading-[1.1] drop-shadow-sm"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <span className="text-5xl md:text-7xl">Master New Skills with</span>
                                        <span className="text-5xl md:text-7xl text-primary-600 animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-purple-500 to-primary-600 bg-[length:200%_auto]">Campus Peers</span>
                                    </motion.h1>

                                    <motion.p
                                        className="text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.6 }}
                                    >
                                        The simplest way to learn and teach within your campus.
                                        Peer-to-peer learning, made premium.
                                    </motion.p>

                                    <motion.div
                                        className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.8 }}
                                    >
                                        <Link
                                            to="/marketplace"
                                            className="inline-flex justify-center items-center py-4 px-10 text-sm font-black text-white rounded-xl bg-primary-600 hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/25 active:scale-95 hover:-translate-y-1 hover:shadow-primary-500/50"
                                        >
                                            Browse Skills
                                        </Link>
                                    </motion.div>

                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <AboutSection />

                        {/* Footer */}
                        <Footer />
                    </motion.div>
                } />


                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/marketplace" element={<PageWrapper><MarketplacePage /></PageWrapper>} />
                <Route path="/skills/:id" element={<PageWrapper><SkillDetailPage /></PageWrapper>} />
                <Route path="/skills/new" element={
                    <SignedIn><PageWrapper><AddSkillPage /></PageWrapper></SignedIn>
                } />
                <Route path="/bookings" element={
                    <SignedIn><PageWrapper><BookingsPage /></PageWrapper></SignedIn>
                } />
                <Route path="/wallet" element={
                    <SignedIn><PageWrapper><WalletPage /></PageWrapper></SignedIn>
                } />
                <Route path="/chat" element={
                    <SignedIn><PageWrapper><ChatPage /></PageWrapper></SignedIn>
                } />
                <Route path="/meeting/:bookingId" element={
                    <SignedIn><PageWrapper><MeetingPage /></PageWrapper></SignedIn>
                } />
                <Route path="/admin" element={
                    <SignedIn><PageWrapper><AdminDashboardPage /></PageWrapper></SignedIn>
                } />
                <Route path="/notifications" element={
                    <SignedIn><PageWrapper><NotificationsPage /></PageWrapper></SignedIn>
                } />
                <Route path="/complaint" element={
                    <SignedIn><PageWrapper><ComplaintPage /></PageWrapper></SignedIn>
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AnimatePresence>
    );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
        >
            {children}
        </motion.div>
    );
};

export default AnimatedRoutes;
