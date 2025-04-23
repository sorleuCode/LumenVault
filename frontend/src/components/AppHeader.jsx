import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../images/redesignLogo.png";

const AppHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Animation variants for the underline
  const underlineVariants = {
    inactive: { scaleX: 0 },
    active: { scaleX: 1, transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const renderNavLink = (to, label) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative inline-block pb-1 ${isActive ? "text-blue-400 font-bold" : "text-gray-300 lg:font-bold hover:text-blue-400 transition-colors"}`
      }
      end={to === "/app"} // Exact match for /app
    >
      {({ isActive }) => (
        <>
          {label}
          <motion.span
            className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"
            variants={underlineVariants}
            initial="inactive"
            animate={isActive ? "active" : "inactive"}
          />
        </>
      )}
    </NavLink>
  );

  const renderMobileNavLink = (to, label) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative inline-block pb-1 ${isActive ? "text-blue-400 font-mono text-sm font-bold" : "text-gray-300 font-mono text-sm hover:text-blue-400 transition-colors"}`
      }
      end={to === "/app"}
      onClick={() => setIsMenuOpen(false)}
    >
      {({ isActive }) => (
        <>
          {label}
          <motion.span
            className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"
            variants={underlineVariants}
            initial="inactive"
            animate={isActive ? "active" : "inactive"}
          />
        </>
      )}
    </NavLink>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#808080]">
      <nav className="container mx-auto px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center space-x-4">
              <img
                src={logo}
                alt="LumenVault Logo"
                className="md:h-[40px] h-[40px] md:w-[230px]"
              />
            </NavLink>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8">
            {renderNavLink("/app", "Dashboard")}
            {renderNavLink("/app/lend", "Lend")}
            {renderNavLink("/app/borrow", "Borrow")}
          </div>

          {/* Mobile Menu Button and Appkit Button */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="md:hidden p-1.5 text-gray-400 hover:text-gray-200"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden md:flex items-center">
              <div className="scale-90 sm:scale-100">
                <appkit-button />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black border-t border-orange-500/10"
            >
              <div className="py-2 pl-6">
                <div className="flex flex-col space-y-3">
                  <div className="ml-0 flex items-center">
                    <div className="scale-90 sm:scale-100">
                      <appkit-button />
                    </div>
                  </div>
                  {renderMobileNavLink("/app", "Dashboard")}
                  {renderMobileNavLink("/app/lend", "Lend")}
                  {renderMobileNavLink("/app/borrow", "Borrow")}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default AppHeader;