import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Menu, X, BookOpen, MessageSquare, Wallet, GraduationCap, Shield, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { devSyncUser } from '../lib/api';

export default function Navbar() {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    // Removed showNotifications state
    const location = useLocation();

    // Dev: Auto-sync user to DB on load (Fixes webhook issues)
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

        // Optimistic check for the owner
        if (user?.primaryEmailAddress?.emailAddress === 'manojkuna2005@gmail.com') {
            setIsAdmin(true);
        }
    }, [user]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all duration-300"
        >
            <div className="w-full px-6 xl:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo area */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                                <GraduationCap size={20} className="text-white" />
                            </div>
                            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                                SkillShare
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        <NavLink to="/marketplace" label="Find Skills" active={isActive('/marketplace')} />

                        <SignedIn>
                            <NavLink to="/skills/new" label="Share a Skill" active={isActive('/skills/new')} />
                            <div className="h-6 w-px bg-gray-200 mx-2"></div>
                            <IconLink to="/bookings" icon={<BookOpen size={18} />} label="Bookings" active={isActive('/bookings')} />


                            <IconLink to="/notifications" icon={<Bell size={18} />} label="Notifications" active={isActive('/notifications')} />

                            <IconLink to="/wallet" icon={<Wallet size={18} />} label="Wallet" active={isActive('/wallet')} />

                            {isAdmin && (
                                <IconLink to="/admin" icon={<Shield size={18} />} label="Admin Panel" active={isActive('/admin')} />
                            )}

                            <div className="ml-2 pl-2">
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8 border-2 border-primary-100"
                                        }
                                    }}
                                />
                            </div>
                        </SignedIn>

                        <SignedOut>
                            <div className="h-6 w-px bg-gray-200 mx-2"></div>
                            <Link to="/sign-in" className="text-xs font-bold text-gray-700 hover:text-primary-600 px-3 py-2 transition-colors">
                                Log in
                            </Link>
                            <Link to="/sign-up" className="text-xs font-black bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-500/10 transition-all active:scale-95">
                                Sign up
                            </Link>
                        </SignedOut>
                    </div>

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

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 absolute w-full left-0 shadow-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 pt-4 pb-6 space-y-2 flex flex-col">
                        <MobileLink to="/marketplace" onClick={() => setIsOpen(false)}>Find Skills</MobileLink>
                        <SignedIn>
                            <MobileLink to="/skills/new" onClick={() => setIsOpen(false)}>Share a Skill</MobileLink>
                            <MobileLink to="/bookings" onClick={() => setIsOpen(false)}>My Bookings</MobileLink>
                            <MobileLink to="/chat" onClick={() => setIsOpen(false)}>Messages</MobileLink>
                            <MobileLink to="/wallet" onClick={() => setIsOpen(false)}>Wallet</MobileLink>
                            <div className="py-2 flex items-center justify-between">
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

function NavLink({ to, label, active }: { to: string; label: string; active?: boolean }) {
    return (
        <Link
            to={to}
            className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                ${active
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'}
            `}
        >
            {label}
        </Link>
    );
}

function IconLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            to={to}
            title={label}
            className={`
                p-2 rounded-xl transition-all duration-200
                ${active
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'}
            `}
        >
            {icon}
        </Link>
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
