import { Link } from 'react-router-dom'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react'

const footerNavigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Listings', href: '/listings' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-accent" />
                <span className="font-heading font-bold text-xl">
                  Zawamu Properties
                </span>
              </Link>
              <p className="mt-4 text-sm text-primary-foreground/80 max-w-md">
                Your trusted partner in finding the perfect property. We
                specialize in luxury real estate with personalized service and
                expert market knowledge.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-sm">
                    Bypass Arcade, 1st Floor, Kahawa West along Northern Bypass
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-accent" />
                  <span className="text-sm">0711168716</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="text-sm">Zawamuproperty@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {footerNavigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Social */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-3 mb-6">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <h3 className="font-heading font-semibold text-lg mb-4">
                Follow Us
              </h3>
              <div className="flex space-x-4">
                {footerNavigation.social.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-primary-foreground/80 hover:text-accent transition-colors"
                      aria-label={item.name}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-primary-foreground/60">
              © 2024 Zawamu Properties. All rights reserved.
            </p>
            <p className="text-sm text-primary-foreground/60 mt-2 sm:mt-0">
              Built with passion for exceptional real estate experiences.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
