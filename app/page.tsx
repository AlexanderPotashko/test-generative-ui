import { auth } from "@/auth";
import { getPagesByUserId, createPage } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let pages = await getPagesByUserId(session.user.id);
  if (pages.length === 0) {
    const { pageId } = await createPage(session.user.id, "Overview");
    redirect(`/page/${pageId}`);
  }

  redirect(`/page/${pages[0].id}`);
}
