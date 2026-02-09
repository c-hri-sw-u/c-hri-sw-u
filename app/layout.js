import './globals.css';

export const metadata = {
  title: 'Task Manager',
  description: 'Minimal task manager with Kanban board',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
