import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { chatService, ChatContact, ChatMessageItem } from "../services/chat.service";
import { useAuth } from "../context/AuthContext";
import {
  MessageSquare,
  Send,
  Search,
  User as UserIcon,
  CheckCheck,
  Check,
  Clock,
  RefreshCw,
} from "lucide-react";

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get("user");

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch contacts list
  const fetchContacts = async (silent = false) => {
    if (!silent) setLoadingContacts(true);
    try {
      const data = await chatService.getContacts();
      setContacts(data);

      // Auto-select initial user from URL or first contact
      if (!selectedContact) {
        if (initialUserId) {
          const match = data.find((c) => c.id === initialUserId);
          if (match) setSelectedContact(match);
        } else if (data.length > 0) {
          setSelectedContact(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      if (!silent) setLoadingContacts(false);
    }
  };

  // 2. Fetch message history for selected contact
  const fetchMessages = async (contactId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await chatService.getMessages(contactId);
      setMessages(res.messages);
      if (!silent) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchContacts();
  }, [initialUserId]);

  // When selected contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      setSearchParams({ user: selectedContact.id });
    }
  }, [selectedContact?.id]);

  // Polling for live incoming messages every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts(true);
      if (selectedContact) {
        fetchMessages(selectedContact.id, true);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedContact?.id]);

  // Send message handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedContact || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const newMsg = await chatService.sendMessage(selectedContact.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);

      // Refresh contacts to update snippet & order
      fetchContacts(true);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(textToSend); // Restore on error
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department?.name && c.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "TEAM_LEAD":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
      case "EXECUTIVE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Internal Direct Chat
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct, private 1-on-1 messaging across all departments and reporting tiers
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchContacts();
            if (selectedContact) fetchMessages(selectedContact.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Messages"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Chat Body: Contacts Left, Messages Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Contacts Sidebar */}
        <div className="w-80 sm:w-88 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/30">
          {/* Search Contacts */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search colleagues..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loadingContacts ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading colleagues...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No colleagues found</div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-r-2 border-blue-600"
                        : "hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {contact.fullName.charAt(0)}
                      </div>
                      {contact.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-md flex items-center justify-center shadow-xs">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {contact.fullName}
                        </span>
                        {contact.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(contact.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase ${getRoleBadgeColor(
                            contact.role
                          )}`}
                        >
                          {contact.role.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {contact.department?.code || contact.jobTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {contact.lastMessage ? (
                          <>
                            {contact.lastMessage.isSelf && <span className="font-medium text-slate-600 dark:text-slate-300">You: </span>}
                            {contact.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic text-slate-400">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {selectedContact ? (
            <>
              {/* Contact Active Top Bar */}
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/20 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                    {selectedContact.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedContact.fullName}
                      </h2>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase ${getRoleBadgeColor(
                          selectedContact.role
                        )}`}
                      >
                        {selectedContact.role.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {selectedContact.jobTitle} • {selectedContact.department?.name || "Corporate"}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-md bg-emerald-500" />
                    Active on SYNC SPACE
                  </span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/10 dark:bg-slate-950/20">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-md animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start of conversation with {selectedContact.fullName}
                    </h3>
                    <p className="text-xs max-w-sm">
                      Send a message below to coordinate tasks, review blockers, or discuss daily work reports.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] rounded-lg px-4 py-2.5 text-xs shadow-xs ${
                            isSelf
                              ? "bg-blue-600 text-white rounded-br-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs"
                          }`}
                        >
                          {!isSelf && (
                            <div className="font-semibold text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">
                              {msg.sender.fullName}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed select-text font-normal text-xs">
                            {msg.content}
                          </p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                              isSelf ? "text-blue-200" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isSelf && (
                              <span>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-300" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${selectedContact.fullName}... (Press Enter to send)`}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Select a colleague from the left to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
