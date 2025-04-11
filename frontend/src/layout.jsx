// src/components/AppLayout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white">
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
