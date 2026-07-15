import { LoginRequired } from "@/components/login-required";
import { PageHeader } from "@/components/page-header";
import { getViewerIdentity } from "@/lib/auth/viewer";

export default async function MyStuffLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await getViewerIdentity();

  if (!userId) {
    return (
      <div className="space-y-8">
        <PageHeader
          description="Create decks and keep track of your contributions."
          eyebrow="My stuff"
          title="Your Jingdex library"
        />
        <LoginRequired
          description="Log in to view your decks and contributions."
          nextPath="/my-stuff/decks"
          title="Log in to view My stuff"
        />
      </div>
    );
  }

  return children;
}
