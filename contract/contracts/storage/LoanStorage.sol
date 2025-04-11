// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ILoanManager.sol";
import "../libraries/CollateralRegistry.sol";

contract LoanStorage {
    struct LoanCore {
        address borrower;
        address lender;
        uint256 amount;
        uint256 collateral;
        uint256 interestRate;
        ILoanManager.InterestRateType rateType;
        uint256 duration;
    }

    struct LoanStatus {
        uint256 startTime;
        bool active;
        bool repaid;
        bool defaulted;
        uint256 repaidAmount;
    }

    struct LoanInterest {
        uint256 lastInterestAccrualTimestamp;
        uint256 accruedInterest;
    }

    struct LoanRequest {
        uint256 amount;
        uint256 maxInterestRate;
        uint256 dueDate;
        uint256 duration;
        bool matched;
    }

    struct LoanRequestDetail {
        uint256 loanId;
        address borrower;
        uint256 amount;
        uint256 maxInterestRate;
        uint256 dueDate;
        uint256 duration;
        uint256 collateralAmount;
        bool isActive;
        bool hasRepaid;
    }

    // Main storage mappings
    mapping(uint256 => LoanCore) public loansCore;
    mapping(uint256 => LoanStatus) public loansStatus;
    mapping(uint256 => LoanInterest) public loansInterest;

    // Changed from public to internal

    mapping(uint256 => mapping(address => uint256)) public loansCollateral;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;
    mapping(uint256 => LoanRequest) public loanRequests;
    mapping(address => uint256) public lenderAvailableFunds;
    mapping(address => CollateralRegistry.CollateralInfo)
        public supportedCollaterals;

    uint256[] AllLoansID;
}
