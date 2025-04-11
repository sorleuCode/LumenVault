import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { 
  ArrowRight, Lock, Zap, Users, 
  Coins, Wallet, Shield, LineChart
} from 'lucide-react';

const DeFiLanding = () => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    });
  }, [controls]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
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

      {/* Main content */}
      <div className="container mx-auto px-4 pt-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left section */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-6xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
                  Decentralized
                </span>
                <br />
                <span className="text-white">
                  Micro-Loans
                </span>
              </h1>
              <p className="text-xl text-gray-300">
                Access secure peer-to-peer lending powered by smart contracts. 
                Borrow or lend with confidence on our transparent platform.
              </p>
            </motion.div>

            <motion.div
              className="flex gap-4 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button
                className="px-8 py-4 bg-gradient-to-r from-blue-600 text-white rounded-md hover:bg-blue-900 transition-colors"
                onClick={() => window.location.href = '/app'}
              >
                <span className="relative flex items-center">
                  Launch App
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
             
            </motion.div>

            {/* Feature icons */}
            <motion.div 
              className="flex space-x-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { Icon: Lock, text: "Secure", color: "text-green-400" },
                { Icon: Zap, text: "Fast", color: "text-yellow-400" },
                { Icon: Users, text: "P2P", color: "text-orange-400" }
              ].map(({ Icon, text, color }) => (
                <motion.div 
                  key={text}
                  className="flex items-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <Icon className={`${color} mr-2`} />
                  <span className="text-gray-300">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right section - Animated visualization */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-300/20 rounded-full"
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              
              {/* Floating icons */}
              {[Coins, LineChart, Wallet, Shield].map((Icon, index) => (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{
                    top: `${20 + (index * 15)}%`,
                    left: `${20 + (index * 15)}%`,
                  }}
                  animate={{
                    y: ['-20%', '20%'],
                    x: ['-20%', '20%'],
                  }}
                  transition={{
                    y: {
                      duration: 3 + index,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    },
                    x: {
                      duration: 4 + index,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    },
                  }}
                >
                  <div className="p-4 bg-white/5 backdrop-blur-xl rounded-xl">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DeFiLanding;