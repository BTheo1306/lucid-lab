import { config } from '../config';

const TIDYCAL_BASE = 'https://tidycal.com/api/v1';

export interface TidyCalBookingType {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  url: string;
  price: number | null;
}

export interface TidyCalTimeSlot {
  /** ISO 8601 timestamp */
  starts_at: string;
  /** ISO 8601 timestamp */
  ends_at: string;
}

export interface TidyCalBooking {
  id: number;
  starts_at: string;
  ends_at: string;
  contact: {
    name: string;
    email: string;
  };
  booking_type_id: number;
  timezone: string;
}

function getHeaders(): Record<string, string> {
  if (!config.tidycalApiKey) {
    throw new Error('TIDYCAL_API_KEY not configured');
  }
  return {
    Authorization: `Bearer ${config.tidycalApiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function tidycalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${TIDYCAL_BASE}${path}`, {
    ...init,
    headers: {
      ...getHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TidyCal API ${res.status}: ${body.slice(0, 500)}`);
  }

  return (await res.json()) as T;
}

/** List all booking types on the account. */
export async function listBookingTypes(): Promise<TidyCalBookingType[]> {
  const data = await tidycalFetch<{ data: TidyCalBookingType[] } | TidyCalBookingType[]>(
    '/booking-types',
  );
  return Array.isArray(data) ? data : data.data;
}

/** List available time slots for a booking type within a window. */
export async function listAvailableTimes(
  bookingTypeId: number | string,
  startsAt: Date,
  endsAt: Date,
): Promise<TidyCalTimeSlot[]> {
  const params = new URLSearchParams({
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  const data = await tidycalFetch<
    { data: TidyCalTimeSlot[] } | TidyCalTimeSlot[]
  >(`/booking-types/${bookingTypeId}/timeslots?${params.toString()}`);

  return Array.isArray(data) ? data : data.data;
}

/**
 * Create a booking. TidyCal will automatically send confirmation emails
 * to both the visitor and the Lucid-Lab team.
 */
export async function createBooking(
  bookingTypeId: number | string,
  input: {
    name: string;
    email: string;
    starts_at: string; // ISO 8601
    timezone?: string;
  },
): Promise<TidyCalBooking> {
  return tidycalFetch<TidyCalBooking>(`/booking-types/${bookingTypeId}/bookings`, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      starts_at: input.starts_at,
      timezone: input.timezone ?? 'Europe/Paris',
    }),
  });
}
