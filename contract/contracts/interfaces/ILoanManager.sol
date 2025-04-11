// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanManager {
    enum InterestRateType { FIXED, VARIABLE }

    event LoanRequested(uint256 indexed loanId, address borrower, uint256 amount, uint256 collateral,uint256 maxInterestRate,uint256 duration);
    event LoanFunded(uint256 indexed loanId, address indexed lender);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event PartialRepayment(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event InterestAccrued(uint256 indexed loanId, uint256 amount);
    event CollateralAdded(address indexed token, uint256 maxLTV);
    event AutomaticMatch(uint256 indexed loanId, address indexed lender, address indexed borrower);
    event LoanLiquidated(uint256 indexed loanId, address indexed liquidator);
    event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 loanAmount);
    event RewardCollected(uint256 indexed loanId, uint256 reward);
    event RewardsWithdrawn(address owner, uint256 contractBalance);
    event LoanLiquidated(uint256 indexed loanId, address indexed lender, uint256 loanAmount);



    function requestLoan(
        uint256 amount,
        uint256 maxInterestRate,
        uint256 duration
    ) external payable;

    function makePartialRepayment(uint256 loanId, uint256 amount) external;
}