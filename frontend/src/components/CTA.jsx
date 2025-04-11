import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-20 bg-[#1C1C1C]">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300"

        >
          Ready to Start Your DeFi Journey?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl mb-8 text-gray-300"
        >
          Join LENDLINK today and experience the future of peer-to-peer lending and borrowing.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link
            to="/app"
            className="inline-flex items-center px-8 py-4  bg-gradient-to-r from-blue-600 text-white rounded-md hover:bg-blue-900 transition-colors text-lg font-semibold"
           
          >
            Launch App
            <ArrowRight className="ml-2 h-6 w-6" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;

