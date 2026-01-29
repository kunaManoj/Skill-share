
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useUser } from '@clerk/clerk-react';
import { getBooking, markAttendance } from '../lib/api';
import SEO from '../components/SEO';

export default function MeetingPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();

    // Generate a random ID if user is not loaded (though likely they are protected by auth)
    const userId = user?.id || `user_${Math.floor(Math.random() * 1000)}`;
    const userName = user?.fullName || user?.firstName || `User ${userId}`;

    const myMeeting = (element: HTMLDivElement | null) => {
        if (!element || !bookingId) return;

        const init = async () => {
            try {
                const booking = await getBooking(bookingId);

                // Check if meeting has ended (time expired or status completed)
                const bookingDate = new Date(booking.date);
                const durationMinutes = booking.duration || 60;
                const endTime = bookingDate.getTime() + durationMinutes * 60000;
                const currentTime = Date.now();

                const isExpired = currentTime > endTime;
                const isClosed = ['completed', 'cancelled', 'rejected'].includes(booking.status);

                if (isExpired || isClosed) {
                    if (element) {
                        element.innerHTML = `
                            <div style="height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; background-color: #000; font-family: sans-serif;">
                                <div style="background: #111; padding: 3rem; rounded-xl: 1rem; border: 1px solid #333; border-radius: 16px; text-align: center; max-width: 400px;">
                                    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff;">Meeting Ended</h2>
                                    <p style="color: #888; margin-bottom: 2rem; font-size: 0.9rem; line-height: 1.5;">This session is no longer available as the scheduled time has passed or it has been completed.</p>
                                    <a href="/bookings" style="display: inline-block; padding: 0.75rem 1.5rem; background-color: #fff; color: #000; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; font-weight: 700; transition: opacity 0.2s;">
                                        Return to Bookings
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                    return;
                }

                // Handle populate or id string
                const studentId = typeof booking.studentId === 'object' ? booking.studentId._id : booking.studentId;
                const providerId = typeof booking.providerId === 'object' ? booking.providerId._id : booking.providerId;

                let role: 'student' | 'provider' | null = null;
                if (user?.id === studentId) role = 'student';
                else if (user?.id === providerId) role = 'provider';

                if (role) {
                    await markAttendance(bookingId, role);
                }

                // Credentials from environment variables
                const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
                const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

                if (!appID || !serverSecret) {
                    console.error("ZegoCloud credentials missing. Check your .env file or Vercel Environment Variables.");
                    if (element) {
                        element.innerHTML = `
                            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                                <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Configuration Error</h2>
                                <p>Missing ZegoCloud AppID or ServerSecret.</p>
                                <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">Please add VITE_ZEGO_APP_ID and VITE_ZEGO_SERVER_SECRET to your Vercel Project Settings.</p>
                            </div>
                        `;
                    }
                    return;
                }

                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appID,
                    serverSecret,
                    bookingId,
                    userId,
                    userName
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);

                zp.joinRoom({
                    container: element,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.OneONoneCall, // Or VideoConference for group
                    },
                    showScreenSharingButton: true,
                    onLeaveRoom: () => {
                        navigate('/bookings');
                    },
                });

            } catch (err) {
                console.error('Failed to initialize meeting', err);
            }
        };
        init();
    };

    if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
            <SEO title="Live Meeting" />

            <div
                className="flex-1 w-full h-full"
                ref={myMeeting}
            />
        </div>
    );
}

