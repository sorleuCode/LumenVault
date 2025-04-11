import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLoanRequests } from '../context/LoanContext.jsx';
import { useAppKitAccount } from '@reown/appkit/react';


// Hook to fetch market statistics
export const useMarketStats = () => {

  const { address } = useAppKitAccount()

  const { loanRequests } = useLoanRequests();

  const [stats, setStats] = useState({
    avgInterestRate: '0',
    activeLoans: '0',
    availableToBorrow: '0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if(!loanRequests) return
      try {
        setLoading(true);
        
        let activeLoansCount = 0;
        let totalInterestRate = 0;
        let totalLiquidity = 0;
        let allActiveLoans = 0


        loanRequests.forEach(loan => {
          if (loan.isActive && loan.borrower.toLowerCase() === address.toLowerCase()) {
            activeLoansCount++;
          }
        });

        loanRequests.forEach(loan => {
          if (loan.isActive) {
            totalLiquidity += Number(loan.amount);
            
          }

          if(loan) {

            allActiveLoans++
            totalInterestRate += Number(loan.maxInterestRate);
          }
        });



        const avgInterestRate = allActiveLoans > 0 ? 
          (totalInterestRate / allActiveLoans).toFixed(2) : '0';

        setStats({
          totalLiquidity: totalLiquidity,
          avgInterestRate: Number(avgInterestRate),
          activeLoans: activeLoansCount.toString(),
          availableToBorrow: totalLiquidity
        });
      } catch (error) {
        console.error('Error fetching market stats:', error);
        toast.error('Failed to fetch market statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [loanRequests.length]);

  return { ...stats, loading };
};



