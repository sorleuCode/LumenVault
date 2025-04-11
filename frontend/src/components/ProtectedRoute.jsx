import { useAppKitAccount } from '@reown/appkit/react';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
useAppKitAccount
const ProtectedRoute = ({ children }) => {
  const { address } = useAppKitAccount()

  if (!address) {
    toast.error("You must connect your wallet")
    return <Navigate to="/app" />;
  }

  return children;
};

export default ProtectedRoute;