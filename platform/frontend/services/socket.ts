import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, {
      path: '/socket',
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function joinIssueRoom(issueId: string): void {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join-issue', issueId);
}

export function leaveIssueRoom(issueId: string): void {
  const s = getSocket();
  s.emit('leave-issue', issueId);
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
