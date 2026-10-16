import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CardSkeleton, LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../common/Modal';
import {
  ShieldCheck,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Search,
  Check,
  X,
  RotateCw,
  Sparkles,
  UserCheck,
  UserX,
  Info,
} from 'lucide-react';

export const AdminPage = () => {
  const { success, error: toastError, info } = useToast();

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendeeData, setAttendeeData] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Check-in by code state
  const [checkInCode, setCheckInCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkInError, setCheckInError] = useState('');
  const [bypassTimeWindow, setBypassTimeWindow] = useState(false);

  // Create Session modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startHour: 10,
    title: 'Strength & Conditioning',
    instructor: 'Coach Alex',
  });
  const [createFormError, setCreateFormError] = useState('');

  // Fetch all sessions for admin picker
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await api.getSessions(undefined, true);
      if (res.success && res.sessions) {
        setSessions(res.sessions);
        if (res.sessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(res.sessions[0]._id);
        }
      }
    } catch (err) {
      toastError(err.message || 'Failed to load sessions.');
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedSessionId, toastError]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch attendees whenever selected session changes
  const fetchAttendees = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setLoadingAttendees(true);
    try {
      const res = await api.getSessionAttendees(sessionId);
      if (res.success) {
        setAttendeeData(res);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load attendee roster.');
    } finally {
      setLoadingAttendees(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchAttendees(selectedSessionId);
    }
  }, [selectedSessionId, fetchAttendees]);

  // Handle typing code to check-in
  const handleCodeCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;

    setCheckingIn(true);
    setCheckInError('');
    setCheckInResult(null);

    try {
      const res = await api.checkIn(checkInCode.trim(), bypassTimeWindow);
      success(`Checked in ${res.attendee?.name}!`);
      setCheckInResult(res.attendee);
      setCheckInCode('');
      // Refresh current session attendees
      if (selectedSessionId) {
        fetchAttendees(selectedSessionId);
      }
      fetchSessions();
    } catch (err) {
      setCheckInError(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  // Toggle check-in directly from attendee row
  const handleToggleAttendee = async (bookingId) => {
    try {
      const res = await api.toggleCheckIn(bookingId);
      success(res.message);
      if (selectedSessionId) {
        fetchAttendees(selectedSessionId);
      }
    } catch (err) {
      toastError(err.message || 'Failed to update attendance');
    }
  };

  // Handle Create Session submission
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreateFormError('');

    if (!createForm.date) {
      setCreateFormError('Date is required (YYYY-MM-DD).');
      return;
    }

    const hour = parseInt(createForm.startHour, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      setCreateFormError('Start hour must be between 0 and 23.');
      return;
    }

    setCreating(true);

    try {
      const res = await api.createSession({
        date: createForm.date,
        startHour: hour,
        title: createForm.title.trim() || 'Gym Workout Session',
        instructor: createForm.instructor.trim() || 'Gym Staff',
      });

      success('New session created successfully with 20 seats capacity!');
      setCreateModalOpen(false);
      await fetchSessions();
      if (res.session?._id) {
        setSelectedSessionId(res.session._id);
      }
    } catch (err) {
      setCreateFormError(err.message || 'Failed to create session');
    } finally {
      setCreating(false);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Gym Administration Hub
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Admin Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create gym sessions, manage 20-seat rosters, and scan 6-character check-in codes.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateFormError('');
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Session</span>
        </button>
      </div>

      {/* SECTION 1: Check-in Scanner Box (PDF requirement) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">
              Reception Check-in Scanner
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Type the member's 6-character short code (e.g. <strong>7XKP2Q</strong>) to mark them present and see whose booking it is.
          </p>

          <form onSubmit={handleCodeCheckIn} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  id="admin-checkin-code"
                  type="text"
                  required
                  placeholder="Enter 6-char code (e.g. 7XKP2Q)"
                  maxLength={10}
                  value={checkInCode}
                  onChange={(e) => {
                    setCheckInCode(e.target.value.toUpperCase());
                    setCheckInError('');
                  }}
                  disabled={checkingIn}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500 uppercase tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={checkingIn || !checkInCode.trim()}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify & Check-In'
                )}
              </button>
            </div>

            {/* Test demo time bypass option */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <input
                id="bypass-window"
                type="checkbox"
                checked={bypassTimeWindow}
                onChange={(e) => setBypassTimeWindow(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-400 bg-slate-950"
              />
              <label htmlFor="bypass-window" className="cursor-pointer">
                Testing Mode: Bypass 1-hour session window (allows checking in codes for sessions outside current clock hour)
              </label>
            </div>
          </form>

          {/* Check-in Error Alert */}
          {checkInError && (
            <div
              role="alert"
              className="mt-4 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Check-In Denied</p>
                <p className="mt-0.5">{checkInError}</p>
              </div>
            </div>
          )}

          {/* Check-in Success Result Card (PDF requirement: sees whose booking it is) */}
          {checkInResult && (
            <div
              role="status"
              className="mt-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 text-xs animate-in zoom-in-95"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Check-In Verified: Present at Door!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-lg border border-emerald-500/20">
                <div>
                  <span className="text-slate-400">Member Name:</span>{' '}
                  <strong className="text-white text-sm">{checkInResult.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>{' '}
                  <strong className="text-slate-200">{checkInResult.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Session:</span>{' '}
                  <strong className="text-white">{checkInResult.sessionTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Time Checked In:</span>{' '}
                  <strong className="text-emerald-400">
                    {new Date(checkInResult.checkedInAt).toLocaleTimeString()}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Session Roster & Attendance Browser (PDF requirement) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Session Bookings & Attendee Roster</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              View confirmed members (max 20), attendance status, and automated waitlist queue.
            </p>
          </div>

          {/* Session Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="session-picker" className="text-xs text-slate-400 font-semibold sr-only">
              Select Session:
            </label>
            <select
              id="session-picker"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium max-w-xs"
            >
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.date} @ {formatTimeSlot(s.startHour)} — {s.title} ({s.bookedCount}/20)
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchAttendees(selectedSessionId)}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
              title="Refresh roster"
              aria-label="Refresh attendee roster"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Session Metrics */}
        {attendeeData?.session && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Date & Hour
              </span>
              <p className="font-bold text-white text-sm mt-1">
                {attendeeData.session.date}
              </p>
              <p className="text-xs text-slate-400">
                {formatTimeSlot(attendeeData.session.startHour)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Capacity
              </span>
              <p className="font-bold text-white text-sm mt-1">
                20 Max
              </p>
              <p className="text-xs text-slate-400">Fixed Session Limit</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">
                Confirmed Bookings
              </span>
              <p className="font-bold text-emerald-400 text-sm mt-1 font-mono">
                {attendeeData.totalConfirmed} / 20
              </p>
              <p className="text-xs text-slate-400">
                {20 - attendeeData.totalConfirmed} seats remaining
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">
                Waitlist Queue
              </span>
              <p className="font-bold text-amber-400 text-sm mt-1 font-mono">
                {attendeeData.totalWaitlist} Waiting
              </p>
              <p className="text-xs text-slate-400">Auto-promotion enabled</p>
            </div>
          </div>
        )}

        {/* Confirmed Attendees Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Confirmed Attendees ({attendeeData?.bookings?.length || 0})
          </h3>

          {loadingAttendees ? (
            <LoadingSpinner text="Loading attendee list..." />
          ) : !attendeeData?.bookings || attendeeData.bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800 text-xs">
              No confirmed bookings for this session yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Check-In Code</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {attendeeData.bookings.map((b, idx) => (
                    <tr
                      key={b._id}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {b.user?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {b.user?.email || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {b.checkInCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {b.checkedIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Present ({new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Pending Arrival
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleAttendee(b._id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            b.checkedIn
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {b.checkedIn ? 'Mark Absent' : 'Mark Present'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Waitlist Queue Table */}
          {attendeeData?.waitlist && attendeeData.waitlist.length > 0 && (
            <div className="mt-8 space-y-3 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span>⏱️</span> Waitlist Queue ({attendeeData.waitlist.length}) — FIFO Order
              </h3>
              <p className="text-xs text-slate-400">
                These members will automatically receive a confirmed spot and check-in code in order if any confirmed booking is cancelled before session starts.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Queue Pos</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Joined Waitlist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {attendeeData.waitlist.map((wl, idx) => (
                      <tr key={wl._id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {wl.user?.name}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {wl.user?.email}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(wl.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Create Session Modal (PDF requirement) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          if (!creating) setCreateModalOpen(false);
        }}
        title="Schedule New Gym Session"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          {createFormError && (
            <div
              role="alert"
              className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{createFormError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="session-date"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1"
            >
              Date (YYYY-MM-DD)
            </label>
            <input
              id="session-date"
              type="date"
              required
              value={createForm.date}
              onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="session-start-hour"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1"
            >
              Start Hour (0 - 23 on the hour)
            </label>
            <select
              id="session-start-hour"
              required
              value={createForm.startHour}
              onChange={(e) => setCreateForm({ ...createForm, startHour: parseInt(e.target.value, 10) })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              {Array.from({ length: 24 }).map((_, h) => {
                const period = h >= 12 ? 'PM' : 'AM';
                const displayH = h % 12 === 0 ? 12 : h % 12;
                const nextH = (h + 1) % 24;
                const nextPeriod = nextH >= 12 ? 'PM' : 'AM';
                const nextDisplayH = nextH % 12 === 0 ? 12 : nextH % 12;
                return (
                  <option key={h} value={h}>
                    {displayH}:00 {period} to {nextDisplayH}:00 {nextPeriod} (1 hour)
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Sessions last exactly 1 hour. No two sessions can share a start time.
            </p>
          </div>

          <div>
            <label
              htmlFor="session-title"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1"
            >
              Workout Session Name
            </label>
            <input
              id="session-title"
              type="text"
              required
              placeholder="Full Body HIIT"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="session-instructor"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1"
            >
              Instructor / Coach
            </label>
            <input
              id="session-instructor"
              type="text"
              placeholder="Coach Alex"
              value={createForm.instructor}
              onChange={(e) => setCreateForm({ ...createForm, instructor: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <span className="font-bold text-slate-200">Capacity: 20 seats</span> (Hard gym limit enforced by system).
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              disabled={creating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Session...</span>
                </>
              ) : (
                'Create Session'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
