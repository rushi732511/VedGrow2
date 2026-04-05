import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Prodigy InfoTech — Remote Internship Program',
    template: '%s | Prodigy InfoTech',
  },
  description:
    'Gain real-world tech experience with Prodigy InfoTech remote internships. Verified certificates, hands-on projects, 9 tracks available.',
  keywords: ['internship', 'remote', 'tech', 'certificate', 'India'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}