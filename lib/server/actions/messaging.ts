"use server";

import { eq, or, and, desc, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { conversations, messages, students, clubs, corporates } from "@/lib/server/db/schema";
import { requirePersona } from "@/lib/server/personas/guard";
import { revalidatePath } from "next/cache";

/**
 * Returns basic profile info (name, role) for a given persona ID by checking all tables.
 */
export async function getPersonaSummary(id: string) {
  const [student] = await db.select({ name: students.fullName }).from(students).where(eq(students.id, id));
  if (student) return { name: student.name, role: "student" as const };

  const [club] = await db.select({ name: clubs.clubName }).from(clubs).where(eq(clubs.id, id));
  if (club) return { name: club.name, role: "club" as const };

  const [corp] = await db.select({ name: corporates.organizationName }).from(corporates).where(eq(corporates.id, id));
  if (corp) return { name: corp.name, role: "corporate" as const };

  return null;
}

export async function getOrCreateConversation(otherPersonaId: string) {
  const current = await requirePersona();
  const currentId = current.row.id;

  const summary = await getPersonaSummary(otherPersonaId);
  if (!summary) throw new Error("Target persona does not exist");
  
  const [p1, p2] = [currentId, otherPersonaId].sort();

  let [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.participant1Id, p1),
        eq(conversations.participant2Id, p2)
      )
    );

  if (!conversation) {
    try {
      [conversation] = await db
        .insert(conversations)
        .values({ participant1Id: p1, participant2Id: p2 })
        .returning();
    } catch (err: unknown) {
      if (err instanceof Error && (err as { code?: string }).code === "23505") { // Unique constraint violation
        [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.participant1Id, p1),
              eq(conversations.participant2Id, p2)
            )
          );
      } else {
        throw err;
      }
    }
  }

  return conversation.id;
}

export async function startConversationAndRedirect(otherPersonaId: string) {
  const { redirect } = await import("next/navigation");
  const id = await getOrCreateConversation(otherPersonaId);
  redirect(`/messages?c=${id}`);
}

export type ConversationItem = {
  id: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantRole: string;
  updatedAt: Date;
  unreadCount: number;
  lastMessage?: string;
};

export async function getConversations(): Promise<ConversationItem[]> {
  const current = await requirePersona();
  const currentId = current.row.id;

  const rows = await db
    .select()
    .from(conversations)
    .where(
      or(
        eq(conversations.participant1Id, currentId),
        eq(conversations.participant2Id, currentId)
      )
    )
    .orderBy(desc(conversations.updatedAt));

  const result: ConversationItem[] = [];
  for (const row of rows) {
    const otherId = row.participant1Id === currentId ? row.participant2Id : row.participant1Id;
    const summary = await getPersonaSummary(otherId);
    
    // Skip if user was deleted
    if (!summary) continue;
    
    // Get unread count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, row.id),
          eq(messages.isRead, false),
          eq(messages.senderId, otherId) // Messages sent by the other person
        )
      );
      
    // Get last message snippet
    const [lastMsg] = await db
      .select({ content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, row.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    result.push({
      id: row.id,
      otherParticipantId: otherId,
      otherParticipantName: summary.name,
      otherParticipantRole: summary.role,
      updatedAt: row.updatedAt,
      unreadCount: count,
      lastMessage: lastMsg?.content,
    });
  }

  return result;
}

export async function getMessages(conversationId: string) {
  const current = await requirePersona();
  const currentId = current.row.id;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation) throw new Error("Conversation not found");
  if (conversation.participant1Id !== currentId && conversation.participant2Id !== currentId) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

export async function sendMessage(conversationId: string, content: string) {
  const parsedContent = z.string().trim().min(1).max(2000).safeParse(content);
  if (!parsedContent.success) throw new Error("Invalid message content");

  const current = await requirePersona();
  const currentId = current.row.id;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation) throw new Error("Conversation not found");
  if (conversation.participant1Id !== currentId && conversation.participant2Id !== currentId) {
    throw new Error("Unauthorized");
  }

  try {
    const [msg] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: currentId,
        content: parsedContent.data,
      })
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    revalidatePath("/messages");
    return msg;
  } catch (err) {
    console.error("Failed to send message:", err);
    throw new Error("Failed to send message");
  }
}

export async function markConversationRead(conversationId: string) {
  const current = await requirePersona();
  const currentId = current.row.id;

  // Mark all messages NOT sent by current user as read
  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        sql`${messages.senderId} != ${currentId}`
      )
    );
    
  revalidatePath("/messages");
}

export async function getGlobalUnreadCount() {
  const current = await requirePersona();
  const currentId = current.row.id;

  const userConversations = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        eq(conversations.participant1Id, currentId),
        eq(conversations.participant2Id, currentId)
      )
    );

  if (userConversations.length === 0) return 0;

  const conversationIds = userConversations.map(c => c.id);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        sql`${messages.conversationId} = ANY(${conversationIds})`,
        eq(messages.isRead, false),
        sql`${messages.senderId} != ${currentId}`
      )
    );

  return count;
}
