import { Timestamp } from 'firebase/firestore';

export type UserRole = 'client' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  projectId?: string;
}

export type PhaseStatus = 'pending' | 'in_progress' | 'completed';

export interface PhotoObject {
  url: string;
  caption: string;
  uploadedAt: Timestamp;
}

export interface VideoObject {
  url: string;
  caption: string;
  uploadedAt: Timestamp;
}

export interface Phase {
  id: string;
  name: string;
  status: PhaseStatus;
  completedAt: Timestamp | null;
  photos: PhotoObject[];
  videos: VideoObject[];
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  startDate: Timestamp;
  estimatedEndDate: Timestamp;
  currentPhase: string;
  progressPercent: number;
  whatsappNumber: string;
  cameraStreamUrl: string;
  cameraOnline: boolean;
  phases: Phase[];
}

export interface AppNotification {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  body: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  url: string;
  uploadedAt: Timestamp;
}

// Navigation param lists

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type ClientTabsParamList = {
  Dashboard: undefined;
  Timeline: undefined;
  LiveCamera: undefined;
  Documents: undefined;
  Notifications: undefined;
};

export type ClientStackParamList = {
  ClientTabs: undefined;
  Gallery: { phase: Phase };
  Contact: undefined;
};

export type AdminStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  UpdateProgress: { projectId: string };
  UploadMedia: { projectId: string; phaseId?: string };
  SendNotification: { projectId: string; clientId: string; clientName: string };
  ManageDocuments: { projectId: string };
  NewProject: undefined;
};
