import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { z } from "zod";

const sendMessageSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver user ID"),
  content: z.string().min(1, "Message content cannot be empty").max(4000, "Message cannot exceed 4000 characters"),
});

export async function getContacts(req: Request, res: Response): Promise<void> {
  const currentUserId = req.user!.id;

  // Retrieve all other active users in the company
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: currentUserId },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      jobTitle: true,
      profileImage: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      teamMemberships: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // For each user, get the latest message and unread count
  const contactsWithDetails = await Promise.all(
    users.map(async (u) => {
      const lastMessage = await prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: u.id },
            { senderId: u.id, receiverId: currentUserId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderId: u.id,
          receiverId: currentUserId,
          isRead: false,
        },
      });

      return {
        ...u,
        teamName: u.teamMemberships[0]?.team.name || null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isSelf: lastMessage.senderId === currentUserId,
            }
          : null,
        unreadCount,
      };
    })
  );

  // Sort contacts by most recent interaction first, then alphabetical
  contactsWithDetails.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  res.json({
    success: true,
    data: contactsWithDetails,
  });
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.userId;

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      jobTitle: true,
      department: { select: { name: true } },
    },
  });

  if (!targetUser) {
    res.status(404).json({ success: false, error: "NotFound", message: "User not found." });
    return;
  }

  // Fetch messages in chronological order
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  // Mark all unread incoming messages as read
  await prisma.chatMessage.updateMany({
    where: {
      senderId: targetUserId,
      receiverId: currentUserId,
      isRead: false,
    },
    data: { isRead: true },
  });

  res.json({
    success: true,
    data: {
      contact: targetUser,
      messages,
    },
  });
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "ValidationError", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { receiverId, content } = parsed.data;
  const senderId = req.user!.id;

  if (senderId === receiverId) {
    res.status(400).json({ success: false, error: "ValidationError", message: "Cannot send a message to yourself." });
    return;
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver || !receiver.isActive) {
    res.status(404).json({ success: false, error: "NotFound", message: "Recipient does not exist or is inactive." });
    return;
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId,
      receiverId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  // Send an in-app notification to receiver
  const senderUser = await prisma.user.findUnique({ where: { id: senderId } });
  await prisma.notification.create({
    data: {
      recipientId: receiverId,
      senderId,
      eventType: "NEW_CHAT_MESSAGE",
      title: `Message from ${senderUser?.fullName || "a colleague"}`,
      message: content.length > 80 ? content.substring(0, 77) + "..." : content,
      link: `/chat?user=${senderId}`,
    },
  });

  res.status(201).json({
    success: true,
    data: message,
  });
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const currentUserId = req.user!.id;
  const count = await prisma.chatMessage.count({
    where: {
      receiverId: currentUserId,
      isRead: false,
    },
  });

  res.json({
    success: true,
    data: { unreadCount: count },
  });
}
