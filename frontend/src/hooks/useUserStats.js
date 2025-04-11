import { useState, useEffect } from 'react';
import { formatEther, formatUnits } from 'ethers';
import useContractInstance from './useContractInstance';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'react-toastify';
import { useLoanRequests } from '../context/LoanContext.jsx';


// Hook to fetch user loan statistics
export const useUserStats = () => {
  const { address } = useAppKitAccount();
  const { loanRequests } = useLoanRequests();
  

  const [stats, setStats] = useState({
    activeLoans: [],
    totalBorrowed: '0',
    totalCollateral: '0',
    healthFactor: '0'
  });
  const [loading, setLoading] = useState(true);



useEffect(() => {
  const fetchUserStats = async () => {
    if (!address) return;
    try {
      setLoading(true);

      // Filter loans dynamically
      const filteredLoans = loanRequests?.filter(
        (loan) => loan.borrower.toUpperCase() === address.toUpperCase() && loan.isActive
      );


      let totalBorrowed = 0;
      let totalCollateral = 0;
      const activeLoans = [];


      filteredLoans.forEach((loan) => {
        totalBorrowed += loan.amount;
        totalCollateral += loan.collateralAmount;
        activeLoans.push({
          id: loan.loanId,
          amount: loan.amount,
          collateral: 'ETH',
          duration: loan.duration,
          interestRate: loan.maxInterestRate,
          dueDate: loan.dueDate,
          isDays: loan.isDays,
          borrower: loan.borrower,
          isActive: loan.isActive
        });
      });

      const healthFactor =
        totalBorrowed > 0 ? totalCollateral / totalBorrowed : 0;

      setStats({
        healthFactor,
        activeLoans,
        totalBorrowed,
        totalCollateral,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to fetch user statistics');
    } finally {
      setLoading(false);
    }
  };

  fetchUserStats();
  const interval = setInterval(fetchUserStats, 15000);
  return () => clearInterval(interval);
}, [loanRequests.length, address]);


  return { ...stats, loading };
};