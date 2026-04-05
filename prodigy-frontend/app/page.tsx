import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import {
  Award, Users, BookOpen, CheckCircle, Globe,
  ArrowRight, Shield
} from 'lucide-react';

// Track catalog data — matches our seed data
const tracks = [
  { name: 'Software Development', slug: 'software-development', icon: '💻' },
  { name: 'Web Development',      slug: 'web-development',      icon: '🌐' },
  { name: 'Full Stack Development', slug: 'full-stack-development', icon: '⚡' },
  { name: 'Machine Learning',     slug: 'machine-learning',     icon: '🤖' },
  { name: 'Data Science',         slug: 'data-science',         icon: '📊' },
  { name: 'Generative AI',        slug: 'generative-ai',        icon: '✨' },
  { name: 'Software Testing',     slug: 'software-testing',     icon: '🧪' },
  { name: 'Cyber Security',       slug: 'cyber-security',       icon: '🔒' },
  { name: 'Android Development',  slug: 'android-development',  icon: '📱' },
];

const features = [
  {
    icon: Award,
    title: 'Verified Certificates',
    desc: 'Each certificate has a unique CIN that employers can verify online instantly.',
  },
  {
    icon: Globe,
    title: '100% Remote',
    desc: 'Work from anywhere in India. No commute, no relocation needed.',
  },
  {
    icon: BookOpen,
    title: 'Structured Curriculum',
    desc: 'Industry-relevant tasks designed by practitioners, not academics.',
  },
  {
    icon: Users,
    title: 'Batch-Based Learning',
    desc: 'Join a cohort of peers. Batches start on the 1st and 15th each month.',
  },
];

const faqs = [
  {
    q: 'How long is the internship?',
    a: 'Each internship track is 30 days long, with batches starting on the 1st or 15th of each month.',
  },
  {
    q: 'Is there a fee?',
    a: 'There is a one-time ₹129 documentation fee to cover certificate processing and issuance.',
  },
  {
    q: 'What do I need to apply?',
    a: 'Just your name, email, and phone number. No prior experience required for most tracks.',
  },
  {
    q: 'When do I receive the offer letter?',
    a: 'Offer letters are sent within 48 hours of batch processing, which happens on the 1st and 15th.',
  },
  {
    q: 'How do I submit my tasks?',
    a: 'You will receive a task submission form via email approximately 10–15 days into your internship.',
  },
  {
    q: 'When is the certificate issued?',
    a: 'Certificates are issued after the batch end date, once your task submission is verified.',
  },
  {
    q: 'Can employers verify my certificate?',
    a: 'Yes. Every certificate has a unique CIN that can be verified at prodigyinfotech.dev/verify.',
  },
  {
    q: 'Can I apply for multiple tracks?',
    a: 'You can apply for one track per month. After completing one, you may apply for another.',
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-900
          text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full
              px-4 py-2 text-sm mb-6">
              <CheckCircle size={16} />
              <span>Verified certificates · 9 tracks · 100% remote</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Launch Your Tech Career with a
              <span className="text-yellow-300"> Real Internship</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-10">
              Gain hands-on experience, build your portfolio, and earn a
              verified certificate — all from anywhere in India.
              Batches start every 1st and 15th.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="bg-white text-primary-700 font-semibold px-8 py-4
                  rounded-xl hover:bg-primary-50 transition-colors
                  flex items-center justify-center gap-2"
              >
                Apply Now — ₹129 only
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/verify"
                className="border border-white/30 text-white font-medium px-8 py-4
                  rounded-xl hover:bg-white/10 transition-colors
                  flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                Verify a Certificate
              </Link>
            </div>
          </div>
        </section>

        {/* ── Tracks ── */}
        <section id="tracks" className="py-20 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Choose Your Track
              </h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                9 specialisations across the most in-demand tech fields.
                Each is a 30-day structured program.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.map((track) => (
                <Link
                  key={track.slug}
                  href={`/apply?track=${track.slug}`}
                  className="bg-white rounded-2xl border border-gray-200 p-6
                    hover:border-primary-300 hover:shadow-md
                    transition-all duration-200 group"
                >
                  <div className="text-4xl mb-4">{track.icon}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600
                    transition-colors">
                    {track.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">30-day internship</p>
                  <div className="mt-4 flex items-center gap-1 text-primary-600
                    text-sm font-medium opacity-0 group-hover:opacity-100
                    transition-opacity">
                    Apply now <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Why Prodigy InfoTech?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-6">
                  <div className="inline-flex items-center justify-center
                    w-12 h-12 bg-primary-100 text-primary-600 rounded-xl mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <div key={q}
                  className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 bg-primary-600 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to start your internship?
            </h2>
            <p className="text-primary-100 mb-8">
              Applications are open. Next batch starts on the 1st or 15th.
            </p>
            <Link
              href="/apply"
              className="bg-white text-primary-700 font-semibold px-8 py-4
                rounded-xl hover:bg-primary-50 transition-colors
                inline-flex items-center gap-2"
            >
              Apply Now — ₹129 only <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-gray-900 text-gray-400 py-10 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row
            items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-600 rounded flex
                items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="text-white font-medium">Prodigy InfoTech</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/verify" className="hover:text-white transition-colors">
                Verify Certificate
              </Link>
              <Link href="/apply" className="hover:text-white transition-colors">
                Apply
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <a href="mailto:support@prodigyinfotech.dev"
                className="hover:text-white transition-colors">
                support@prodigyinfotech.dev
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}