const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gym_token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  getMe: () => request('/auth/me'),

  // Sessions
  getSessions: (date, includePast = false) => {
    const params = new URLSearchParams();

    if (date) params.append('date', date);
    if (includePast) params.append('includePast', 'true');

    const query = params.toString();

    return request(`/sessions${query ? `?${query}` : ''}`);
  },

  getSessionById: (id) => request(`/sessions/${id}`),

  createSession: (data) =>
    request('/sessions', {
      method: 'POST',
      body: data,
    }),

  // Bookings
  bookSession: (sessionId) =>
    request('/bookings', {
      method: 'POST',
      body: { sessionId },
    }),

  cancelBooking: (bookingId) =>
    request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    }),

  getMyBookings: () => request('/bookings/my'),

  // Waitlist
  joinWaitlist: (sessionId) =>
    request('/waitlist', {
      method: 'POST',
      body: { sessionId },
    }),

  leaveWaitlist: (waitlistId) =>
    request(`/waitlist/${waitlistId}/leave`, {
      method: 'POST',
    }),

  // Admin
  getSessionAttendees: (sessionId) =>
    request(`/admin/sessions/${sessionId}/attendees`),

  checkIn: (code, bypassTimeWindow = false) =>
    request('/admin/check-in', {
      method: 'POST',
      body: { code, bypassTimeWindow },
    }),

  toggleCheckIn: (bookingId) =>
    request(`/admin/bookings/${bookingId}/toggle-checkin`, {
      method: 'POST',
    }),
};