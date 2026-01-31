import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { getWallet, addFunds, savePayoutDetails, requestWithdrawal } from '../lib/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History, CreditCard, ShieldCheck, Zap, Settings, Landmark, Smartphone, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import SEO from '../components/SEO';
import { toast } from 'sonner';

export default function WalletPage() {
    const { user } = useUser();
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingFunds, setAddingFunds] = useState(false);

    // Withdrawal & Payout State
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    // Payout Form State
    const [payoutType, setPayoutType] = useState<'upi' | 'bank_account'>('upi');
    const [upiId, setUpiId] = useState('');
    const [bankDetails, setBankDetails] = useState({ accountNumber: '', ifsc: '', holderName: '' });
    const [savingPayout, setSavingPayout] = useState(false);

    useEffect(() => {
        if (user) fetchWalletData();
    }, [user]);

    const fetchWalletData = async () => {
        if (!user) return;
        try {
            const data = await getWallet(user.id);
            setWallet(data.wallet);
            setTransactions(data.transactions);

            // Pre-fill payout form
            if (data.wallet.payoutDetails) {
                setPayoutType(data.wallet.payoutDetails.type);
                if (data.wallet.payoutDetails.upiId) setUpiId(data.wallet.payoutDetails.upiId);
                if (data.wallet.payoutDetails.bankAccount) setBankDetails(data.wallet.payoutDetails.bankAccount);
            }
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
            toast.success('Funds added successfully');
        } catch (error) {
            console.error('Failed to add funds', error);
            toast.error('Failed to add funds');
        } finally {
            setAddingFunds(false);
        }
    };

    const handleSavePayoutDetails = async () => {
        if (!user) return;
        setSavingPayout(true);
        try {
            const details = {
                type: payoutType,
                upiId: payoutType === 'upi' ? upiId : undefined,
                bankAccount: payoutType === 'bank_account' ? bankDetails : undefined
            };
            await savePayoutDetails(user.id, details);
            await fetchWalletData();
            setShowPayoutModal(false);
            toast.success('Payout details saved successfully');
        } catch (error) {
            console.error('Failed to save payout details', error);
            toast.error('Failed to save details');
        } finally {
            setSavingPayout(false);
        }
    };

    const handleWithdraw = async () => {
        if (!user || !withdrawAmount) return;
        const amount = parseFloat(withdrawAmount);
        if (amount <= 0 || amount > (wallet?.balance || 0)) {
            toast.error('Invalid amount');
            return;
        }

        setWithdrawLoading(true);
        try {
            await requestWithdrawal(user.id, amount);
            await fetchWalletData();
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            toast.success('Withdrawal request processed');
        } catch (error: any) {
            console.error('Withdrawal failed', error);
            toast.error(error.response?.data?.error || 'Withdrawal failed');
        } finally {
            setWithdrawLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center space-y-4">
            <Zap className="animate-pulse text-primary-600" size={48} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Securing your vault...</p>
        </div>
    );

    const hasPayoutDetails = wallet?.payoutDetails?.upiId || wallet?.payoutDetails?.bankAccount?.accountNumber;

    return (
        <div className="min-h-[calc(100vh-64px)] pb-20 relative">
            <SEO title="My Wallet" description="Manage your UniRent balance and transactions." />

            {/* Header section */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] mb-6 card-shadow">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 section-underline">
                            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                                My <span className="text-primary-600">Wallet</span>
                                <CreditCard className="text-primary-600/20" size={24} />
                            </h1>
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Digital Ledger</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8 pb-10">
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.2
                            }
                        }
                    }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >

                    {/* Left Column: Balance & Controls */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, x: -20 },
                            show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                        className="lg:col-span-1 space-y-4"
                    >
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group border border-primary-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <WalletIcon size={120} />
                            </div>

                            <p className="text-primary-100 font-bold uppercase tracking-widest text-[9px] mb-1">Available Balance</p>
                            <h2 className="text-4xl font-black mb-6 leading-tight">₹ {wallet?.balance?.toLocaleString()}</h2>

                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/90 bg-white/10 w-full px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm mb-6">
                                <ShieldCheck size={14} className="text-white" />
                                <div className="flex flex-col">
                                    <span className="opacity-70 font-medium italic">Pending Clear</span>
                                    <span>₹ {wallet?.frozenBalance?.toLocaleString() || '0'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    className="bg-white text-primary-700 hover:bg-gray-50 py-3 rounded-xl text-xs font-black transition-all shadow-lg w-full flex items-center justify-center gap-2"
                                >
                                    <ArrowUpRight size={14} /> Withdraw
                                </button>
                                <button
                                    onClick={() => handleAddFunds(500)}
                                    disabled={addingFunds}
                                    className="bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black transition-all border border-white/10 w-full"
                                >
                                    {addingFunds ? 'Adding...' : '+ Add Funds'}
                                </button>
                            </div>
                        </div>

                        {/* Payout Method Card */}
                        <div className="bg-[var(--bg-card)] rounded-2xl card-shadow card-glow p-6 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-[10px]">Payout Method</h3>
                                <button
                                    onClick={() => setShowPayoutModal(true)}
                                    className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
                                >
                                    <Settings size={16} />
                                </button>
                            </div>

                            {hasPayoutDetails ? (
                                <div className="flex items-center gap-4 bg-[var(--bg-glass-subtle)] p-4 rounded-xl border border-[var(--border-color)]">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                        {wallet.payoutDetails.type === 'upi' ? <Smartphone size={20} /> : <Landmark size={20} />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-[var(--text-primary)] uppercase">{wallet.payoutDetails.type === 'upi' ? 'UPI Linked' : 'Bank Account'}</p>
                                        <p className="text-[10px] text-[var(--text-secondary)] truncate font-mono">
                                            {wallet.payoutDetails.type === 'upi' ? wallet.payoutDetails.upiId : `***${wallet.payoutDetails.bankAccount.accountNumber.slice(-4)}`}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-[var(--bg-glass-subtle)] rounded-xl border border-dashed border-[var(--border-color)]">
                                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">No payout method linked</p>
                                    <button
                                        onClick={() => setShowPayoutModal(true)}
                                        className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-wide"
                                    >
                                        + Link Method
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Right Column: Transactions */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, x: 20 },
                            show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
                        }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-[var(--bg-card)] rounded-2xl card-shadow card-glow overflow-hidden">
                            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                                <h3 className="font-black text-[var(--text-primary)] text-sm flex items-center gap-2">
                                    <History size={18} className="text-primary-600" />
                                    Activity
                                </h3>
                            </div>

                            <div className="divide-y divide-[var(--border-color)] max-h-[600px] overflow-y-auto">
                                {transactions.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px]">No activity</p>
                                    </div>
                                ) : (
                                    transactions.map((tx) => (
                                        <div key={tx._id} className="p-5 hover:bg-[var(--bg-glass-subtle)] transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                                    tx.type === 'CREDIT' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                )}>
                                                    {tx.type === 'CREDIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[var(--text-primary)] text-sm mb-0.5">{tx.description}</p>
                                                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{format(new Date(tx.createdAt), 'MMM d, p')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={clsx("text-base font-black",
                                                    tx.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                )}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-300 uppercase">{tx.category}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden"
                        >


                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-lg font-black text-[var(--text-primary)]">Withdraw Funds</h3>
                                <button onClick={() => setShowWithdrawModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full p-1 hover:bg-[var(--bg-glass-subtle)]">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg transition-all"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Available to withdraw: ₹{wallet?.balance}</p>
                                </div>

                                {!hasPayoutDetails && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex gap-2">
                                        <ShieldCheck size={16} />
                                        Please link a payout method first.
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleWithdraw}
                                    disabled={withdrawLoading || !withdrawAmount || !hasPayoutDetails}
                                    className="w-full bg-black text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors shadow-lg shadow-gray-900/20"
                                >
                                    {withdrawLoading ? 'Processing...' : 'Confirm Withdrawal'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payout Settings Modal */}
            <AnimatePresence>
                {showPayoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden text-[var(--text-primary)]"
                        >


                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-lg font-black">Payout Details</h3>
                                <button onClick={() => setShowPayoutModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full p-1 hover:bg-[var(--bg-glass-subtle)]">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex p-1 bg-[var(--bg-glass-subtle)] rounded-lg mb-6 relative z-10">
                                <button
                                    className={clsx("flex-1 py-2 rounded-md text-xs font-bold transition-all", payoutType === 'upi' ? "bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)] ring-1 ring-black/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
                                    onClick={() => setPayoutType('upi')}
                                >
                                    UPI ID
                                </button>
                                <button
                                    className={clsx("flex-1 py-2 rounded-md text-xs font-bold transition-all", payoutType === 'bank_account' ? "bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)] ring-1 ring-black/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
                                    onClick={() => setPayoutType('bank_account')}
                                >
                                    Bank Transfer
                                </button>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {payoutType === 'upi' ? (
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1 block">UPI ID / VPA</label>
                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                            placeholder="username@bank"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1 block">Account Number</label>
                                            <input
                                                type="text"
                                                value={bankDetails.accountNumber}
                                                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                                placeholder="000000000000"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1 block">IFSC Code</label>
                                                <input
                                                    type="text"
                                                    value={bankDetails.ifsc}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                                    placeholder="ABCD0001234"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1 block">Holder Name</label>
                                                <input
                                                    type="text"
                                                    value={bankDetails.holderName}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, holderName: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSavePayoutDetails}
                                    disabled={savingPayout}
                                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors mt-4 shadow-lg shadow-gray-900/20"
                                >
                                    {savingPayout ? 'Saving...' : 'Save Details'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


