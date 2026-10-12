import { api } from "./api";

export interface ChatContact {
  id: string;
  fullName: string;
  email: string;
  role: string;
  jobTitle: string;
  profileImage: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  teamName: string | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isSelf: boolean;
  } | null;
  unreadCount: number;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface ChatThreadResponse {
  contact: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    jobTitle: string;
    department: { name: string } | null;
  };
  messages: ChatMessageItem[];
}

export const chatService = {
  getContacts: async (): Promise<ChatContact[]> => {
    const res = await api.get<{ success: boolean; data: ChatContact[] }>("/chat/contacts");
    return res.data;
  },

  getMessages: async (userId: string): Promise<ChatThreadResponse> => {
    const res = await api.get<{ success: boolean; data: ChatThreadResponse }>(`/chat/messages/${userId}`);
    return res.data;
  },

  sendMessage: async (receiverId: string, content: string): Promise<ChatMessageItem> => {
    const res = await api.post<{ success: boolean; data: ChatMessageItem }>("/chat/messages", {
      receiverId,
      content,
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<{ success: boolean; data: { unreadCount: number } }>("/chat/unread-count");
    return res.data.unreadCount;
  },
};
