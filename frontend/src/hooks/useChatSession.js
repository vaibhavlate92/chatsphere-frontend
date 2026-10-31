import { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import http, { tokenStore } from '../api/http';

/**
 * One hook = STOMP connection + matchmaking state machine + chat/typing/reaction plumbing.
 * status: 'connecting' | 'searching' | 'connected' | 'ended'
 */
export function useChatSession({ mode, preferred, onSignal }) {
  const api = mode === 'VIDEO' ? '/video' : '/chat';
  const [wsReady, setWsReady] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const matchRef = useRef(null);
  const signalRef = useRef(onSignal);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const retryTimer = useRef(null);
  signalRef.current = onSignal;
  matchRef.current = match;

  const pushReaction = useCallback((emoji) => {
    const id = crypto.randomUUID();
    setReactions((r) => [...r, { id, emoji, x: 20 + Math.random() * 60 }]);
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2600);
  }, []);

  const find = useCallback(async () => {
    setError(''); setMatch(null); setMessages([]); setPartnerTyping(false); setStatus('searching');
    try {
      await http.post(`${api}/start`, preferred ? { preferredGender: preferred } : {});
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not start searching.');
      setStatus('ended');
    }
  }, [api, preferred]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL || '/ws'),
      connectHeaders: { Authorization: `Bearer ${tokenStore.get()}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        const sub = (d, fn) => client.subscribe(d, (m) => fn(JSON.parse(m.body)));
        sub('/user/queue/match', (m) => { setMatch(m); setStatus('connected'); setMessages([]); });
        sub('/user/queue/event', (e) => {
          if (e.type === 'SEARCHING') setStatus('searching');
          if (e.type === 'PARTNER_LEFT') { setMatch(null); setStatus('ended'); }
        });
        sub('/user/queue/signal', (s) => { if (s.roomId === matchRef.current?.roomId || !matchRef.current) signalRef.current?.(s); });
        sub('/user/queue/chat', (c) => {
          setMessages((m) => [...m, { from: 'them', text: c.content, at: c.at }]);
          setUnread((n) => n + 1);
          setPartnerTyping(false);
        });
        sub('/user/queue/typing', () => {
          setPartnerTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setPartnerTyping(false), 3000);
        });
        sub('/user/queue/reaction', (r) => pushReaction(r.emoji));
        setWsReady(true);
      },
      onWebSocketClose: () => setWsReady(false),
      onStompError: () => setError('Realtime connection rejected. Please log in again.'),
    });
    client.activate();
    clientRef.current = client;
    return () => {
      clearTimeout(retryTimer.current);
      http.post(`${api}/disconnect`).catch(() => {});
      client.deactivate();
    };
  }, [api, pushReaction]);

  // start searching once the socket is ready (and again after an automatic reconnect)
  useEffect(() => { if (wsReady) find(); }, [wsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // partner left -> automatically look for the next stranger
  useEffect(() => {
    if (status === 'ended' && !error) {
      retryTimer.current = setTimeout(find, 1500);
      return () => clearTimeout(retryTimer.current);
    }
  }, [status, error, find]);

  const publish = (destination, body) =>
    clientRef.current?.connected && clientRef.current.publish({ destination, body: JSON.stringify(body) });

  const next = useCallback(async () => {
    setError(''); setMatch(null); setMessages([]); setStatus('searching');
    try { await http.post(`${api}/next`, preferred ? { preferredGender: preferred } : {}); }
    catch (e) { setError(e?.response?.data?.message || 'Could not find a new match.'); setStatus('ended'); }
  }, [api, preferred]);

  const leave = useCallback(async () => { try { await http.post(`${api}/disconnect`); } catch { /* ignore */ } setMatch(null); setStatus('ended'); }, [api]);

  return {
    wsReady, status, match, messages, partnerTyping, reactions, unread, error,
    clearUnread: () => setUnread(0),
    find, next, leave,
    sendChat: (text) => {
      const t = text.trim();
      if (!t || !matchRef.current) return;
      publish('/app/chat.send', { roomId: matchRef.current.roomId, content: t });
      setMessages((m) => [...m, { from: 'me', text: t, at: new Date().toISOString() }]);
    },
    sendTyping: () => {
      const now = Date.now();
      if (!matchRef.current || now - lastTypingSent.current < 2000) return;
      lastTypingSent.current = now;
      publish('/app/typing', { roomId: matchRef.current.roomId });
    },
    sendReaction: (emoji) => {
      if (!matchRef.current) return;
      publish('/app/reaction', { roomId: matchRef.current.roomId, emoji });
      pushReaction(emoji);
    },
    sendSignal: (type, data) => matchRef.current && publish('/app/signal', { roomId: matchRef.current.roomId, type, data }),
  };
}
