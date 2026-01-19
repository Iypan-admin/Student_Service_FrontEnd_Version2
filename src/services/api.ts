// api.ts
import axios from "axios";
import {
  LoginData,
  RegisterData,
  AuthResponse,
  State,
  Center,
  StudentDetails,
  EnrolledBatchesResponse,
  ClassMeet,
  Note,
  BatchDetails,
  PaymentRequest,
  TransactionResponse,
  TransactionsResponse,
  ChatMessage,
  SendChatMessageRequest,
} from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3006/api";

// Axios instance
const API = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ------------------------ AUTH ------------------------
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await API.post("/students/register", data);
  return response.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await API.post("/students/login", data);
  return response.data;
};

// ------------------------ STUDENT / CENTER ------------------------
export const getStates = async (): Promise<State[]> => {
  const response = await API.get("/students/states");
  return response.data;
};

export const getCenters = async (stateId: string): Promise<Center[]> => {
  const response = await API.get(`/students/centers?state_id=${stateId}`);
  return response.data;
};

export const getAllCenters = async (): Promise<Center[]> => {
  const response = await API.get('/students/all-centers');
  return response.data;
};


export const getStudentDetails = async (studentId: string): Promise<StudentDetails> => {
  try {
    const response = await API.post("/students/details", { student_id: studentId });
    return response.data.student;
  } catch (error: any) {
    console.error("Error fetching student details:", error.response?.data || error.message);
    throw error;
  }
};

export const updateStudentProfile = async (token: string, updateData: {
  name?: string;
  email?: string;
  phone?: number;
}): Promise<{ message: string }> => {
  try {
    const response = await API.put("/students/update", updateData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating student profile:", error.response?.data || error.message);
    throw error;
  }
};

// Upload Student Profile Picture
export const uploadStudentProfilePicture = async (token: string, file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/students/upload-profile-picture`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type when using FormData - browser will set it automatically with boundary
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data; // Return the public URL
    }
    throw new Error(response.data.error || "Failed to upload profile picture");
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || "Failed to upload profile picture");
  }
};

// Delete Student Profile Picture
export const deleteStudentProfilePicture = async (token: string): Promise<void> => {
  try {
    const response = await axios.delete(`${API_URL}/students/delete-profile-picture`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to delete profile picture");
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || "Failed to delete profile picture");
  }
};

// ------------------------ BATCHES ------------------------
export const getEnrolledBatches = async (token: string): Promise<EnrolledBatchesResponse> => {
  try {
    const response = await API.get("/batches/enrolled", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching enrolled batches:", error.response?.data || error.message);
    throw error;
  }
};

export const getBatchDetails = async (batchId: string, token: string): Promise<BatchDetails | null> => {
  const response = await getEnrolledBatches(token);
  const enrollment = response.enrollments.find(
    (e) => e.batches.batch_id === batchId
  );
  return enrollment ? enrollment.batches : null;
};

export const getClassMeets = async (batchId: string, token: string): Promise<ClassMeet[]> => {
  try {
    const response = await API.get(`/classes/gmeets/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching class meets:", error.response?.data || error.message);
    throw error;
  }
};

export const getNotes = async (batchId: string, token: string): Promise<Note[]> => {
  try {
    const response = await API.get(`/classes/notes/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching notes:", error.response?.data || error.message);
    throw error;
  }
};

export const getBatches = async (centerId: string, studentId?: string): Promise<any> => {
  try {
    const response = await API.post("/batches/list", { 
      center: centerId,
      student_id: studentId // Pass student_id for smart filtering
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching batches:", error.response?.data || error.message);
    throw error;
  }
};

export const enrollInBatch = async (batchId: string, studentId: string): Promise<any> => {
  const response = await API.post("/batches/enroll", { batch_id: batchId, student_id: studentId });
  return response.data;
};

// ------------------------ PASSWORD ------------------------
export const forgotPassword = async (registration_number: string) => {
  const res = await fetch(`${API_URL}/students/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ registration_number }),
  });
  if (!res.ok) throw new Error("Failed to process forgot password request");
  return res.json();
};

