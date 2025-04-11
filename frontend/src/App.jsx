import React from 'react';
import './config/connection';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingHeader from './components/LandingHeader';
import AppHeader from './components/AppHeader';
import HowItWorks from './components/HowItWorks';
import Docs from './components/Docs';
import CTA from './components/CTA';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LendPage from './pages/LendPage';
import BorrowPage from './pages/BorrowPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <LandingHeader />
                <LandingPage />
                <HowItWorks />
                <CTA />
                <Footer />
              </>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <>
                <LandingHeader />
                <HowItWorks />
              </>
            }
          />

          <Route
            path="/docs"
            element={
              <>
                <LandingHeader />
                <Docs />
              </>
            }
          />
          
          <Route
            path="/app/*"
            element={
              <>
                <AppHeader />
                <main className="pt-16 px-4">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route
                      path="/lend"
                      element={
                        <ProtectedRoute>
                          <LendPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/borrow"
                      element={
                        <ProtectedRoute>
                          <BorrowPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;