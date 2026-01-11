import "./globals.css";

export const metadata = {
  title: "Task Scheduler MVP",
  description: "Local LLM Task Scheduler MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
