import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import ProductSection from '@/components/sections/ProductSection';
import PricingSection from '@/components/sections/PricingSection';
import RegistrationSection from '@/components/sections/RegistrationSection';

export const metadata = {
  title: 'ReviewAgent — Automate Your Restaurant & Salon Reviews | EU',
  description: 'ReviewAgent helps European restaurant, café and salon owners collect more 5-star reviews automatically. Save time, grow reputation, win more customers. Start free today.',
  keywords: 'review management, restaurant reviews, salon reviews, Google reviews automation, reputation management Europe',
  openGraph: {
    title: 'ReviewAgent — Automate Your Reviews & Grow Your Reputation',
    description: 'The smart review automation tool for European hospitality & beauty businesses. Collect more positive reviews on autopilot.',
    type: 'website',
    locale: 'en_EU',
    url: 'https://reviewagent.ai',
    siteName: 'ReviewAgent',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ReviewAgent — Review Automation for Restaurants & Salons',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewAgent — Automate Your Reviews',
    description: 'Collect more 5-star reviews automatically. Built for European hospitality & beauty businesses.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        overflowX: 'hidden',
      }}
    >
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '-15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '20%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Page content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header />

        <main>
          <HeroSection />
          <ProductSection />
          <PricingSection />
          <RegistrationSection />
        </main>

        <Footer />
      </div>
    </div>
  );
}
