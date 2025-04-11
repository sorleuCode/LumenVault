import React from 'react';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import CTA from './CTA';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;

