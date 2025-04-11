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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Lending Dashboard
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Available Loans", value: stats.totalLoans },
              { label: "Avg Interest Rate", value: `${isNaN(stats.avgInterestRate) ? 0 : stats.avgInterestRate}%` },
            ].map((stat, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
                <h3 className="text-lg text-gray-400 mb-2">{stat.label}</h3>
                <p className="text-3xl font-bold text-blue-400">{stat.value}</p>
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
              className={`px-4 py-2 rounded-md transition-colors ${
                filterStatus === filter 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Loans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {noneActiveLoans
            .filter((loan) => filterStatus === 'high_yield' ? parseFloat(loan.maxInterestRate) > 5 : true)
            .map((loan) => !(String(loan.borrower).toString().toLowerCase() === address.toLowerCase()) && (
              <div key={loan.loanId} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {loan.amount} LINK
                      </h3>
                      <p className="text-gray-400">
                        Collateral: {Number(loan.collateralAmount).toFixed(3)} ETH
                      </p>
                    </div>
                    <Shield className="h-5 w-5 text-blue-400" />
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
                        {loan.amount} LINK
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
                <span className="font-medium">{selectedLoan.amount} LINK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collateral</span>
                <span className="font-medium">{Number(selectedLoan.collateralAmount).toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Interest Rate</span>
                <span className="font-medium">{selectedLoan.maxInterestRate}% APR</span>
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-blue-400" />
                <div>
                  <h4 className="font-medium mb-1">Information</h4>
                  <p className="text-sm text-gray-300">Make sure you have enough LINK tokens in your wallet before funding.</p>
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