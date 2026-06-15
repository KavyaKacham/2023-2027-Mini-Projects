import { Link } from 'react-router-dom';
import {
  Shield,
  Code2,
  MessageCircle,
  Briefcase,
  Mail,
  MapPin,
  Phone,
  ExternalLink,
  Heart,
} from 'lucide-react';

const footerLinks = {
  about: {
    title: 'About',
    links: [
      { label: 'Our Mission', href: '/about' },
      { label: 'Team', href: '/team' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  quickLinks: {
    title: 'Quick Links',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'OTP Management', href: '/dashboard/otp' },
      { label: 'Access Logs', href: '/dashboard/logs' },
      { label: 'Documentation', href: '/docs' },
    ],
  },
  security: {
    title: 'Security',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security Center', href: '/dashboard/security' },
      { label: 'Report a Bug', href: '/report' },
    ],
  },
};

const socialLinks = [
  { icon: Code2, href: 'https://github.com', label: 'GitHub' },
  { icon: MessageCircle, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Briefcase, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:contact@securevault.dev', label: 'Email' },
];

const Footer = () => {
  return (
    <footer className="relative bg-white/5 dark:bg-gray-900/60 bg-gray-100/80 backdrop-blur-xl border-t border-white/10 dark:border-white/10 border-gray-200/30">
      {/* Gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative">
                <Shield className="w-7 h-7 text-indigo-500" />
                <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                SecureVault
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 max-w-xs">
              Next-generation smart locker management with military-grade
              security. Protect what matters most with our OTP-based access
              system.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Bangalore, India</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                <Phone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>+91 (800) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>contact@securevault.dev</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-400 dark:hover:text-indigo-400 transition-colors duration-200"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 dark:via-white/10 via-gray-300/30 to-transparent" />

        {/* Bottom row */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
            © {new Date().getFullYear()} SecureVault. Crafted with
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline-block mx-0.5" />
            for security.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2.5 rounded-lg bg-white/5 dark:bg-white/5 bg-gray-200/50 border border-white/5 dark:border-white/5 border-gray-200/30 text-gray-400 dark:text-gray-500 hover:text-indigo-400 dark:hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
