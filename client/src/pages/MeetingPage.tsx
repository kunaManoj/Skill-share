
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useUser } from '@clerk/clerk-react';
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

