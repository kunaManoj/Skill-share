import api from './api';

export const releaseFunds = async (data: { studentId: string, providerId: string, amount: number, bookingId: string }) => {
    const response = await api.post('/wallet/release-escrow', data);
    return response.data;
};

export const getBooking = async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
};
