type SidebarPageLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export function SidebarPageLayout({
  sidebar,
  children,
}: SidebarPageLayoutProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-[112rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[clamp(12rem,16vw,15rem)_minmax(0,1fr)] lg:px-8">
      <aside className="min-w-0 border-b border-muted-background pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        {sidebar}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