export const resetPassword = async (token: string, newPassword: string) => {
  const res = await fetch(`${API_URL}/students/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) throw new Error("Failed to reset password");
  return res.json();
};

// ------------------------ FEES / PAYMENTS ------------------------
export const fetchCourseFees = async (registrationNumber: string) => {
  const res = await API.get(`/student-course-fees/${registrationNumber}`);
  return res.data;
};

// Fetch course fees by specific enrollment (for multiple enrollments)
export const fetchCourseFeesByEnrollment = async (registrationNumber: string, enrollmentId: string) => {
  const res = await API.get(`/student-course-fees/${registrationNumber}/${enrollmentId}`);
  return res.data;
};


export const fetchPaymentLockStatus = async (registrationNumber: string, enrollmentId?: string) => {
  const url = enrollmentId 
    ? `${API_URL}/payment-lock/${registrationNumber}?enrollment_id=${enrollmentId}`
    : `${API_URL}/payment-lock/${registrationNumber}`;
  const res = await fetch(url);
  return res.json();
};

export const lockPaymentType = async (registrationNumber: string, paymentType: string, enrollmentId?: string) => {
  const res = await fetch(`${API_URL}/payment-lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      register_number: registrationNumber, 
      payment_type: paymentType,
      enrollment_id: enrollmentId 
    }),
  });
  if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
  return res.json();
};

