export default function Home() {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-background px-8 py-12 text-foreground">
      <div className="text-center">
        <h1 className="font-heading text-5xl font-semibold leading-none sm:text-7xl">
          Welcome to Jingdex.
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-sans text-lg leading-8 text-muted">
          Build flashcards, practice Chinese, and keep your study rhythm steady.
        </p>
      </div>
    </main>
  );
}
