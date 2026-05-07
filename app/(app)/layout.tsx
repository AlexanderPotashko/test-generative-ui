import { auth } from "@/auth";
import { getPagesByUserId, createPage } from "@/lib/db/queries";
import { TabBar } from "@/components/layout/TabBar";
import { AppShellClient } from "./AppShellClient";
import { redirect } from "next/navigation";
import type { PageConfig } from "@/types/page-config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let pages = await getPagesByUserId(session.user.id);
  if (pages.length === 0) {
    const { pageId } = await createPage(session.user.id, "Overview");
    pages = await getPagesByUserId(session.user.id);
  }

  const pageConfigs: PageConfig[] = pages.map((p) => ({
    ...(p.config as PageConfig),
    pageId: p.id,
    title: p.title,
  }));

  return (
    <AppShellClient pages={pageConfigs} userId={session.user.id}>
      {children}
    </AppShellClient>
  );
}
