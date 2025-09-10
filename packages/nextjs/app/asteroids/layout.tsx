export default function AsteroidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {children}
    </div>
  );
}