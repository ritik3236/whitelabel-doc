import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { brand } from '@/lib/shared';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s | ${brand.name}` },
  description: `${brand.company} API documentation`,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
