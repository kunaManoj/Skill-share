
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MoreVertical, Settings, Shield } from 'lucide-react';

import SEO from '../components/SEO';
import clsx from 'clsx';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MeetingPage() {
    const { bookingId } = useParams();
    // const { user } = useUser();

    const navigate = useNavigate();

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState('Checking camera...');
    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
                setStatus('Waiting for peer...');
                socketRef.current?.emit('join_video_room', bookingId);
            })
            .catch((err) => {
                console.error("Failed to get media", err);
                setStatus('Camera/Mic access denied');
            });

        socketRef.current.on('user_joined_video', (id: string) => {
            setRemotePeerId(id);
            setStatus('Connecting...');
            initiateCall(id);
        });

        socketRef.current.on('call_user', ({ from, signal }) => {
            setRemotePeerId(from);
            setStatus('Incoming connection...');
            answerCall(from, signal);
        });

        socketRef.current.on('call_accepted', (signal) => {
            setCallAccepted(true);
            setStatus('Connected');
            connectionRef.current?.setRemoteDescription(new RTCSessionDescription(signal));
        });

        socketRef.current.on('ice_candidate', ({ candidate }) => {
            connectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            stream?.getTracks().forEach(track => track.stop());
            connectionRef.current?.close();
            socketRef.current?.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    const createPeerConnection = () => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        peer.onicecandidate = (event) => {
            if (event.candidate && remotePeerId) {
                socketRef.current?.emit('ice_candidate', {
                    to: remotePeerId,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            setStatus('Connected');
        };

        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        return peer;
    };


    const initiateCall = async (id: string) => {
        const peer = createPeerConnection();
        connectionRef.current = peer;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current?.emit('call_user', {
            userToCall: id,
            signalData: offer,
            from: socketRef.current.id
        });
    };

    const answerCall = async (callerId: string, offer: any) => {
        const peer = createPeerConnection();
        connectionRef.current = peer;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        setCallAccepted(true);
        setRemotePeerId(callerId);
        socketRef.current?.emit('answer_call', {
            signal: answer,
            to: callerId
        });
    };

    useEffect(() => {
        if (userVideo.current && remoteStream) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    const leaveCall = () => {
        setCallEnded(true);
        connectionRef.current?.close();
        navigate('/bookings');
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="relative h-screen bg-black text-white overflow-hidden font-sans">
            <SEO title="Live Session" />

            {/* --- Main Video Area (Remote or Placeholder) --- */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                {callAccepted && !callEnded && remoteStream ? (
                    <video
                        playsInline
                        autoPlay
                        ref={userVideo}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-6 opacity-30">
                        <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                            <Users size={48} className="text-zinc-500" />
                        </div>
                        <p className="text-xl font-medium tracking-tight text-zinc-400">{status}</p>
                    </div>
                )}
            </div>

            {/* --- Header / Overlay --- */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto bg-black/20 backdrop-blur-md border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-3">
                    <Shield size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold tracking-wider text-white/90 uppercase border-r border-white/10 pr-3 mr-1">
                        Encrypted
                    </span>
                    <span className="text-xs font-medium text-white/60">
                        {bookingId?.slice(-6).toUpperCase()}
                    </span>
                </div>
            </div>

            {/* --- Self Video (PiP) --- */}
            {stream && (
                <div className={clsx(
                    "absolute top-6 right-6 w-48 aspect-video bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-20 transition-all duration-300",
                    isVideoOff && "bg-zinc-800 flex items-center justify-center"
                )}>
                    <video
                        playsInline
                        muted
                        autoPlay
                        ref={myVideo}
                        className={clsx(
                            "w-full h-full object-cover transform scale-x-[-1]",
                            isVideoOff && "hidden"
                        )}
                    />
                    {isVideoOff && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">YOU</span>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                        <div className={clsx("w-1.5 h-1.5 rounded-full", isMuted ? "bg-red-500" : "bg-emerald-500")} />
                        <span className="text-[9px] font-bold text-white/90 tracking-wider">YOU</span>
                    </div>
                </div>
            )}

            {/* --- Bottom Controls Bar --- */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50">

                    <ControlButton
                        onClick={toggleMute}
                        isActive={isMuted}
                        iconOn={<MicOff size={20} />}
                        iconOff={<Mic size={20} />}
                        activeColor="bg-zinc-700 text-white"
                        inactiveColor="bg-zinc-800 hover:bg-zinc-700 text-white"
                    />

                    <ControlButton
                        onClick={toggleVideo}
                        isActive={isVideoOff}
                        iconOn={<VideoOff size={20} />}
                        iconOff={<Video size={20} />}
                        activeColor="bg-zinc-700 text-white"
                        inactiveColor="bg-zinc-800 hover:bg-zinc-700 text-white"
                    />

                    <div className="w-px h-8 bg-zinc-700 mx-2" />

                    <button
                        onClick={leaveCall}
                        className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-lg shadow-red-900/40 active:scale-95 group"
                    >
                        <PhoneOff size={24} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="w-px h-8 bg-zinc-700 mx-2" />

                    <ControlButton
                        onClick={() => { }}
                        isActive={false}
                        iconOff={<Settings size={20} />}
                        activeColor="bg-zinc-700"
                        inactiveColor="bg-zinc-800 hover:bg-zinc-700 text-white"
                    />
                    <ControlButton
                        onClick={() => { }}
                        isActive={false}
                        iconOff={<MoreVertical size={20} />}
                        activeColor="bg-zinc-700"
                        inactiveColor="bg-zinc-800 hover:bg-zinc-700 text-white"
                    />

                </div>
            </div>
        </div>
    );
}

function ControlButton({ onClick, isActive, iconOn, iconOff, activeColor, inactiveColor }: any) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95",
                isActive ? activeColor : inactiveColor
            )}
        >
            {isActive ? iconOn : iconOff}
        </button>
    );
}
