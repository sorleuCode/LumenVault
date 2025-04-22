import React, {  useState } from 'react';
import {
  Shield, ArrowUpRight, AlertCircle,
  Clock, TrendingUp
} from 'lucide-react';
import { useLoanRequests } from '../context/LoanContext.jsx';
import useFundLoan from '../hooks/useFundLoan.js';
import { parseUnits } from 'ethers';
import { useAppKitAccount } from '@reown/appkit/react';


const LendingPage = () => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false); 

  const { address } = useAppKitAccount();

  const handleFundLoan = useFundLoan();
  const { loanRequests } = useLoanRequests();
  const noneActiveLoans = loanRequests.filter((loan) => !loan.isActive && loan.collateralAmount != 0);

  const stats = {
    totalLoans: noneActiveLoans.filter((loan) => !(String(loan.borrower).toString().toLowerCase() === address.toLowerCase())).length,
    avgInterestRate: (loanRequests.reduce((acc, loan) => acc + parseFloat(loan.maxInterestRate), 0) / loanRequests.length).toFixed(1),
  };

  const handleOpenModal = (loan) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    if (selectedLoan) {
      try {
        const result = await handleFundLoan(selectedLoan.loanId, parseUnits(selectedLoan.amount, 18));
        if (result) {
          setLoading(false);
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error("Error funding loan:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
              Lending
            </span>{" "}
            Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: "Available Loans",
                value: stats.totalLoans,
                icon: Shield,
              },
              {
                label: "Avg Interest Rate",
                value: `${
                  isNaN(stats.avgInterestRate) ? 0 : stats.avgInterestRate
                }%`,
                icon: TrendingUp,
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="relative overflow-hidden bg-[#1B2333] p-6 rounded-lg border border-[#2A3441] hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <stat.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm text-blue-400">{stat.label}</h3>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex gap-4 mb-8">
          {['all', 'high_yield'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`px-6 py-3 rounded-lg transition-all text-sm font-medium ${
                filterStatus === filter 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-[#1B2333] text-gray-300 hover:bg-[#2A3441] border border-[#2A3441]'
              }`}
            >
              {filter.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Loans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noneActiveLoans
            .filter((loan) => filterStatus === 'high_yield' ? parseFloat(loan.maxInterestRate) > 5 : true)
            .map((loan) => !(String(loan.borrower).toString().toLowerCase() === address.toLowerCase()) && (
              <div key={loan.loanId} className="group bg-[#1B2333] rounded-lg border border-[#2A3441] hover:border-blue-500/50 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        {loan.amount} mUSDT
                      </h3>
                      <p className="text-blue-400/80 mt-1">
                        Collateral: {Number(loan.collateralAmount).toFixed(3)} PTT
                      </p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Duration</div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-blue-400" />
                          {loan.duration} {loan.isDays ? "days" : "hours"}
                        </div>
                      </div>
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Interest</div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
                          {loan.maxInterestRate}% APR
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-sm text-gray-400">Amount:</div>
                      <div className="text-sm text-gray-400">
                        {loan.amount} mUSDT
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-sm text-gray-400">Collateral Ratio:</div>
                      <div className="text-sm text-gray-400">
                        {loan.collateralRatio}%
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-sm text-gray-400">Borrower:</div>
                      <div className="text-sm text-gray-400">
                        {`${String(loan.borrower).slice(0, 6)}...${String(loan.borrower).slice(-4)}`}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-sm text-gray-400">Due Date:</div>
                      <div className="text-sm text-gray-400">
                        {loan.dueDate}
                      </div>
                    </div>

                    <button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-md transition-all flex items-center justify-center"
                      onClick={() => handleOpenModal(loan)}
                    >
                      Fund Loan
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Fund Loan #{selectedLoan.id}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount to Fund</span>
                <span className="font-medium">{selectedLoan.amount} mUSDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collateral</span>
                <span className="font-medium">{Number(selectedLoan.collateralAmount).toFixed(3)} PTT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Interest Rate</span>
                <span className="font-medium">{selectedLoan.maxInterestRate}% APR</span>
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-blue-400" />
                <div>
                  <h4 className="font-medium mb-1">Information</h4>
                  <p className="text-sm text-gray-300">Make sure you have enough mUSDT tokens in your wallet before funding.</p>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-md transition-all"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Funding...' : 'Confirm Funding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LendingPage;