import { db } from "@/lib/db";
import { chats, messages, pages, users } from "@/lib/db/schema";
import type { PageConfig } from "@/types/page-config";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function createUser(
  email: string,
  name: string,
  password: string
) {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ id, email, name, passwordHash });
  return { id, email, name };
}

// ── Pages ──────────────────────────────────────────────────────────────────────

export async function getPagesByUserId(userId: string) {
  return db
    .select()
    .from(pages)
    .where(eq(pages.userId, userId))
    .orderBy(desc(pages.updatedAt));
}

export async function getPageById(pageId: string) {
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  return page ?? null;
}

export async function createPage(userId: string, title = "New Page") {
  const pageId = randomUUID();
  const chatId = randomUUID();

  const config: PageConfig = { pageId, title, widgets: [] };

  await db.insert(pages).values({ id: pageId, userId, title, config });
  await db.insert(chats).values({ id: chatId, pageId, userId });

  return { pageId, chatId };
}

export async function updatePageConfig(
  pageId: string,
  config: PageConfig,
  title?: string
) {
  await db
    .update(pages)
    .set({
      config,
      title: title ?? config.title,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

export async function deletePage(pageId: string) {
  await db.delete(pages).where(eq(pages.id, pageId));
}

// ── Chats & Messages ───────────────────────────────────────────────────────────

export async function getChatByPageId(pageId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.pageId, pageId));
  return chat ?? null;
}

export async function getRecentMessages(chatId: string, limit = 20) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .then((rows) => rows.reverse());
}

export async function saveMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
) {
  await db.insert(messages).values({
    id: randomUUID(),
    chatId,
    role,
    content,
  });
}
