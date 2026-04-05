'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Shield } from 'lucide-react';

const navLinks = [
  { href: '/#tracks',   label: 'Internships' },
  { href: '/#features', label: 'Features' },
  { href: '/#faq',      label: 'FAQ' },
  { href: '/contact',   label: 'Contact' },
  { href: '/verify',    label: 'Verify Certificate' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm
      border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex
              items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900">Prodigy InfoTech</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-600 hover:text-primary-600
                  transition-colors font-medium"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/apply"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg
                text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-gray-600"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700
                  hover:bg-gray-50 rounded-lg"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/apply"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-primary-600"
            >
              Apply Now →
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}