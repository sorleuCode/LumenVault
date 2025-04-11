import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, DollarSign, RefreshCw, Smartphone, BarChart } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'Create an Account', description: 'Sign up and verify your identity on the LENDLINK platform using secure blockchain-based authentication.' },
  { icon: Search, title: 'Browse Loans', description: 'Explore available loan offers or create a loan request with our intuitive dashboard.' },
  { icon: DollarSign, title: 'Lend or Borrow', description: 'Choose to lend funds or apply for a loan that suits your needs with flexible terms.' },
  { icon: RefreshCw, title: 'Manage Transactions', description: 'Track repayments, interest accrual, and loan status in real-time with detailed insights.' },
  { icon: BarChart, title: 'Interactive Dashboard', description: 'Access a simple and accessible interface with interactive charts and filters for enhanced usability.' },
  { icon: Smartphone, title: 'Multi-Device Access', description: 'Seamlessly access the platform across desktop, mobile, and tablet devices with our responsive design.' },
];

const Features = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-black">
      {/* Animated star background */}
      <div className="absolute inset-0">
        <div className="absolute w-full h-full">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-200 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          className="text-5xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
            How It Works
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-blue-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="relative inline-block mb-4 p-4 bg-[#1034A6] rounded-full"
                whileHover={{ scale: 1.1 }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(16, 52, 166, 0.4)",
                    "0 0 0 10px rgba(16, 52, 166, 0)",
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <step.icon className="w-6 h-6 text-white" />
              </motion.div>
              
              <h3 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200">
                {step.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;