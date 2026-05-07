import { auth } from "@/auth";
import { getPageById, getChatByPageId, getRecentMessages } from "@/lib/db/queries";
import { PageClientLayout } from "./PageClientLayout";
import { notFound, redirect } from "next/navigation";
import type { PageConfig } from "@/types/page-config";

interface Props {
  params: Promise<{ pageId: string }>;
}

export default async function PageView({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { pageId } = await params;
  const page = await getPageById(pageId);
  if (!page || page.userId !== session.user.id) notFound();

  const chat = await getChatByPageId(pageId);
  const recentMessages = chat ? await getRecentMessages(chat.id, 20) : [];

  const config = page.config as PageConfig;

  const initialMessages = recentMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <PageClientLayout
      pageId={pageId}
      title={page.title}
      config={config}
      initialMessages={initialMessages}
    />
  );
}
