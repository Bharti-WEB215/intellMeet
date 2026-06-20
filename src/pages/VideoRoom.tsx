// VideoRoom.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore.js';
import { GlassCard } from '../components/GlassCard.js';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  Radio, PhoneOff, Users, Sparkles, 
  Send 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../services/socket.js';
import { api } from '../services/api.js';

interface PeerStream {
  socketId: string;
  userId: string;
  name: string;
  avatar: string;
  stream: MediaStream;
  isSpeaking: boolean;
}

export const VideoRoom: React.FC = () => {
  const { 
    isMuted, isVideoOff, isRecording, isScreenSharing, 
    toggleMute, toggleVideo, toggleRecording, toggleScreenShare,
    addNotification, setCurrentView, activeMeetingId, startMeeting, endActiveMeeting
  } = useStore();

  // ---------- Real Screen Share Handler ----------
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing — restore camera track
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }

        // Replace the screen track with camera track in every peer connection
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(cameraTrack);
        });

        setLocalStream(cameraStream);
        socket.emit('screen-share-stopped', { meetingId: activeMeetingId });
      } catch (err) {
        console.error('Failed to restore camera after screen share:', err);
      }
      toggleScreenShare(); // flip store boolean → false + notification
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Replace camera track with screen track in every peer connection
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        // When the user clicks the browser's native "Stop sharing" button
        screenTrack.onended = () => {
          handleToggleScreenShare(); // recursively restore camera
        };

        setLocalStream(screenStream);
        toggleScreenShare(); // flip store boolean → true + notification
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  };

  const [meetingTimer, setMeetingTimer] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState('Workspace General Sync');
  const [liveTranscript, setLiveTranscript] = useState<Array<{ speaker_name: string; text: string }>>([]);
  const [decisionAlert, setDecisionAlert] = useState<string | null>(null);

  // Tab state for Right Panel
  const [activeRightTab, setActiveRightTab] = useState<'transcript' | 'chat'>('transcript');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  // WebRTC & Stream refs
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerStream[]>([]);
  const peerConnections = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socket = getSocket();

  // Create meeting if none is active on load
  useEffect(() => {
    const checkOrCreateMeeting = async () => {
      if (!activeMeetingId) {
        const titleInput = prompt('Enter a meeting topic:', 'AI Interface Specs Review') || 'AI Workspace Sync';
        setMeetingTitle(titleInput);
        await startMeeting(titleInput);
      } else {
        try {
          const mtg = await api.meetings.get(activeMeetingId);
          setMeetingTitle(mtg.title);
          
          // Load existing transcript
          const history = await api.meetings.getTranscript(activeMeetingId);
          setLiveTranscript(history);
        } catch (err) {
          console.error(err);
        }
      }
    };
    checkOrCreateMeeting();
  }, [activeMeetingId, startMeeting]);

  // Run Meeting Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up local webcam/mic media stream
  useEffect(() => {
    let streamRef: MediaStream | null = null;
    
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        streamRef = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Webcam access failed. Operating in mic-only or simulated view.', err);
      }
    };

    initLocalMedia();

    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update track enabled state on mute or video toggles
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
    }
  }, [isVideoOff, localStream]);

  // Coordinate WebRTC Multi-Peer Mesh over Socket.IO
  useEffect(() => {
    if (!localStream || !activeMeetingId) return;

    const roomId = activeMeetingId;
    const userId = `usr-${Math.random().toString(36).substr(2, 9)}`;
    const name = localStorage.getItem('intellmeet_token')?.replace('dev-token-', '').split('@')[0] || 'Julian Carter';
    const avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80';

    // 1. Join room
    socket.emit('join-call', { roomId, userId, name, avatar });

    // 2. Hear when a peer joins the call
    socket.on('peer-joined', async ({ socketId, userId: peerUid, name: peerName, avatar: peerAvatar }) => {
      console.log('New peer joined call:', peerName, socketId);
      
      const pc = createPeerConnection(socketId, peerUid, peerName, peerAvatar);
      peerConnections.current[socketId] = pc;

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('send-signal', {
        to: socketId,
        signal: { type: 'offer', sdp: offer.sdp }
      });
    });

    // 3. Receive signal handshakes
    socket.on('receive-signal', async ({ from, signal }) => {
      let pc = peerConnections.current[from];

      if (signal.type === 'offer') {
        if (!pc) {
          pc = createPeerConnection(from, 'remote-peer', 'Colleague', '');
          peerConnections.current[from] = pc;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('send-signal', {
          to: from,
          signal: { type: 'answer', sdp: answer.sdp }
        });
      } else if (signal.type === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } else if (signal.candidate) {
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    });

    // 4. Peer left call
    socket.on('peer-left', (socketId) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
      setPeers(prev => prev.filter(p => p.socketId !== socketId));
    });

    return () => {
      socket.off('peer-joined');
      socket.off('receive-signal');
      socket.off('peer-left');
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setPeers([]);
    };
  }, [localStream, activeMeetingId]);

  // Create WebRTC Connection
  const createPeerConnection = (socketId: string, peerUid: string, peerName: string, peerAvatar: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local tracks to WebRTC pipe
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // Capture remote track stream
    pc.ontrack = (event) => {
      console.log('ontrack triggered for peer:', peerName);
      setPeers(prev => {
        const exists = prev.find(p => p.socketId === socketId);
        if (exists) return prev;
        return [...prev, {
          socketId,
          userId: peerUid,
          name: peerName,
          avatar: peerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
          stream: event.streams[0],
          isSpeaking: false
        }];
      });
    };

    // Gather ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('send-signal', {
          to: socketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    return pc;
  };

  // Sync Transcription updates from Socket
  useEffect(() => {
    if (!activeMeetingId) return;

    socket.emit('join-room', activeMeetingId);
    
    socket.on('transcript-updated', (data: any) => {
      setLiveTranscript(prev => [...prev, data]);
      
      // Look for decision keywords
      if (data.text.toUpperCase().includes('DECISION:')) {
        const parsed = data.text.replace(/DECISION:/i, '').trim();
        setDecisionAlert(parsed);
        setTimeout(() => setDecisionAlert(null), 6000);
      }
    });

    return () => {
      socket.off('transcript-updated');
    };
  }, [activeMeetingId]);

  // ---------- In-Meeting Chat over Socket.IO ----------
  useEffect(() => {
    if (!activeMeetingId) return;

    const handleIncomingChat = (msg: { sender: string; text: string; time: string }) => {
      setChatMessages(prev => [...prev, msg]);
    };

    socket.on('chat-message', handleIncomingChat);

    return () => {
      socket.off('chat-message', handleIncomingChat);
    };
  }, [activeMeetingId]);

  // Capture Audio slices and push to Whisper API when recording
  useEffect(() => {
    if (!isRecording || !localStream || !activeMeetingId) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(localStream);
      mediaRecorderRef.current = mediaRecorder;
      
      let chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (chunks.length === 0) return;
        
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        chunks = [];

        // Post transcript
        const speaker = localStorage.getItem('intellmeet_token')?.replace('dev-token-', '').split('@')[0] || 'Julian';
        const formattedSpeaker = speaker.charAt(0).toUpperCase() + speaker.slice(1);
        
        try {
          // Send live audio chunk to Whisper pipeline
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.wav');
          formData.append('speaker_name', formattedSpeaker);
          
          const response = await fetch(`http://localhost:5000/api/meetings/${activeMeetingId}/transcript-blob`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('intellmeet_token')}`
            },
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            // Broadcast transcript segment
            socket.emit('new-transcript-segment', {
              roomId: activeMeetingId,
              speaker: formattedSpeaker,
              text: data.text
            });
          }
        } catch (err) {
          // Fallback typing simulation
          const fallbackText = "Analyzing general layout components. DECISION: Finalize design tokens.";
          api.meetings.postTranscript(activeMeetingId, formattedSpeaker, fallbackText);
          socket.emit('new-transcript-segment', {
            roomId: activeMeetingId,
            speaker: formattedSpeaker,
            text: fallbackText
          });
        }

        // Restart recording slice if still active
        if (isRecording && mediaRecorderRef.current) {
          mediaRecorderRef.current.start();
        }
      };

      // Slice audio records every 6 seconds
      mediaRecorder.start();
      const interval = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 6000);

      return () => clearInterval(interval);

    } catch (err) {
      console.warn('MediaRecorder setup failed:', err);
    }
  }, [isRecording, localStream, activeMeetingId]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sender = localStorage.getItem('intellmeet_token')?.replace('dev-token-', '').split('@')[0] || 'Julian';
    const formattedSender = sender.charAt(0).toUpperCase() + sender.slice(1);

    const messagePayload = { sender: formattedSender, text: chatInput, time };

    // Add locally immediately for instant feedback
    setChatMessages(prev => [...prev, messagePayload]);

    // Broadcast to other peers via Socket.IO
    socket.emit('chat-message', {
      meetingId: activeMeetingId,
      sender: formattedSender,
      text: chatInput,
      time,
    });

    setChatInput('');
  };

  // ---------- Leave Meeting Handler ----------
  const handleLeaveMeeting = async () => {
    if (!window.confirm('Do you want to end and save meeting DNA analytics?')) return;

    // Stop all local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Notify other peers
    socket.emit('peer-left', activeMeetingId);

    addNotification('Wrapping up session analysis...', 'success');
    await endActiveMeeting();
    setCurrentView('post-meeting');
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col lg:flex-row gap-6 w-full text-[var(--theme-text)] min-h-[calc(100vh-140px)]"
    >
      
      {/* LEFT: Participant Sidebar Panel */}
      <div className="w-full lg:w-64 flex flex-col space-y-4">
        <GlassCard className="border-[var(--theme-border)] p-4 space-y-4 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-divider)]">
              <h3 className="font-heading text-xs font-bold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Room Peers
              </h3>
              <span className="bg-[var(--theme-surface-alt)] px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[var(--theme-text-secondary)]">
                {peers.length + 1} IN
              </span>
            </div>

            {/* List */}
            <div className="space-y-3">
              {/* Local Peer */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <img className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80" alt="Local User" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">You</h4>
                    <p className="text-[9px] text-[var(--theme-text-muted)]">Presenter</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />}
                </div>
              </div>

              {/* Remote Peers */}
              {peers.map(p => (
                <div key={p.socketId} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      <img className="w-7 h-7 rounded-full object-cover" src={p.avatar} alt={p.name} />
                      {p.isSpeaking && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-[var(--theme-surface)] pulse-ring" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--theme-text)] truncate max-w-[110px]">{p.name}</h4>
                      <p className="text-[9px] text-[var(--theme-text-muted)]">Participant</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats and details */}
          <div className="bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-3 rounded-xl space-y-1">
            <span className="text-[9px] text-[var(--theme-text-muted)] font-mono tracking-wider block">MEETING IDENTITY</span>
            <span className="text-xs font-bold text-[var(--theme-text)] block truncate">{meetingTitle}</span>
            <span className="text-[10px] text-primary font-bold font-mono">Timer: {formatTime(meetingTimer)}</span>
          </div>
        </GlassCard>
      </div>

      {/* CENTER: Video Grid */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Active speaker highlight alert */}
        <AnimatePresence>
          {decisionAlert && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="bg-accent/20 border border-accent/40 rounded-xl p-3.5 text-xs text-accent flex items-center justify-between"
              style={{ boxShadow: 'var(--theme-glow-accent)' }}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4 animate-pulse" />
                DECISION: {decisionAlert}
              </span>
              <span className="text-[9px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded">AI EXTRACTED</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video feed boxes grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[350px]">
          {/* Local Feed */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative rounded-3xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] p-0.5 transition-all duration-300"
            style={{ boxShadow: 'var(--theme-card-shadow)' }}
          >
            <div className="absolute inset-0 bg-[var(--theme-bg)] overflow-hidden flex items-center justify-center">
              {isVideoOff ? (
                <div className="flex flex-col items-center space-y-3">
                  <img className="w-20 h-20 rounded-full object-cover border-4 border-[var(--theme-surface)]" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80" alt="Self" style={{ boxShadow: 'var(--theme-card-shadow-elevated)' }} />
                  <span className="text-[10px] text-[var(--theme-text-muted)] bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] px-2 py-0.5 rounded">Camera Toggled Off</span>
                </div>
              ) : (
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              )}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
                <div className="rounded-lg bg-[var(--theme-input-bg)]/80 backdrop-blur-md border border-[var(--theme-border)] px-2.5 py-1 text-[10px] font-bold">
                  You <span className="text-[var(--theme-text-secondary)] font-normal">(Presenter)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Remote Feeds */}
          {peers.map((p, idx) => (
            <motion.div 
              key={p.socketId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + idx * 0.05 }}
              className={`relative rounded-3xl overflow-hidden border bg-[var(--theme-surface)] p-0.5 transition-all duration-300 ${
                p.isSpeaking ? 'ring-2 ring-primary border-primary' : 'border-[var(--theme-border)]'
              }`}
              style={{ boxShadow: p.isSpeaking ? 'var(--theme-glow-primary)' : 'var(--theme-card-shadow)' }}
            >
              <div className="absolute inset-0 bg-[var(--theme-bg)] overflow-hidden flex items-center justify-center">
                <video 
                  ref={(el) => { if (el) el.srcObject = p.stream; }}
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
                  <div className="rounded-lg bg-[var(--theme-input-bg)]/80 backdrop-blur-md border border-[var(--theme-border)] px-2.5 py-1 text-[10px] font-bold">
                    {p.name} <span className="text-[var(--theme-text-secondary)] font-normal">(Participant)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty Lane */}
          {peers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="border border-dashed border-[var(--theme-divider)] rounded-3xl flex items-center justify-center py-12 text-center text-[10px] text-[var(--theme-text-muted)] font-mono uppercase tracking-wider"
            >
              Waiting for other peers to connect...
            </motion.div>
          )}
        </div>

        {/* BOTTOM: Floating Glass Control Dock */}
        <div className="flex justify-center items-center py-2 relative z-25">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel rounded-2xl px-6 py-3.5 flex items-center justify-between gap-6 border-[var(--theme-border)]"
            style={{ boxShadow: 'var(--theme-card-shadow-elevated)' }}
          >
            {/* Toggle Mic */}
            <button 
              onClick={toggleMute}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isMuted 
                  ? 'bg-red-500/25 border-red-500/40 text-red-500 hover:bg-red-500/35' 
                  : 'bg-[var(--theme-surface-alt)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Toggle Cam */}
            <button 
              onClick={toggleVideo}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isVideoOff 
                  ? 'bg-red-500/25 border-red-500/40 text-red-500 hover:bg-red-500/35' 
                  : 'bg-[var(--theme-surface-alt)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share */}
            <button 
              onClick={handleToggleScreenShare}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isScreenSharing 
                  ? 'bg-secondary/20 border-secondary/40 text-secondary hover:bg-secondary/30' 
                  : 'bg-[var(--theme-surface-alt)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]'
              }`}
            >
              <ScreenShare className="w-5 h-5" />
            </button>

            {/* Record */}
            <button 
              onClick={toggleRecording}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isRecording 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                  : 'bg-[var(--theme-surface-alt)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]'
              }`}
            >
              <Radio className="w-5 h-5" />
            </button>

            {/* Red End Meeting Button */}
            <button 
              onClick={handleLeaveMeeting}
              className="btn-magnetic p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-600/35 transition-all duration-200 cursor-pointer"
              style={{ boxShadow: '0 4px 20px -4px rgba(239, 68, 68, 0.3)' }}
              title="End Meeting & Generate DNA"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

      </div>

      {/* RIGHT: Live Transcribing & Chat Sidebar Panel */}
      <div className="w-full lg:w-72 flex flex-col space-y-4">
        <GlassCard className="border-[var(--theme-border)] p-4 space-y-4 h-full flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* Toggle header tabs */}
            <div className="flex bg-[var(--theme-bg)] p-0.5 rounded-lg border border-[var(--theme-divider)] w-full">
              <button 
                onClick={() => setActiveRightTab('transcript')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md uppercase text-center transition-all duration-200 cursor-pointer ${
                  activeRightTab === 'transcript' ? 'bg-primary/20 text-primary' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
                }`}
              >
                Transcript
              </button>
              <button 
                onClick={() => setActiveRightTab('chat')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md uppercase text-center transition-all duration-200 cursor-pointer ${
                  activeRightTab === 'chat' ? 'bg-primary/20 text-primary' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
                }`}
              >
                Chat Feed
              </button>
            </div>

            {/* Toggle Views */}
            <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 mt-2">
              <AnimatePresence mode="wait">
                
                {activeRightTab === 'transcript' ? (
                  <motion.div 
                    key="transcript-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3.5"
                  >
                    {liveTranscript.map((t, idx) => (
                      <div key={idx} className="space-y-1 bg-[var(--theme-surface-alt)] border border-[var(--theme-divider)] p-2.5 rounded-xl transition-colors duration-200 hover:border-[var(--theme-border-hover)]">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono">{t.speaker_name}</span>
                        <p className="text-xs text-[var(--theme-text)] leading-relaxed font-sans">{t.text}</p>
                      </div>
                    ))}
                    {liveTranscript.length === 0 && (
                      <div className="text-[10px] text-[var(--theme-text-muted)] font-mono italic p-2">Wait or click Record to capture voice transcripts...</div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="chat-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="space-y-1 bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-2 rounded-xl transition-colors duration-200 hover:border-[var(--theme-border-hover)]">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="font-bold text-accent uppercase">{msg.sender}</span>
                          <span className="text-[var(--theme-text-muted)]">{msg.time}</span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-sans leading-normal">{msg.text}</p>
                      </div>
                    ))}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Conditional Input Box for Chat Tab */}
          <div className="space-y-2 pt-2 border-t border-[var(--theme-divider)]">
            {activeRightTab === 'chat' ? (
              <form onSubmit={handleSendChatMessage} className="flex gap-1.5 items-center">
                <input 
                  type="text" 
                  placeholder="Type chat message..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button type="submit" className="btn-magnetic p-1.5 bg-primary rounded-lg text-white cursor-pointer hover:bg-primary/90 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="bg-primary/20 border border-primary/30 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-primary tracking-wider uppercase font-mono block">AI Copilot Analysis</span>
                <p className="text-[11px] text-[var(--theme-text)] leading-normal mt-1">
                  {isRecording ? 'Listening live to voice speech. Stream buffers transcribing via Whisper...' : 'Voice recorder idle. Click Record to stream transcript analysis.'}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

    </motion.div>
  );
};
export default VideoRoom;
