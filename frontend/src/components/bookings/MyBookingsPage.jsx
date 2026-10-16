import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CardSkeleton } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import {
  Ticket,
  Calendar,
  Clock,
  User,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react';

export const MyBookingsPage = () => {
  const { success, error: toastError, info } = useToast();

  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState('confirmed'); // 'confirmed' or 'waitlist'

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Leave waitlist state
  const [leavingWaitlistId, setLeavingWaitlistId] = useState(null);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.bookings || []);
        setWaitlists(res.waitlists || []);
      }
    } catch (err) {
      if (!isSilent) {
        toastError(err.message || 'Failed to load bookings.');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Check-in code ${code} copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);

    try {
      const res = await api.cancelBooking(bookingToCancel._id);
      success(
        res.promotedMember
          ? 'Booking cancelled. Your spot was automatically passed to the first waitlisted member!'
          : 'Booking cancelled successfully.'
      );
      setCancelModalOpen(false);
      setBookingToCancel(null);
      fetchData(true);
    } catch (err) {
      toastError(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handleLeaveWaitlist = async (waitlistId) => {
    setLeavingWaitlistId(waitlistId);
    try {
      await api.leaveWaitlist(waitlistId);
      info('Left waitlist queue.');
      fetchData(true);
    } catch (err) {
      toastError(err.message || 'Failed to leave waitlist.');
    } finally {
      setLeavingWaitlistId(null);
    }
  };

  const formatTimeSlot = (startHour) => {
    if (startHour === undefined || startHour === null) return '';
    const endHour = (startHour + 1) % 24;
    const formatH = (h) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:00 ${period}`;
    };
    return `${formatH(startHour)} - ${formatH(endHour)}`;
  };

  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const pastOrCancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Member Portal
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2">
            My Passes & Waitlists
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Present your unique 6-character check-in code at the gym reception desk.
          </p>
        </div>

        <button
          onClick={() => fetchData(false)}
          className="self-start sm:self-auto p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
          title="Refresh"
          aria-label="Refresh bookings"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-8">
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'confirmed'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Active Passes</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-950/20 font-mono">
            {confirmedBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'waitlist'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Clock3 className="w-4 h-4" />
          <span>Waitlist Queue</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-950/20 font-mono">
            {waitlists.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : activeTab === 'confirmed' ? (
        confirmedBookings.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No Active Gym Passes"
            description="You don't have any confirmed bookings yet. Browse the schedule to book your next workout session!"
            actionText="Browse Available Sessions"
            onAction={() => (window.location.href = '/sessions')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {confirmedBookings.map((booking) => {
              const session = booking.session;
              const isStarted = new Date(session.startTime) <= new Date();

              return (
                <div
                  key={booking._id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col relative"
                >
                  {/* Top Ticket Header */}
                  <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          Gym Entry Pass
                        </span>
                        {booking.checkedIn ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Checked In
                          </span>
                        ) : isStarted ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Session Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Confirmed Spot
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        {session?.title || 'Gym Session'}
                      </h2>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400">
                      <QrCode className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="p-6 space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date
                        </span>
                        <span className="font-bold text-white text-sm">
                          {session?.date}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" /> Time Window
                        </span>
                        <span className="font-bold text-white text-sm">
                          {formatTimeSlot(session?.startHour)}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Check-In Code Box */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-emerald-500/30 text-center relative overflow-hidden group">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Show Code at Reception Desk
                      </p>

                      <div className="flex items-center justify-center gap-3 my-1">
                        <span className="font-mono text-3xl font-black text-emerald-400 tracking-widest selection:bg-emerald-400 selection:text-slate-950">
                          {booking.checkInCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(booking.checkInCode)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Copy check-in code"
                          aria-label="Copy check-in code"
                        >
                          {copiedCode === booking.checkInCode ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Works once during session hour • Cannot be guessed
                      </p>
                    </div>

                    {/* Cancellation Button */}
                    <div className="pt-2">
                      {isStarted ? (
                        <p className="text-xs text-slate-500 text-center">
                          Session has started. Cancellations are no longer permitted.
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setBookingToCancel(booking);
                            setCancelModalOpen(true);
                          }}
                          className="w-full py-2.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Booking</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Waitlist Tab */
        waitlists.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="No Waitlist Entries"
            description="You are not currently in any session waitlist queues. If a session is full, you can join its waitlist from the Sessions page."
            actionText="Browse Sessions"
            onAction={() => (window.location.href = '/sessions')}
          />
        ) : (
          <div className="space-y-4 max-w-3xl">
            {waitlists.map((wl) => {
              const session = wl.session;
              const isLeaving = leavingWaitlistId === wl._id;

              return (
                <div
                  key={wl._id}
                  className="p-6 bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <span>⏱️</span> Position #{wl.position} in Queue
                      </span>
                      <span className="text-xs text-slate-400">{session?.date}</span>
                    </div>

                    <h2 className="text-lg font-bold text-white">
                      {session?.title || 'Gym Session'}
                    </h2>

                    <p className="text-xs text-slate-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatTimeSlot(session?.startHour)} (1 hour)</span>
                    </p>

                    <p className="text-xs text-emerald-400/90 font-medium bg-emerald-950/40 border border-emerald-500/20 p-2 rounded-xl">
                      ⚡ Automated promotion: If an attendee cancels, you will automatically receive a confirmed spot and check-in code.
                    </p>
                  </div>

                  <button
                    onClick={() => handleLeaveWaitlist(wl._id)}
                    disabled={isLeaving}
                    className="self-stretch sm:self-auto px-4 py-2 bg-slate-950 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLeaving ? 'Leaving...' : 'Leave Waitlist'}
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          if (!cancelling) {
            setCancelModalOpen(false);
            setBookingToCancel(null);
          }
        }}
        title="Cancel Session Booking"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Are you sure you want to cancel your spot for{' '}
              <strong>{bookingToCancel?.session?.title}</strong>? If someone is on the waitlist, your spot will be immediately and automatically transferred to them.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            You can re-book later only if seats remain available.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                setCancelModalOpen(false);
                setBookingToCancel(null);
              }}
              disabled={cancelling}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {cancelling ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                'Yes, Cancel Booking'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
