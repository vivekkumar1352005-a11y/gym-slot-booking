import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CardSkeleton, LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import {
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Ticket,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const SessionsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(''); // empty = all upcoming
  const [actionInFlightId, setActionInFlightId] = useState(null);

  // Helper date strings
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const dayAfterStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  // Fetch sessions
  const fetchSessions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.getSessions(selectedDate || undefined);
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Failed to load sessions. Please try again.');
      }
    } finally {
      if (!isSilent) setLoading(false);
      else setRefreshing(false);
    }
  }, [selectedDate]);

  // Initial fetch and when selectedDate changes
  useEffect(() => {
    fetchSessions(false);
  }, [fetchSessions]);

  // PDF Rule: "Seats remaining update while the page is open, without a refresh. Polling is fine."
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 6000); // Poll every 6 seconds

    return () => clearInterval(interval);
  }, [fetchSessions]);

  // PDF Rule: "Booking feels instant: the seat count updates straight away and rolls back if the server refuses."
  const handleBook = async (session) => {
    if (actionInFlightId) return;

    // Snapshot previous state for rollback
    const previousSessions = [...sessions];
    setActionInFlightId(session._id);

    // Optimistic UI Update: immediately decrement seat count and mark as booked
    setSessions((prev) =>
      prev.map((s) => {
        if (s._id === session._id) {
          const newBookedCount = s.bookedCount + 1;
          return {
            ...s,
            bookedCount: newBookedCount,
            seatsRemaining: Math.max(0, s.capacity - newBookedCount),
            isBookedByMe: true,
            isWaitlistedByMe: false,
          };
        }
        return s;
      })
    );

    try {
      const res = await api.bookSession(session._id);
      success(`Spot reserved! Check-in code: ${res.booking?.checkInCode}`);
      // Refresh to ensure exact server state
      fetchSessions(true);
    } catch (err) {
      // Rollback to previous state on failure
      setSessions(previousSessions);
      toastError(`Booking rejected: ${err.message}`);
    } finally {
      setActionInFlightId(null);
    }
  };

  // Join waitlist for full session
  const handleJoinWaitlist = async (session) => {
    if (actionInFlightId) return;
    setActionInFlightId(session._id);

    try {
      const res = await api.joinWaitlist(session._id);
      success(`Added to waitlist at position #${res.position}! You'll be booked automatically if someone cancels.`);
      fetchSessions(true);
    } catch (err) {
      toastError(err.message || 'Could not join waitlist');
    } finally {
      setActionInFlightId(null);
    }
  };

  // Leave waitlist
  const handleLeaveWaitlist = async (session) => {
    if (actionInFlightId || !session.myWaitlistId) return;
    setActionInFlightId(session._id);

    try {
      await api.leaveWaitlist(session.myWaitlistId);
      info('Removed from waitlist.');
      fetchSessions(true);
    } catch (err) {
      toastError(err.message || 'Failed to leave waitlist');
    } finally {
      setActionInFlightId(null);
    }
  };

  // Format hour range display (e.g. "10:00 - 11:00 AM")
  const formatTimeSlot = (startHour) => {
    const endHour = (startHour + 1) % 24;
    const formatH = (h) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:00 ${period}`;
    };
    return `${formatH(startHour)} - ${formatH(endHour)}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Schedule
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  refreshing ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span>Live auto-sync active</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Book Gym Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Each 1-hour session has a strict 20-person capacity. Real-time slot reservations with instant confirmation codes and automated waitlist promotion.
          </p>
        </div>

        {/* Manual Refresh / My Bookings shortcut */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchSessions(false)}
            disabled={loading || refreshing}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors disabled:opacity-50"
            title="Refresh sessions"
            aria-label="Refresh session list"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <Ticket className="w-4 h-4" />
            <span>My Bookings</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Date Filter:
          </span>

          <button
            onClick={() => setSelectedDate('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === ''
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Upcoming
          </button>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === todayStr
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === tomorrowStr
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Tomorrow
          </button>

          <button
            onClick={() => setSelectedDate(dayAfterStr)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === dayAfterStr
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Day After
          </button>
        </div>

        {/* Custom Date Input */}
        <div className="flex items-center gap-2">
          <label htmlFor="custom-date-picker" className="text-xs text-slate-400 font-medium sr-only">
            Specific Date
          </label>
          <div className="relative">
            <input
              id="custom-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Areas: Loading, Error, Empty, or List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="p-6 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-center max-w-lg mx-auto"
        >
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-1">Failed to load sessions</h3>
          <p className="text-sm text-rose-300 mb-4">{error}</p>
          <button
            onClick={() => fetchSessions(false)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Try Again
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No Sessions Scheduled"
          description={
            selectedDate
              ? `There are no sessions scheduled for ${selectedDate}. Try selecting another date.`
              : 'There are currently no sessions scheduled. Check back soon or switch dates.'
          }
          actionText={selectedDate ? 'View All Upcoming' : undefined}
          onAction={selectedDate ? () => setSelectedDate('') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const isFull = session.seatsRemaining === 0;
            const isStarted = new Date(session.startTime) <= new Date();
            const isBooked = session.isBookedByMe;
            const isWaitlisted = session.isWaitlistedByMe;
            const isInFlight = actionInFlightId === session._id;
            const capacityRatio = session.bookedCount / session.capacity;

            return (
              <div
                key={session._id}
                className={`flex flex-col bg-slate-900/80 border rounded-3xl p-6 transition-all duration-200 relative overflow-hidden group ${
                  isBooked
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/40 bg-gradient-to-b from-slate-900 to-emerald-950/20'
                    : isFull
                    ? 'border-rose-900/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateDisplay(session.date)}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight mt-1 group-hover:text-emerald-300 transition-colors">
                      {session.title}
                    </h2>
                  </div>

                  {isBooked ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Booked
                    </span>
                  ) : isWaitlisted ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Waitlist #{session.myWaitlistPosition || 1}
                    </span>
                  ) : isFull ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Full (20/20)
                    </span>
                  ) : (
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {session.seatsRemaining} Left
                    </span>
                  )}
                </div>

                {/* Session Details: Time & Instructor */}
                <div className="space-y-2 py-3 border-y border-slate-800/80 my-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">
                      {formatTimeSlot(session.startHour)}
                    </span>
                    <span className="text-slate-500">(1 hour)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Instructor: <strong className="text-slate-200">{session.instructor}</strong></span>
                  </div>
                </div>

                {/* Seat Capacity Gauge */}
                <div className="my-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Capacity
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {session.bookedCount} / {session.capacity}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-rose-500'
                          : capacityRatio >= 0.75
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (session.bookedCount / session.capacity) * 100)}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-right">
                    {isFull ? (
                      <span className="text-rose-400 font-medium">
                        Waitlist: {session.waitlistCount} {session.waitlistCount === 1 ? 'person' : 'people'}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">
                        {session.seatsRemaining} {session.seatsRemaining === 1 ? 'seat' : 'seats'} available
                      </span>
                    )}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-auto pt-3">
                  {isBooked ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs">
                        <span className="text-emerald-300 font-medium">Check-in code:</span>
                        <span className="font-mono font-bold text-white text-sm bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40">
                          {session.myCheckInCode || 'Confirmed'}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/bookings')}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Booking Pass</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  ) : isWaitlisted ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs">
                        <p className="font-bold flex items-center gap-1">
                          <span>⏱️</span> Waitlist Position #{session.myWaitlistPosition || 1}
                        </p>
                        <p className="text-[11px] text-amber-300/80 mt-0.5">
                          You will be auto-promoted if someone cancels.
                        </p>
                      </div>
                      <button
                        onClick={() => handleLeaveWaitlist(session)}
                        disabled={isInFlight}
                        className="w-full py-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isInFlight ? 'Processing...' : 'Leave Waitlist'}
                      </button>
                    </div>
                  ) : isStarted ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-950 border border-slate-800 text-slate-500 text-xs font-semibold rounded-xl cursor-not-allowed"
                    >
                      Session In Progress / Passed
                    </button>
                  ) : isFull ? (
                    <button
                      onClick={() => handleJoinWaitlist(session)}
                      disabled={isInFlight}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isInFlight ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <span>Join Waitlist Queue</span>
                          <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">
                            {session.waitlistCount} waiting
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBook(session)}
                      disabled={isInFlight}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isInFlight ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Reserving Spot...</span>
                        </>
                      ) : (
                        <>
                          <span>Book Spot Now</span>
                          <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">
                            {session.seatsRemaining} free
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
