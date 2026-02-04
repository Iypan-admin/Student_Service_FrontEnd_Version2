// auth.ts

// ------------------------ AUTH ------------------------
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TokenPayload {
  student_id: string;
  center: string;
  state: string;
  iat: number;
  exp: number;
}

// ------------------------ STUDENT ------------------------
export interface StudentDetails {
  student_id: string;
  created_at: string;
  registration_number: string;
  name: string;
  email: string;
  password: string;
  phone: number;
  status: boolean;
  profile_picture?: string;
  date_of_birth?: string;
  state: {
    state_id: string;
    created_at: string;
    state_name: string;
    state_admin: string;
    academic_coordinator: string;
  };
  center: {
    state: string;
    center_id: string;
    created_at: string;
    center_name: string;
    center_admin: string;
  };
}

// ------------------------ AUTH FORMS ------------------------
export interface RegisterData {
  name: string;
  state: string;
  center: string;
  email: string;
  password: string;
  phone: string;
  is_referred: boolean;
  referred_by_center?: string;
}

export interface LoginData {
  registration_number: string;
  password: string;
}

// ------------------------ STATE & CENTER ------------------------
export interface State {
  state_id: string;
  state_name: string;
}

export interface Center {
  center_id: string;
  center_name: string;
}

// ------------------------ BATCHES & COURSES ------------------------
export interface Batch {
  batch_id: string;
  created_at: string;
  batch_name: string;
  language: string;
  type: string;
  duration: number;
  center: string;
  teacher: string;
  status?: string;
  course_name?: string;
  course_type?: string;
  schedule?: string;
  time_from?: string;
  time_to?: string;
  max_students?: number;
  enrolled_students?: number;
  center_name?: string;
  courses?: Course;
  teachers?: {
    teacher_id: string;
    users: {
      name: string;
      full_name?: string;
    };
  };
  centers?: {
    center_id: string;
    center_name: string;
  };
}

export interface Course {
  course_name: string;
  type: string;
  language: string;
  level: string;
  mode: string;
  program: string;
}

export interface BatchDetails {
  batch_id: string;
  batch_name: string;
  created_at: string;
  duration: string;
  status?: string;
  total_sessions?: number;
  courses: Course;
  centers: {
    center_id: string;
    center_name: string;
  };
  teachers: {
    teacher_id: string;
    users: {
      name: string;
      full_name?: string;
    };
  };
}

// ------------------------ ENROLLMENTS ------------------------
export interface Enrollment {
  enrollment_id: string;
  created_at: string;
  student: string;
  status: boolean;
  end_date: string;
  batches: BatchDetails;
}

export interface EnrolledBatchesResponse {
  enrollments: Enrollment[];
}

// ------------------------ CLASSES ------------------------
export interface ClassMeet {
  meet_id: string;
  created_at: string;
  batch_id: string;
  meet_link: string;
  date: string;
  time: string;
  current: boolean;
  note: string;
  title: string;
  session_number?: number;
  status?: string;
  cancellation_reason?: string;
}

export interface Note {
  notes_id: string;
  created_at: string;
  link: string;
  batch_id: string;
  title: string;
  note: string;
  files?: string[];
}

// ------------------------ PAYMENTS ------------------------
export interface PaymentRequest {
  enrollment_id: string;
  transaction_id: string;
  duration: number;
}

export interface PaymentTransaction {
  payment_id: string;
  created_at: string;
  transaction_id: string;
  duration: number;
  status: boolean; // Admin approval
  enrollment_id: string;
  payment_type: string; // "full" or "emi"
  course_name: string;
  final_fees: number;
  original_fees: number;
  discount_percentage: number;
  course_duration: number;
  current_emi: number | null;
  next_emi_due_date: string | null; // Due date for next EMI installment
  // Optional relation if needed
  enrollment?: {
    enrollment_id: string;
    batch: string;
    student: string;
    status: boolean;
    end_date: string | null;
    created_at: string;
  };
}

export interface TransactionResponse {
  message: string;
  transaction: PaymentTransaction[];
}

export interface TransactionsResponse {
  transactions: PaymentTransaction[];
}

// ------------------------ CHAT ------------------------
export interface ChatMessage {
  id: number;
  text: string;
  batch_id: string;
  sender: string;
  created_at: string;
  sender_name?: string;
  user_id?: string;
  recipient_id?: string | null;
}

export interface SendChatMessageRequest {
  text: string;
  batch_id: string;
  sender: string;
  user_id?: string | null;
  recipient_id?: string | null;
}


