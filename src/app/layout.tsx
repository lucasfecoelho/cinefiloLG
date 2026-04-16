import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider }    from '@/providers/AuthProvider';
import { QueryProvider }   from '@/providers/QueryProvider';
import { ThemeProvider }   from '@/providers/ThemeProvider';
import { MotionProvider }  from '@/providers/MotionProvider';
import { SplashScreen }    from '@/components/ui/SplashScreen';
import { SWRegistrar }     from '@/components/layout/SWRegistrar';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Cinefilos LG',
  description: 'Gerenciador privado de filmes para dois',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cinefilos LG',
  },
  icons: {
    icon:  [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#22C55E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${font.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="h-full font-sans antialiased">
        <MotionProvider>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider>
                <SplashScreen />
                {children}
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </MotionProvider>
        <SWRegistrar />
      </body>
    </html>
  );
}
