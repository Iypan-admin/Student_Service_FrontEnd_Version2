// liveClassApi.ts - Student Live Classes & Recordings Service
export interface LiveClass {
  id: string;
  batch_id: string;
  course_id?: string;
  tutor_id?: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekit_room_name: string;
  auto_record: boolean;
  actual_start?: string;
  actual_end?: string;
  created_at?: string;
  tutor?: {
    id: string;
    full_name: string;
    email: string;
  };
  batch?: {
    batch_id: string;
    batch_name: string;
  };
  course?: {
    id: string;
    name: string;
    course_name?: string;
  };
}

export interface LiveClassRecording {
  id: string;
  live_class_id: string;
  batch_id: string;
  egress_id?: string;
  file_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  status: 'RECORDING' | 'PROCESSING' | 'READY' | 'FAILED';
  recording_started_at?: string;
  recording_ended_at?: string;
  created_at: string;
  live_class?: {
    title: string;
    tutor?: {
      full_name: string;
    };
  };
}

export interface JoinLiveClassResponse {
  roomName: string;
  livekitUrl: string;
  token: string;
  liveClass: LiveClass;
}

export interface StreamUrlResponse {
  streamUrl: string;
  expiresIn: number;
  fileName: string;
}

// Dynamic endpoint resolution to prevent external devices from failing on localhost
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultAcademicBase = isLocal ? 'http://localhost:3005/api' : 'https://academicservice.iypan.com/api';

const resolveApiUrl = (envUrl: string | undefined, endpoint: string) => {
  if (envUrl && (!envUrl.includes('localhost') || isLocal)) {
    return envUrl;
  }
  return `${defaultAcademicBase}/${endpoint}`;
};

const LIVE_CLASSES_URL = resolveApiUrl(
  import.meta.env.VITE_LIVE_CLASSES_API_URL as string | undefined,
  'live-classes'
);

const RECORDINGS_URL = resolveApiUrl(
  import.meta.env.VITE_RECORDINGS_API_URL as string | undefined,
  'recordings'
);

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const normalizeLiveClass = (item: any): LiveClass => {
  if (!item) return item;
  return {
    ...item,
    id: item.id,
    batch_id: item.batch_id,
    course_id: item.course_id,
    tutor_id: item.teacher_id || item.tutor_id,
    title: item.title,
    description: item.description,
    scheduled_start: item.scheduled_start,
    scheduled_end: item.scheduled_end,
    status: item.status,
    livekit_room_name: item.room_name || item.livekit_room_name,
    auto_record: Boolean(item.recording_enabled || item.auto_record),
    actual_start: item.actual_start,
    actual_end: item.actual_end,
    created_at: item.created_at,
    tutor: item.teachers || item.tutor || (item.teacher_id ? { id: item.teacher_id, full_name: 'Tutor', email: '' } : undefined),
    batch: item.batches || item.batch,
    course: item.courses || item.course
  };
};

const normalizeRecording = (rec: any): LiveClassRecording => {
  if (!rec) return rec;
  const lc = rec.live_classes || rec.live_class || {};
  return {
    id: rec.id,
    live_class_id: rec.live_class_id,
    batch_id: rec.batch_id,
    egress_id: rec.egress_id,
    file_path: rec.storage_object_path || rec.raw_egress_url || rec.file_path,
    duration_seconds: rec.duration_seconds || 0,
    file_size_bytes: rec.file_size_bytes || 0,
    status: rec.status,
    recording_started_at: rec.recording_started_at || rec.created_at,
    recording_ended_at: rec.recording_ended_at,
    created_at: rec.created_at,
    live_class: {
      title: lc.title || 'Recorded Class',
      tutor: lc.teachers || lc.tutor
    }
  };
};

export const getLiveClasses = async (params: Record<string, string> = {}): Promise<LiveClass[]> => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${LIVE_CLASSES_URL}?${query}` : LIVE_CLASSES_URL;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch live classes');
  const raw = await response.json();
  const list = Array.isArray(raw) ? raw : (raw.liveClasses || raw.data || []);
  return list.map(normalizeLiveClass);
};

export const getLiveClassById = async (id: string): Promise<LiveClass> => {
  const response = await fetch(`${LIVE_CLASSES_URL}/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch live class details');
  const raw = await response.json();
  const item = raw.liveClass || raw.data || raw;
  return normalizeLiveClass(item);
};

export const joinLiveClass = async (id: string): Promise<JoinLiveClassResponse> => {
  const response = await fetch(`${LIVE_CLASSES_URL}/${id}/join`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to join live class');
  }
  const data = await response.json();
  return {
    roomName: data.roomName,
    livekitUrl: data.livekitUrl || data.wsUrl || 'wss://livekit.isml.org.in',
    token: data.token,
    liveClass: normalizeLiveClass(data.liveClass)
  };
};

export const getBatchRecordings = async (batchId: string): Promise<LiveClassRecording[]> => {
  const response = await fetch(`${RECORDINGS_URL}/batch/${batchId}`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch batch recordings');
  const raw = await response.json();
  const list = Array.isArray(raw) ? raw : (raw.recordings || raw.data || []);
  return list.map(normalizeRecording);
};

export const getRecordingStreamUrl = async (id: string): Promise<StreamUrlResponse> => {
  const response = await fetch(`${RECORDINGS_URL}/${id}/stream`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to fetch recording playback stream');
  }
  return response.json();
};

export interface JoinStatusResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';
  token?: string;
  wsUrl?: string;
  roomName?: string;
  liveClass?: LiveClass;
  message?: string;
}

export const requestJoinLiveClass = async (id: string): Promise<{ status: string; message: string }> => {
  let bodyPayload: Record<string, any> = {};
  try {
    const rawDetails = localStorage.getItem('studentDetails');
    if (rawDetails) {
      const parsed = JSON.parse(rawDetails);
      if (parsed?.name) bodyPayload.student_name = parsed.name;
      if (parsed?.registration_number) bodyPayload.registration_number = parsed.registration_number;
      if (parsed?.email && !bodyPayload.registration_number) bodyPayload.registration_number = parsed.email;
    }
  } catch (e) {}

  const response = await fetch(`${LIVE_CLASSES_URL}/${id}/request-join`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bodyPayload)
  });
  if (!response.ok) throw new Error('Failed to send join request');
  return response.json();
};

export const getJoinStatus = async (id: string): Promise<JoinStatusResponse> => {
  const response = await fetch(`${LIVE_CLASSES_URL}/${id}/join-status`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to check join status');
  const data = await response.json();
  if (data.liveClass) {
    data.liveClass = normalizeLiveClass(data.liveClass);
  }
  return data;
};