export const postPayment = async (paymentData: PaymentRequest, token: string): Promise<TransactionResponse> => {
  try {
    const response = await API.post("/payments/", paymentData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error submitting payment:", error.response?.data || error.message);
    throw error;
  }
};

export const getTransactions = async (token: string): Promise<TransactionsResponse> => {
  try {
    // Remove trailing slash
    const response = await axios.get(`${API_URL}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Make sure transactions is always an array
    const transactionsData = Array.isArray(response.data.transactions) ? response.data.transactions : [];

    // Normalize status to boolean
    const transactions = transactionsData.map((txn: any) => ({
      ...txn,
      status: txn.status === true || txn.status === "true",
    }));

    return { transactions };
  } catch (error: any) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
    return { transactions: [] }; // fallback to empty array
  }
};


// ------------------------ ELITE CARD ------------------------
export const fetchEliteCard = async (registration_number: string) => {
  try {
    // Use axios to handle errors gracefully (won't log 404 to console)
    const response = await API.get(`/students/elite-card/${registration_number}`);
    return response.data;
  } catch (error: any) {
    // Silently handle all errors - elite card is optional
    // Axios handles 404 gracefully without console errors
    if (error.response?.status === 404) {
      // 404 is expected - elite card may not exist for all students
      return { success: false, data: null };
    }
    // For other errors, also return empty data silently
    return { success: false, data: null };
  }
};

// ------------------------ RAZORPAY ------------------------
export const createRazorpayOrder = async (payload: any) => {
  try {
    const { data } = await API.post("/razorpay/create-order", payload);
    return data;
  } catch (error: any) {
    console.error("API createRazorpayOrder error:", error.response?.data || error.message);
    return { success: false, message: "Failed to create order" };
  }
};

export const verifyPayment = async (paymentData: any) => {
  try {
    const { data } = await API.post("/razorpay/verify", paymentData);
    return data;
  } catch (error: any) {
    console.error("Verify Payment Error:", error.response?.data || error.message);
    return { success: false, message: "Verification failed" };
  }
};

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const { data } = await API.get(`/razorpay/status/${paymentId}`);
    return data;
  } catch (error: any) {
    console.error("Get Payment Status Error:", error.response?.data || error.message);
    return { success: false, message: "Could not fetch status" };
  }
};
// ------------------------ NOTIFICATIONS ------------------------

// Fetch unread notifications
export const getNotifications = async (token: string | null, showAll: boolean = false) => {
  if (!token) {
    console.error("No token provided for fetching notifications.");
    return { success: false, data: [] };
  }

  try {
    const url = showAll ? "/notifications?all=true" : "/notifications";
    const response = await API.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // { success: true, data: [...] }
  } catch (error: any) {
    console.error(
      "Error fetching notifications:",
      error.response?.data || error.message
    );
    return { success: false, data: [] };
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (id: string, token: string | null) => {
  if (!token) {
    console.error("No token provided for marking notification as read.");
    return { success: false };
  }

  try {
    // Use {} instead of null for PATCH data
    const response = await API.patch(`/notifications/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // { success: true, data: [...] }
  } catch (error: any) {
    console.error(
      "Error marking notification as read:",
      error.response?.data || error.message
    );
    return { success: false };
  }
};

// ===========================================
// EVENT CALENDAR API FUNCTIONS
// ===========================================

// Get upcoming events (public access for students)
export const getUpcomingEvents = async (limit: number = 10) => {
  try {
    const response = await API.get(`/events/upcoming?limit=${limit}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error.response?.data || error.message);
    return { success: false, data: [], count: 0 };
  }
};

// Get events by date range (public access for students)
export const getEventsByDateRange = async (startDate: string, endDate: string) => {
  try {
    const response = await API.get(`/events/range?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching events by date range:', error.response?.data || error.message);
    return { success: false, data: [], count: 0 };
  }
};

// Test database connection
export const testEventDatabaseConnection = async () => {
  try {
    const response = await API.get('/events/test/database');
    return response.data;
  } catch (error: any) {
    console.error('Error testing database connection:', error.response?.data || error.message);
    return { success: false };
  }
};

// ===========================================
// ANNOUNCEMENTS API FUNCTIONS
// ===========================================

// Get upcoming events for announcements (public access for students)
export const getUpcomingEventsForAnnouncements = async (limit: number = 10) => {
  try {
    const response = await API.get(`/announcements/upcoming?limit=${limit}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching upcoming events for announcements:', error.response?.data || error.message);
    return { success: false, data: [], count: 0 };
  }
};

// Get events by date range for announcements
export const getEventsByDateRangeForAnnouncements = async (startDate: string, endDate: string) => {
  try {
    const response = await API.get(`/announcements/range?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching events by date range for announcements:', error.response?.data || error.message);
    return { success: false, data: [], count: 0 };
  }
};

// Test database connection for announcements
export const testAnnouncementDatabaseConnection = async () => {
  try {
    const response = await API.get('/announcements/test/database');
    return response.data;
  } catch (error: any) {
    console.error('Error testing database connection for announcements:', error.response?.data || error.message);
    return { success: false };
  }
};

// ===========================================
// LSRW API FUNCTIONS
// ===========================================

// Get LSRW lessons for student
export const getStudentLSRW = async (batchId: string, token: string, moduleType: string = 'listening') => {
  try {
    const response = await API.get(`/lsrw/student/${batchId}?module_type=${moduleType}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching student LSRW:', error.response?.data || error.message);
    throw error;
  }
};

// Submit LSRW quiz answers
export const submitLSRWAnswers = async (
  studentId: string,
  batchId: string,
  lsrwId: string,
  answers: Record<string, string>,
  token: string
) => {
  try {
    const response = await API.post(
      '/lsrw/submit',
      {
        student_id: studentId,
        batch_id: batchId,
        lsrw_id: lsrwId,
        answers,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error submitting LSRW answers:', error.response?.data || error.message);
    throw error;
  }
};

// Get LSRW quiz review data
export const getLSRWReview = async (lsrwId: string, batchId: string, token: string) => {
  try {
    const response = await API.get(`/lsrw/review/${lsrwId}?batchId=${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching LSRW review:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// SPEAKING MODULE API FUNCTIONS
// ===========================================

// Get speaking materials for student
export const getStudentSpeaking = async (batchId: string, token: string) => {
  try {
    const response = await API.get(`/speaking/student/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching student speaking materials:', error.response?.data || error.message);
    throw error;
  }
};

// Upload speaking audio file
export const uploadSpeakingAudio = async (audioBlob: Blob, token: string) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await API.post('/speaking/upload-audio', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading speaking audio:', error.response?.data || error.message);
    throw error;
  }
};

// Save/Submit speaking attempt
export const saveSpeakingAttempt = async (
  speakingMaterialId: string,
  batchId: string,
  audioUrl: string,
  status: 'draft' | 'submitted',
  token: string
) => {
  try {
    const response = await API.post(
      '/speaking/attempt',
      {
        speaking_material_id: speakingMaterialId,
        batch_id: batchId,
        audio_url: audioUrl,
        status,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error saving speaking attempt:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// READING MODULE API FUNCTIONS
// ===========================================

/**
 * Get student reading materials
 * @param batchId - Batch ID
 * @param token - Authentication token
 */
export const getStudentReading = async (batchId: string, token: string) => {
  try {
    const response = await API.get(`/reading/student/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching student reading materials:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit reading quiz attempt
 * @param readingMaterialId - Reading material ID
 * @param batchId - Batch ID
 * @param answers - Object with question keys and answers (e.g., { question1: 'A', question2: 'B', ... })
 * @param token - Authentication token
 */
export const submitReadingAttempt = async (
  readingMaterialId: string,
  batchId: string,
  answers: Record<string, string>,
  token: string
) => {
  try {
    const response = await API.post(
      '/reading/attempt',
      {
        reading_material_id: readingMaterialId,
        batch_id: batchId,
        answers,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error submitting reading attempt:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// WRITING MODULE API FUNCTIONS
// ===========================================

/**
 * Get student writing tasks
 * @param batchId - Batch ID
 * @param token - Authentication token
 */
export const getStudentWriting = async (batchId: string, token: string) => {
  try {
    const response = await API.get(`/writing/student/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching student writing tasks:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// ATTENDANCE API FUNCTIONS
// ===========================================

/**
 * Get student attendance data for a batch
 * @param batchId - Batch ID
 * @param token - Authentication token
 */
export const getStudentAttendance = async (batchId: string, token: string) => {
  try {
    const response = await API.get(`/attendance/student/batch/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching student attendance:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Upload writing submission image
 * @param imageFile - Image file (File object)
 * @param token - Authentication token
 */
export const uploadWritingImage = async (imageFile: File, token: string) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await API.post('/writing/upload-image', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading writing image:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit writing task
 * @param writingTaskId - Writing task ID
 * @param batchId - Batch ID
 * @param imageUrl - URL of uploaded image
 * @param token - Authentication token
 */
export const submitWritingTask = async (
  writingTaskId: string,
  batchId: string,
  imageUrl: string,
  token: string
) => {
  try {
    const response = await API.post(
      '/writing/submit',
      {
        writing_task_id: writingTaskId,
        batch_id: batchId,
        submission_image_url: imageUrl,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error submitting writing task:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// CHAT API FUNCTIONS
// ===========================================

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:3030";

/**
 * Get chat messages for a batch
 * @param batchId - Batch ID
 * @param recipientId - Optional recipient ID for individual chats
 */
export const getChatMessages = async (batchId: string, recipientId?: string | null): Promise<ChatMessage[]> => {
  try {
    const url = recipientId 
      ? `${CHAT_API_URL}/chats/${batchId}?recipient_id=${recipientId}`
      : `${CHAT_API_URL}/chats/${batchId}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching chat messages:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send a chat message
 * @param messageData - Chat message data
 */
export const sendChatMessage = async (messageData: SendChatMessageRequest): Promise<ChatMessage> => {
  try {
    const response = await axios.post(`${CHAT_API_URL}/chats`, messageData);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Error sending chat message:', error.response?.data || error.message);
    throw error;
  }
};


