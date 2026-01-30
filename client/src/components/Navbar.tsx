import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Menu, X, BookOpen, Wallet, GraduationCap, Shield, Bell, Zap, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { syncUser } from '../lib/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();

    // Dev: Auto-sync user to DB on load
    useEffect(() => {
        if (user) {
            syncUser({
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl
            }).then((data) => {
                if (data.user && data.user.role === 'admin') {
                    setIsAdmin(true);
                }
            }).catch(err => console.error("Sync failed", err));
        }

        if (user?.primaryEmailAddress?.emailAddress === 'manojkuna2005@gmail.com') {
            setIsAdmin(true);
        }
    }, [user]);

    const isActive = (path: string) => location.pathname === path;

    const IconLink = ({ to, icon, label, active }: any) => (
        <Link
            to={to}
            title={label}
            className={clsx(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 relative group overflow-hidden",
                active ? "text-primary-600 font-bold" : "text-gray-500 hover:text-primary-600 font-medium"
            )}
        >
            {/* Animated Background for Active State */}
            {active && (
                <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary-50 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

            <div className="relative z-10 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 flex flex-col items-center gap-1">
                {icon}
                <span className="text-[10px] tracking-wide">{label}</span>
            </div>
        </Link>
    );

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-3xl border-b border-white/40 shadow-[0_15px_30px_-10px_rgba(79,70,229,0.2)] supports-[backdrop-filter]:bg-white/60 rounded-b-3xl transition-all duration-300"
        >
            {/* 3D Gradient Border/Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center relative">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 group relative">
                            <motion.div
                                whileHover={{ rotate: 15, scale: 1.1 }}
                                className="w-9 h-9 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300"
                            >
                                <GraduationCap size={20} strokeWidth={2.5} />
                            </motion.div>
                            <span className="text-xl font-black tracking-tight text-gray-900 leading-none">
                                Skill<span className="text-primary-600">Share</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <SignedIn>
                            <IconLink to="/marketplace" icon={<Shield size={18} />} label="Explore" active={isActive('/marketplace')} />
                            <IconLink to="/skills/new" icon={<Zap size={18} />} label="Share" active={isActive('/skills/new')} />

                            <div className="h-6 w-px bg-gray-200 mx-3"></div>

                            <IconLink to="/bookings" icon={<BookOpen size={18} />} label="Bookings" active={isActive('/bookings')} />
                            <IconLink to="/notifications" icon={<Bell size={18} />} label="Alerts" active={isActive('/notifications')} />
                            <IconLink to="/wallet" icon={<Wallet size={18} />} label="Wallet" active={isActive('/wallet')} />
                            <IconLink to="/complaint" icon={<AlertTriangle size={18} className="text-red-500" />} label="Report" active={isActive('/complaint')} />

                        </SignedIn>
                    </div>

                    {/* Auth & Profile */}
                    <div className="flex items-center gap-4">
                        <SignedIn>
                            {isAdmin && (
                                <Link to="/admin" className="mr-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:scale-105 active:scale-95">
                                    Admin
                                </Link>
                            )}
                            <div className="ml-1 pl-4 border-l border-gray-100">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-9 h-9 border-[3px] border-primary-100 hover:border-primary-200 transition-colors shadow-sm"
                                        }
                                    }}
                                />
                            </div>
                        </SignedIn>

                        <SignedOut>
                            <div className="hidden md:flex items-center gap-3">
                                <Link to="/sign-in" className="text-xs font-bold text-gray-700 hover:text-primary-600 px-3 py-2 transition-colors">
                                    Log in
                                </Link>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to="/sign-up" className="text-xs font-black bg-gradient-to-r from-primary-600 to-indigo-600 hover:to-primary-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary-500/25 transition-all">
                                        Get Started
                                    </Link>
                                </motion.div>
                            </div>
                        </SignedOut>

                        {/* Mobile menu button */}
                        <div className="flex items-center gap-3 md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-500 p-2 hover:bg-gray-50 rounded-xl transition-colors active:scale-90"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white/90 backdrop-blur-xl border-t border-white/20 absolute w-full left-0 shadow-2xl overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-2 flex flex-col">
                            <MobileLink to="/marketplace" onClick={() => setIsOpen(false)}>Find Skills</MobileLink>
                            <SignedIn>
                                <MobileLink to="/skills/new" onClick={() => setIsOpen(false)}>Share a Skill</MobileLink>
                                <MobileLink to="/bookings" onClick={() => setIsOpen(false)}>My Bookings</MobileLink>
                                <MobileLink to="/notifications" onClick={() => setIsOpen(false)}>Notifications</MobileLink>
                                <MobileLink to="/wallet" onClick={() => setIsOpen(false)}>Wallet</MobileLink>
                                <div className="py-2 flex items-center justify-between border-t border-gray-100 mt-2 pt-4">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</span>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                            <SignedOut>
                                <div className="pt-4 grid grid-cols-2 gap-3">
                                    <Link
                                        to="/sign-in"
                                        onClick={() => setIsOpen(false)}
                                        className="flex justify-center items-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm transition-colors active:scale-95"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to="/sign-up"
                                        onClick={() => setIsOpen(false)}
                                        className="flex justify-center items-center px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-md transition-colors active:scale-95"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            </SignedOut>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

function MobileLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors active:bg-gray-100"
        >
            {children}
        </Link>
    );
}

