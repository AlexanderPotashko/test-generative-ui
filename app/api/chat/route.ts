import { auth } from "@/auth";
import { allTools } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import {
  getChatByPageId,
  getPageById,
  saveMessage,
} from "@/lib/db/queries";
import { google } from "@ai-sdk/google";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, pageId } = await req.json();

  if (!pageId || typeof pageId !== "string") {
    return NextResponse.json({ error: "pageId required" }, { status: 400 });
  }

  const page = await getPageById(pageId);
  if (!page || page.userId !== session.user.id) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const chat = await getChatByPageId(pageId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // Extract and save the last user message (UIMessage format: parts array)
  const lastUserMsg = [...(messages ?? [])].reverse().find(
    (m: { role: string }) => m.role === "user"
  );
  if (lastUserMsg) {
    const textPart = (lastUserMsg.parts ?? []).find(
      (p: { type: string }) => p.type === "text"
    ) as { type: "text"; text: string } | undefined;
    if (textPart?.text) {
      await saveMessage(chat.id, "user", textPart.text);
    }
  }

  // Convert UIMessage[] (v6 format) to ModelMessage[] for streamText
  const modelMessages = await convertToModelMessages(messages ?? [], {
    tools: allTools,
    ignoreIncompleteToolCalls: true,
  });

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: allTools,
    stopWhen: stepCountIs(10),
    onStepFinish: ({ toolCalls, text }) => {
      console.log("[AI step] tools:", toolCalls?.map((t) => t.toolName), "text:", text?.slice(0, 80));
    },
    onFinish: async ({ text, toolCalls }) => {
      console.log("[AI finish] text:", !!text, "toolCalls:", toolCalls?.map(t => t.toolName));
      if (text) {
        await saveMessage(chat.id, "assistant", text);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
