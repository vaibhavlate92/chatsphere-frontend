import { useCallback, useEffect, useRef, useState } from 'react';
import http from '../api/http';

/**
 * Perfect-negotiation-lite: the server marks one peer as `initiator`; only that peer creates the offer.
 * Signals that arrive before the RTCPeerConnection exists are queued, ICE candidates that arrive before
 * the remote description are buffered.
 */
export function useWebRTC({ match, localStream, sendSignal }) {
  const pcRef = useRef(null);
  const queue = useRef([]);
  const pendingIce = useRef([]);
  const iceCfg = useRef(null);
  const sendRef = useRef(sendSignal);
  sendRef.current = sendSignal;
  const [remoteStream, setRemoteStream] = useState(null);
  const [connState, setConnState] = useState('new');

  const flushIce = async (pc) => {
    for (const c of pendingIce.current.splice(0)) { try { await pc.addIceCandidate(c); } catch { /* stale candidate */ } }
  };

  const process = useCallback(async (s) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      if (s.type === 'offer') {
        await pc.setRemoteDescription(s.data);
        await flushIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendRef.current('answer', pc.localDescription);
      } else if (s.type === 'answer') {
        await pc.setRemoteDescription(s.data);
        await flushIce(pc);
      } else if (s.type === 'ice') {
        if (pc.remoteDescription) await pc.addIceCandidate(s.data); else pendingIce.current.push(s.data);
      }
    } catch (e) { console.warn('signal error', e); }
  }, []);

  const handleSignal = useCallback((s) => { if (pcRef.current) process(s); else queue.current.push(s); }, [process]);

  const close = useCallback(() => {
    pcRef.current?.close(); pcRef.current = null;
    pendingIce.current = []; queue.current = [];
    setRemoteStream(null); setConnState('new');
  }, []);

  useEffect(() => {
    if (!match || !localStream) { close(); return; }
    let cancelled = false;
    (async () => {
      if (!iceCfg.current) {
        try { iceCfg.current = (await http.get('/video/ice-config')).data; }
        catch { iceCfg.current = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; }
      }
      if (cancelled) return;
      const pc = new RTCPeerConnection({ iceServers: iceCfg.current.iceServers });
      pcRef.current = pc;
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      pc.onicecandidate = (e) => e.candidate && sendRef.current('ice', e.candidate);
      pc.ontrack = (e) => setRemoteStream(e.streams[0]);
      pc.onconnectionstatechange = async () => {
        setConnState(pc.connectionState);
        if (pc.connectionState === 'failed' && match.initiator) {      // try an ICE restart once
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          sendRef.current('offer', pc.localDescription);
        }
      };
      if (match.initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendRef.current('offer', pc.localDescription);
      }
      for (const s of queue.current.splice(0)) await process(s);
    })();
    return () => { cancelled = true; close(); };
  }, [match?.roomId, localStream]); // eslint-disable-line react-hooks/exhaustive-deps

  const replaceVideoTrack = useCallback(async (track) => {
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(track);
  }, []);

  return { remoteStream, connState, handleSignal, replaceVideoTrack };
}
