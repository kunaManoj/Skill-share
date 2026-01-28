import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { getWallet, addFunds } from '../lib/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import SEO from '../components/SEO';

export default function WalletPage() {
    const { user } = useUser();
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingFunds, setAddingFunds] = useState(false);

    useEffect(() => {
        if (user) fetchWalletData();
    }, [user]);

    const fetchWalletData = async () => {
        if (!user) return;
        try {
            const data = await getWallet(user.id);
            setWallet(data.wallet);
            setTransactions(data.transactions);
        } catch (error) {
            console.error('Failed to load wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFunds = async (amount: number) => {
        if (!user) return;
        setAddingFunds(true);
        try {
            await addFunds(user.id, amount);
            await fetchWalletData();
        } catch (error) {
            console.error('Failed to add funds', error);
        } finally {
            setAddingFunds(false);
        }
    };

    if (loading) return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center space-y-4">
            <Zap className="animate-pulse text-primary-600" size={48} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Securing your vault...</p>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] pb-20">
            <SEO title="My Wallet" description="Manage your UniRent balance and transactions." />

            {/* Header section */}
            <div className="bg-white border-b border-gray-100 mb-6">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
                                My <span className="text-primary-600">Wallet</span>
                                <CreditCard className="text-primary-600/20" size={24} />
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Digital Ledger</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Balance & Controls */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group border border-primary-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <WalletIcon size={120} />
                            </div>

                            <p className="text-primary-100 font-bold uppercase tracking-widest text-[9px] mb-1">Available Balance</p>
                            <h2 className="text-4xl font-black mb-6 leading-tight">₹ {wallet?.balance?.toLocaleString()}</h2>

                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/90 bg-white/10 w-full px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                <ShieldCheck size={14} className="text-white" />
                                <div className="flex flex-col">
                                    <span className="opacity-70 font-medium italic">Pending Clear</span>
                                    <span>₹ {wallet?.frozenBalance?.toLocaleString() || '0'}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-[9px] text-primary-100 font-black uppercase tracking-widest mb-3">Add Funds</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleAddFunds(500)}
                                        disabled={addingFunds}
                                        className="bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black transition-all border border-white/10"
                                    >
                                        + ₹500
                                    </button>
                                    <button
                                        onClick={() => handleAddFunds(2000)}
                                        disabled={addingFunds}
                                        className="bg-white text-primary-700 hover:bg-gray-50 py-3 rounded-xl text-xs font-black transition-all shadow-lg"
                                    >
                                        + ₹2000
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-black text-black mb-4 uppercase tracking-widest text-[10px]">Security</h3>
                            <ul className="space-y-3">
                                <BenefitItem text="Encrypted Ledger" />
                                <BenefitItem text="Escrow Protection" />
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Transactions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-black text-black text-sm flex items-center gap-2">
                                    <History size={18} className="text-primary-600" />
                                    Activity
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {transactions.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No activity</p>
                                    </div>
                                ) : (
                                    transactions.map((tx) => (
                                        <div key={tx._id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                                    tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                                                )}>
                                                    {tx.type === 'CREDIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-black text-sm mb-0.5">{tx.description}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(tx.createdAt), 'MMM d, p')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={clsx("text-base font-black",
                                                    tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-black'
                                                )}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                <ShieldCheck size={16} />
            </div>
            <span className="text-sm font-bold text-gray-600">{text}</span>
        </li>
    );
}
