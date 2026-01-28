import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Menu, X, BookOpen, Wallet, GraduationCap, Shield, Bell, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { devSyncUser } from '../lib/api';
import clsx from 'clsx';

export default function Navbar() {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();

    // Dev: Auto-sync user to DB on load
    useEffect(() => {
        if (user) {
            devSyncUser({
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
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 group relative",
                active
                    ? "text-primary-600 bg-primary-50 font-bold"
                    : "text-gray-500 hover:text-primary-600 hover:bg-gray-50 font-medium"
            )}
        >
            <div className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                {icon}
            </div>
            <span className="text-[10px] tracking-wide">{label}</span>
        </Link>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300">
                                <GraduationCap size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-black tracking-tight text-gray-900">
                                Skill<span className="text-primary-600">Share</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        <SignedIn>
                            <IconLink to="/marketplace" icon={<Shield size={18} />} label="Explore" active={isActive('/marketplace')} />
                            <IconLink to="/skills/new" icon={<Zap size={18} />} label="Share" active={isActive('/skills/new')} />

                            <div className="h-6 w-px bg-gray-200 mx-2"></div>

                            <IconLink to="/bookings" icon={<BookOpen size={18} />} label="Bookings" active={isActive('/bookings')} />
                            <IconLink to="/notifications" icon={<Bell size={18} />} label="Alerts" active={isActive('/notifications')} />
                            <IconLink to="/wallet" icon={<Wallet size={18} />} label="Wallet" active={isActive('/wallet')} />

                            {isAdmin && (
                                <Link to="/admin" className="ml-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-gray-800 transition-colors">
                                    Admin
                                </Link>
                            )}
                        </SignedIn>
                    </div>

                    {/* Auth & Profile */}
                    <div className="flex items-center gap-4">
                        <SignedIn>
                            <div className="ml-1">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8 border-2 border-primary-50"
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
                                <Link to="/sign-up" className="text-xs font-black bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-500/10 transition-all active:scale-95">
                                    Get Started
                                </Link>
                            </div>
                        </SignedOut>

                        {/* Mobile menu button */}
                        <div className="flex items-center gap-3 md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-500 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white/80 backdrop-blur-xl border-t border-white/20 absolute w-full left-0 shadow-xl animate-in slide-in-from-top-2 duration-200">
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
                                    className="flex justify-center items-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/sign-up"
                                    onClick={() => setIsOpen(false)}
                                    className="flex justify-center items-center px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-md transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </SignedOut>
                    </div>
                </div>
            )}
        </nav>
    );
}

function MobileLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
        >
            {children}
        </Link>
    );
}
