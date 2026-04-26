export type PlanId = 'free' | 'pro' | 'business';

export interface PlanFeature {
  label: string;
  included: boolean;
  limit?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  isPopular: boolean;
  ctaLabel: string;
  ctaVariant: 'outline' | 'solid';
  features: PlanFeature[];
  highlightColor: string;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

export interface ComparisonCategory {
  category: string;
  rows: ComparisonRow[];
}

export interface ComparisonRow {
  feature: string;
  tooltip?: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for individuals and small projects getting started with review management.',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    isPopular: false,
    ctaLabel: 'Get Started Free',
    ctaVariant: 'outline',
    highlightColor: 'var(--text-secondary)',
    features: [
      { label: 'Up to 50 reviews/month', included: true, limit: '50' },
      { label: '1 connected platform', included: true, limit: '1' },
      { label: 'Basic sentiment analysis', included: true },
      { label: 'Email notifications', included: true },
      { label: 'CSV export', included: true },
      { label: 'AI-generated responses', included: false },
      { label: 'Custom response templates', included: false },
      { label: 'Team members', included: false },
      { label: 'Priority support', included: false },
      { label: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses that need powerful automation and deeper insights.',
    monthlyPrice: 49,
    annualPrice: 39,
    currency: 'USD',
    isPopular: true,
    ctaLabel: 'Start Pro Trial',
    ctaVariant: 'solid',
    highlightColor: 'var(--accent)',
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    features: [
      { label: 'Up to 1,000 reviews/month', included: true, limit: '1000' },
      { label: '5 connected platforms', included: true, limit: '5' },
      { label: 'Advanced sentiment analysis', included: true },
      { label: 'Email & Slack notifications', included: true },
      { label: 'CSV & JSON export', included: true },
      { label: 'AI-generated responses', included: true },
      { label: 'Custom response templates', included: true },
      { label: 'Up to 3 team members', included: true, limit: '3' },
      { label: 'Priority support', included: false },
      { label: 'API access', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Enterprise-grade solution for large teams with unlimited scale and full control.',
    monthlyPrice: 149,
    annualPrice: 119,
    currency: 'USD',
    isPopular: false,
    ctaLabel: 'Contact Sales',
    ctaVariant: 'outline',
    highlightColor: 'var(--text-primary)',
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? '',
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID ?? '',
    features: [
      { label: 'Unlimited reviews/month', included: true },
      { label: 'Unlimited platforms', included: true },
      { label: 'Advanced sentiment analysis', included: true },
      { label: 'Email, Slack & webhook notifications', included: true },
      { label: 'All export formats', included: true },
      { label: 'AI-generated responses', included: true },
      { label: 'Custom response templates', included: true },
      { label: 'Unlimited team members', included: true },
      { label: 'Priority 24/7 support', included: true },
      { label: 'Full API access', included: true },
    ],
  },
];

export const COMPARISON_TABLE: ComparisonCategory[] = [
  {
    category: 'Review Management',
    rows: [
      {
        feature: 'Reviews per month',
        tooltip: 'Total number of reviews processed and analyzed per billing cycle.',
        free: '50',
        pro: '1,000',
        business: 'Unlimited',
      },
      {
        feature: 'Connected platforms',
        tooltip: 'Number of review platforms you can connect (Google, Yelp, TripAdvisor, etc.).',
        free: '1',
        pro: '5',
        business: 'Unlimited',
      },
      {
        feature: 'Review history',
        tooltip: 'How far back in time you can access and analyze reviews.',
        free: '30 days',
        pro: '1 year',
        business: 'All time',
      },
      {
        feature: 'Real-time sync',
        free: false,
        pro: true,
        business: true,
      },
    ],
  },
  {
    category: 'AI & Automation',
    rows: [
      {
        feature: 'AI-generated responses',
        tooltip: 'Automatically draft review responses using Claude AI.',
        free: false,
        pro: true,
        business: true,
      },
      {
        feature: 'Sentiment analysis',
        tooltip: 'Automatically classify review tone and extract key themes.',
        free: 'Basic',
        pro: 'Advanced',
        business: 'Advanced',
      },
      {
        feature: 'Custom response templates',
        tooltip: 'Create and manage your own response template library.',
        free: false,
        pro: true,
        business: true,
      },
      {
        feature: 'Auto-reply rules',
        tooltip: 'Set conditions to automatically send responses without manual approval.',
        free: false,
        pro: false,
        business: true,
      },
    ],
  },
  {
    category: 'Analytics & Reports',
    rows: [
      {
        feature: 'Dashboard analytics',
        free: true,
        pro: true,
        business: true,
      },
      {
        feature: 'Competitor benchmarking',
        tooltip: 'Compare your review scores against competitors in your category.',
        free: false,
        pro: true,
        business: true,
      },
      {
        feature: 'Scheduled reports',
        tooltip: 'Automatically receive PDF/CSV reports on a schedule.',
        free: false,
        pro: 'Weekly',
        business: 'Daily / Custom',
      },
      {
        feature: 'Custom dashboards',
        free: false,
        pro: false,
        business: true,
      },
    ],
  },
  {
    category: 'Team & Collaboration',
    rows: [
      {
        feature: 'Team members',
        free: '1',
        pro: '3',
        business: 'Unlimited',
      },
      {
        feature: 'Role-based permissions',
        free: false,
        pro: false,
        business: true,
      },
      {
        feature: 'Audit log',
        tooltip: 'Full history of all actions taken by team members.',
        free: false,
        pro: false,
        business: true,
      },
    ],
  },
  {
    category: 'Integrations & API',
    rows: [
      {
        feature: 'Slack notifications',
        free: false,
        pro: true,
        business: true,
      },
      {
        feature: 'Webhook support',
        free: false,
        pro: false,
        business: true,
      },
      {
        feature: 'REST API access',
        tooltip: 'Programmatic access to all review data and actions.',
        free: false,
        pro: false,
        business: true,
      },
      {
        feature: 'Zapier integration',
        free: false,
        pro: true,
        business: true,
      },
    ],
  },
  {
    category: 'Support',
    rows: [
      {
        feature: 'Community support',
        free: true,
        pro: true,
        business: true,
      },
      {
        feature: 'Email support',
        free: false,
        pro: true,
        business: true,
      },
      {
        feature: 'Priority 24/7 support',
        free: false,
        pro: false,
        business: true,
      },
      {
        feature: 'Dedicated account manager',
        free: false,
        pro: false,
        business: true,
      },
    ],
  },
];

export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Can I change my plan at any time?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time from your dashboard. Upgrades take effect immediately and you will be charged a prorated amount for the remainder of your billing cycle. Downgrades take effect at the start of the next billing cycle.',
  },
  {
    question: 'Is there a free trial for Pro or Business?',
    answer:
      'The Pro plan comes with a 14-day free trial — no credit card required. For the Business plan, we offer a personalized demo and a custom trial period. Reach out to our sales team to get started.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as ACH bank transfers for annual Business plans. All payments are processed securely through Stripe.',
  },
  {
    question: 'What happens when I reach my review limit?',
    answer:
      'When you reach your monthly review limit, new reviews will stop being processed until your billing cycle resets. We will send you an email notification at 80% and 100% of your limit so you can upgrade before hitting the cap.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer:
      'You can cancel your subscription at any time from your account settings. After cancellation, you will retain access to your paid plan until the end of the current billing period, then your account will revert to the Free plan.',
  },
  {
    question: 'Do you offer discounts for non-profits or startups?',
    answer:
      'Yes! We offer a 30% discount for registered non-profit organizations and a special startup program for early-stage companies. Contact us at support@reviewagent.io with proof of eligibility to apply.',
  },
  {
    question: 'Is my data secure and private?',
    answer:
      'Absolutely. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We are SOC 2 Type II compliant and never sell your data to third parties. You can request a full data export or deletion at any time.',
  },
];

export function getPlanById(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Plan with id "${id}" not found.`);
  return plan;
}

export function getPlanPrice(plan: Plan, billing: 'monthly' | 'annual'): number {
  return billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
}

export function getAnnualSavings(plan: Plan): number {
  if (plan.monthlyPrice === 0) return 0;
  return (plan.monthlyPrice - plan.annualPrice) * 12;
}

export function getDiscountPercent(plan: Plan): number {
  if (plan.monthlyPrice === 0) return 0;
  return Math.round((1 - plan.annualPrice / plan.monthlyPrice) * 100);
}

export function formatPrice(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
