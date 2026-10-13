import { api } from "./api";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetScope: "ALL" | "DEPARTMENT" | "TEAM";
  departmentId: string | null;
  teamId: string | null;
  isPinned: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    role: string;
    jobTitle: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  team: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetScope: "ALL" | "DEPARTMENT" | "TEAM";
  departmentId?: string | null;
  teamId?: string | null;
  isPinned?: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

export const announcementService = {
  getAnnouncements: async (): Promise<AnnouncementItem[]> => {
    const res = await api.get<{ success: boolean; data: AnnouncementItem[] }>("/announcements");
    return res.data;
  },

  createAnnouncement: async (input: CreateAnnouncementInput): Promise<AnnouncementItem> => {
    const res = await api.post<{ success: boolean; data: AnnouncementItem }>("/announcements", input);
    return res.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },

  togglePin: async (id: string): Promise<AnnouncementItem> => {
    const res = await api.patch<{ success: boolean; data: AnnouncementItem }>(`/announcements/${id}/pin`);
    return res.data;
  },
};
