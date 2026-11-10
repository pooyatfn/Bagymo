/** Shared API response types for the bagymo.ir frontend. */

export type UserRole =
  | "user"
  | "company_admin"
  | "company_hr"
  | "venue_staff"
  | "admin";

export interface User {
  id: number;
  phone_number: string;
  email?: string | null;
  name: string | null;
  role: UserRole;
  gender?: "male" | "female" | null;
  is_verified: boolean;
  remaining_budget: number;
  annual_budget: number;
  wallet_balance?: number;
  sheba?: string | null;
  company?: number | null;
  company_name?: string;
  created_at: string;
}

export interface Category {
  id: number;
  slug: string;
  name_en: string;
  name_fa?: string;
  icon_class: string;
  is_active: boolean;
}

export interface GenderSlot {
  id: number;
  day_of_week: "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
  start_time: string;
  end_time: string;
  gender: "male" | "female" | "mixed";
  is_active: boolean;
}

export interface Offer {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  venue_payout: number;
  duration_minutes: number;
  capacity_per_slot: number;
  gender_restriction: string;
  is_active: boolean;
  venue: number;
  venue_name: string;
}

export interface Venue {
  source?: "manual" | "neshan";
  id: number;
  name: string;
  category: number;
  category_name: string;
  category_slug: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  district?: string | null;
  city: string;
  gender_policy: string;
  gender_for_now?: string;
  gender_slots?: GenderSlot[];
  description?: string | null;
  phone?: string | null;
  owner_name?: string | null;
  offers?: Offer[];
  status: string;
  is_verified: boolean;
  created_at: string;
  avg_rating?: number | null;
  rating_count: number;
}

export interface TimeSlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  remaining: number;
  is_available: boolean;
}

export interface Booking {
  id: number;
  offer_name?: string;
  venue_name?: string;
  price: number;
  status:
    | "reserved"
    | "paid"
    | "checked_in"
    | "checkedin"
    | "completed"
    | "cancelled"
    | "expired";
  reserved_at?: string;
  expires_at?: string;
  checked_in_at?: string | null;
  cancelled_at?: string | null;
  check_in_code?: string | null;
  duration_minutes?: number;
  employee_commission?: number;
  timeslot_date?: string;
  timeslot_start?: string;
  timeslot_end?: string;
  employee_id?: number;
  employee_name?: string;
  employee_phone?: string;
  venue_net_payout?: number;
}

export interface VenueRating {
  id: number;
  venue: number;
  user: number;
  user_name?: string;
  user_phone?: string;
  score: number;
  comment?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  domain?: string | null;
  default_annual_budget: number;
  employee_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CompanyDashboard {
  company_name: string;
  company_status: string;
  user_count: number;
  total_annual_budget: number;
  total_remaining: number;
  total_used: number;
  total_bookings: number;
}

export interface EmployeeRow {
  id: number;
  phone_number: string;
  name?: string | null;
  remaining_budget: number;
  annual_budget?: number;
  usage_pct?: number;
}

export interface CompanyInfo {
  name: string;
  employee_count: number;
  default_annual_budget: number;
  is_active: boolean;
  created_at: string;
  domain?: string | null;
}

export interface VenueProfile {
  name: string;
  category: number;
  category_slug?: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  district?: string | null;
  city: string;
  phone?: string | null;
  gender_policy: string;
  description?: string | null;
}

export interface Settlement {
  id: number;
  period_start: string;
  period_end: string;
  total_count: number;
  total_net_payout: number;
  status: "pending" | "processing" | "paid" | "failed";
  paid_at?: string | null;
}

export interface Invoice {
  id: number;
  period_start: string;
  period_end: string;
  total_toman: number;
  status: "draft" | "pending" | "paid" | "failed";
}

export interface AdminCompany {
  id: number;
  name: string;
  domain?: string | null;
  default_annual_budget: number;
  employee_count: number;
  total_bookings: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
}

export interface TopEmployee {
  employee__name: string;
  employee__phone_number: string;
  bookings: number;
  total_spent: number;
}

export interface VenueBreakdown {
  venue__name: string;
  bookings: number;
  total_spent: number;
}

export interface DailyTrend {
  reserved_at__date: string;
  bookings: number;
  total_spent: number;
}

export interface CompanyAnalytics {
  daily_trend: DailyTrend[];
  total_bookings: number;
  total_spend: number;
  total_commission: number;
  top_employees: TopEmployee[];
  venue_breakdown: VenueBreakdown[];
}

export interface AdminUserDetail {
  user: User;
  bookings: Booking[];
}

export interface PendingCompany {
  id: number;
  name: string;
  domain?: string | null;
  default_annual_budget: number;
  admin_name?: string | null;
  admin_phone?: string | null;
  created_at: string;
}

export interface CheckInResult {
  ok: boolean;
  detail: string;
  status?: string;
}
