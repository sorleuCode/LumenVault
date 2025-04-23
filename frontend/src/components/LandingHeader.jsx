import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../images/redesignLogo.png';


const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-[#808080]">
      <nav className="container mx-auto px-3 sm:px-4 h-16 sm:h-20">
        <div className="flex items-center justify-center h-full gap-8">
          <Link to="/" aria-label="LumenVault Home" className="flex">
            <img
              src={logo}
              alt="LumenVault Logo"
              className="md:h-[40px] h-[40px] md:w-[230px]"

            />
          </Link>
          <span className='flex-1'></span>
          <Link
            to="/docs"
            className="md:flex hidden text-white hover:text-blue-400 transition-colors font-bold text-sm lg:text-base"
          >
            Docs
          </Link>
          <Link
            to="/how-it-works"
            className="md:flex hidden text-white hover:text-blue-400 transition-colors font-bold text-sm lg:text-base"
          >
            How It Works
          </Link>
          <Link
            to="/app"
            className="md:flex hidden h-9 lg:h-10 items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-blue-300 px-4 lg:px-4 text-base lg:text-lg font-bold text-black transition-colors hover:opacity-90"
          >
            Open dApp
          </Link>
          {/* </div> */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-white hover:text-blue-400 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/90 border-t border-orange-500/10 overflow-hidden"
            >
              <div className="container mx-auto py-3">
                <div className="flex flex-col space-y-2">
                  <Link
                    to="/docs"
                    className="text-white hover:text-blue-400 transition-colors font-semibold px-3 py-4 text-base active:bg-white/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Docs
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="text-white hover:text-blue-400 transition-colors font-semibold px-3 py-4 text-base active:bg-white/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    How It Works
                  </Link>
                  <div className="px-3 py-2">
                    <Link
                      to="/app"
                      className="inline-flex w-full h-12 items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-blue-300 px-8 text-base font-semibold text-black transition-colors hover:opacity-90 active:opacity-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Open dApp
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default LandingHeader;