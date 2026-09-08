import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '@/lib/event-bus';
import { bookingRequestService } from '../services/booking-request.service';
import { BookingRequestItem } from '../types';

export function useBookingRequests() {
  const [requests, setRequests] = useState<BookingRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestItem | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const items = await bookingRequestService.listRequests('pending');
      setRequests(items);
    } catch (err) {
      console.warn('[useBookingRequests] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Periodic polling every 8 seconds
    const interval = setInterval(fetchRequests, 8000);

    // Listen to eventBus for new or updated requests
    const unbindReq = eventBus.on('whatsapp:booking-request', () => {
      fetchRequests();
    });

    const unbindAppt = eventBus.on('appointment:created', () => {
      fetchRequests();
    });

    return () => {
      clearInterval(interval);
      unbindReq();
      unbindAppt();
    };
  }, [fetchRequests]);

  const handleApprove = async (requestId: string, reviewNotes?: string) => {
    try {
      const { request, appointment } = await bookingRequestService.approveRequest(requestId, reviewNotes);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      return { success: true, request, appointment };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Approval failed' };
    }
  };

  const handleReject = async (requestId: string, reviewNotes?: string) => {
    try {
      const rejected = await bookingRequestService.rejectRequest(requestId, reviewNotes);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      return { success: true, request: rejected };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Rejection failed' };
    }
  };

  return {
    requests,
    pendingCount: requests.length,
    loading,
    selectedRequest,
    setSelectedRequest,
    refetch: fetchRequests,
    handleApprove,
    handleReject,
  };
}
