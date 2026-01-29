import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getSkills = async (filters?: { category?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/skills?${params.toString()}`);
    return response.data;
};

export const createSkill = async (skillData: any) => {
    const response = await api.post('/skills', skillData);
    return response.data;
};

// Booking APIs
export const createBooking = async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

export const getBookings = async (userId: string, role: 'student' | 'provider') => {
    const response = await api.get(`/bookings?userId=${userId}&role=${role}`);
    return response.data;
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
    const response = await api.patch(`/bookings/${bookingId}/status`, { status });
    return response.data;
};

export const getBooking = async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
};

export const markAttendance = async (bookingId: string, role: 'student' | 'provider') => {
    const response = await api.patch(`/bookings/${bookingId}/attendance`, { role });
    return response.data;
};

export const sendHeartbeat = async (bookingId: string, role: 'student' | 'provider', durationIncr: number = 1) => {
    const response = await api.patch(`/bookings/${bookingId}/heartbeat`, { role, durationIncr });
    return response.data;
};

// Payment APIs
export const createPaymentOrder = async (amount: number) => {
    const response = await api.post('/payment/create-order', { amount });
    return response.data;
};

export const verifyPayment = async (data: {
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    bookingId: string,
    amount: number
}) => {
    const response = await api.post('/payment/verify-payment', data);
    return response.data;
};

// Escrow Payment APIs (Pre-payment flow)
export const createEscrowOrder = async (amount: number, bookingId: string) => {
    const response = await api.post('/payment/create-escrow-order', { amount, bookingId });
    return response.data;
};

export const verifyEscrowPayment = async (data: {
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    bookingId: string,
    amount: number
}) => {
    const response = await api.post('/payment/verify-escrow-payment', data);
    return response.data;
};

export const releaseEscrow = async (bookingId: string) => {
    const response = await api.post('/payment/release-escrow', { bookingId });
    return response.data;
};

export const refundEscrow = async (bookingId: string, reason?: string) => {
    const response = await api.post('/payment/refund-escrow', { bookingId, reason });
    return response.data;
};

export const claimNoShowRefund = async (bookingId: string) => {
    const response = await api.post('/payment/claim-no-show-refund', { bookingId });
    return response.data;
};

// Wallet APIs
export const getWallet = async (userId: string) => {
    const response = await api.get(`/wallet/${userId}`);
    return response.data;
};

export const addFunds = async (userId: string, amount: number) => {
    const response = await api.post('/wallet/add-funds', { userId, amount });
    return response.data;
};

export const savePayoutDetails = async (userId: string, details: any) => {
    const response = await api.post('/wallet/payout-details', { userId, details });
    return response.data;
};

export const requestWithdrawal = async (userId: string, amount: number) => {
    const response = await api.post('/wallet/withdraw', { userId, amount });
    return response.data;
};

export const releaseFunds = async (data: { studentId: string, providerId: string, amount: number, bookingId: string }) => {
    const response = await api.post('/wallet/release-escrow', data);
    return response.data;
};

// Chat APIs
export const getMessages = async (bookingId: string) => {
    const response = await api.get(`/chat/${bookingId}`);
    return response.data;
};

// Review APIs
export const createReview = async (reviewData: { bookingId: string, rating: number, comment: string }) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
};

export const getReviewsForSkill = async (skillId: string) => {
    const response = await api.get(`/reviews/skill/${skillId}`);
    return response.data;
};

export const getReviewsForUser = async (userId: string) => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
};

// Admin APIs
export const getAdminStats = async (adminId: string) => {
    const response = await api.get('/admin/stats', { headers: { 'x-admin-id': adminId } });
    return response.data;
};

export const getAdminUsers = async (adminId: string) => {
    const response = await api.get('/admin/users', { headers: { 'x-admin-id': adminId } });
    return response.data;
};

export const toggleUserBan = async (adminId: string, userId: string, isBanned: boolean) => {
    const response = await api.post(`/admin/users/${userId}/ban`, { isBanned }, { headers: { 'x-admin-id': adminId } });
    return response.data;
};

export const getAdminSkills = async (adminId: string) => {
    const response = await api.get('/admin/skills', { headers: { 'x-admin-id': adminId } });
    return response.data;
};

export const deleteAdminSkill = async (adminId: string, skillId: string) => {
    const response = await api.delete(`/admin/skills/${skillId}`, { headers: { 'x-admin-id': adminId } });
    return response.data;
};

export const getAdminBookings = async (adminId: string) => {
    const response = await api.get('/admin/bookings', { headers: { 'x-admin-id': adminId } });
    return response.data;
};

export const devMakeAdmin = async (userId: string) => {
    const response = await api.post('/dev/make-admin', { userId });
    return response.data;
};

export const devSyncUser = async (userData: any) => {
    const response = await api.post('/dev/sync-user', userData);
    return response.data;
};

export const deleteSkill = async (skillId: string, userId: string) => {
    const response = await api.delete(`/skills/${skillId}`, { data: { userId } });
    return response.data;
};

export default api;
