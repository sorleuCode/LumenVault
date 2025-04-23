import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {  Menu, X } from "lucide-react";
import logo from '../images/adjustLogo.png';

const AppHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#808080]">
      <nav className="container mx-auto px-3 sm:px-4">
        <div className="h-16 flex items-center justify-between">

          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-4">
            

               <img
                            src={logo}
                            alt="LumenVault Logo"
                            className="md:h-[50px] h-[40px] w-max"
                  />
            </Link>
          </div>

       
          <div className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8">
            <Link
              to="/app"
              className="text-gray-300 lg:font-bold hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/app/lend"
              className="text-gray-300 lg:font-bold hover:text-blue-400 transition-colors"
            >
              Lend
            </Link>
            <Link
              to="/app/borrow"
              className="text-gray-300 lg:font-bold hover:text-blue-400 transition-colors"
            >
              Borrow
            </Link>

            
          </div>


          <div className="flex items-center space-x-2 sm:space-x-4">
          
            <button
              className="md:hidden p-1.5 text-gray-400 hover:text-gray-200"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className=" hidden md:flex  items-center">
              <div className="scale-90 sm:scale-100">
                <appkit-button />
              </div>
            </div>
          </div>
        </div>

     
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

                <div className="ml-o  flex items-center">
                    <div className="scale-90 sm:scale-100">
                      <appkit-button/>
                    </div>
                  </div>
                  <Link
                    to="/app"
                    className="text-gray-300 font-mono hover:text-orange-500 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/app/lend"
                    className="text-gray-300 font-mono hover:text-orange-500 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lender
                  </Link>
                  <Link
                    to="/app/borrow"
                    className="text-gray-300 font-mono hover:text-orange-500 transition-colors text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Borrow
                  </Link>

                  
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