import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Github, Linkedin, Facebook, Hexagon } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
  ];

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
  ];

  return (
    <footer className="relative pt-24 pb-12 overflow-hidden bg-[#1C1C1C]">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-300 p-2 rounded-lg">
                <Hexagon className="h-6 w-6 text-black" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
                LENDLINK
              </span>
            </div>
            <p className="text-gray-400">
              Empowering financial inclusion through blockchain technology.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-400 font-semibold hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
              Contact Us
            </h4>
            <p className="text-gray-400 mb-4">
              Have questions? Reach out to our support team anytime.
            </p>
            <a
              href="mailto:support@lendlink.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              support@lendlink.com
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
              Connect With Us
            </h4>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <social.icon className="h-5 w-5 text-gray-400" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-8 border-t border-white/10 text-center"
        >
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} LENDLINK. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

