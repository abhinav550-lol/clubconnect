import api from './api';
import type { Attendance } from '../types';

interface TicketResponse {
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  qr_token: string;
  qr_image_base64: string;
}

interface ScanCheckInResponse extends Attendance {
  message: string;
}

export const attendanceApi = {
  /** Admin scans a student's QR to mark attendance */
  scanCheckIn: (qr_token: string) =>
    api.post<ScanCheckInResponse>('/attendance/scan-checkin/', { qr_token }),

  /** Get attendance list for an event (admin) */
  forEvent: (eventId: string) =>
    api.get<Attendance[]>(`/attendance/event/${eventId}`),

  /** Get current user's attendance history */
  my: () => api.get<Attendance[]>('/attendance/my/'),
};

export const ticketApi = {
  /** Get student's personal QR ticket for an event */
  getMyTicket: (eventId: string) =>
    api.get<TicketResponse>(`/events/${eventId}/my-ticket/`),
};
