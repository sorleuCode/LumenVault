// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./interfaces/ILoanManager.sol";
import "./libraries/CollateralUtils.sol";
import "./libraries/CollateralRegistry.sol";
import "./libraries/LoanCalculator.sol";
import "./storage/LoanStorage.sol";

contract LoanManager is ILoanManager, LoanStorage, ReentrancyGuard, Pausable {
    using CollateralUtils for uint256;

    IERC20 public linkToken; // $LINK as the loan currency
    AggregatorV3Interface public priceFeed; // ETH price feed
    address public owner;

    uint256 public collateralizationRatio = 120;
    uint256 public liquidationThreshold = 110; // 110%
    uint256 public loanCounter;
    uint256 public minLoanAmount = 10**18;
    uint256 public maxLoanAmount = 100_000 * 10**18;

    constructor(IERC20 _linkToken, AggregatorV3Interface _priceFeed) {
        linkToken = _linkToken;
        priceFeed = _priceFeed;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function requestLoan(
        uint256 amount,
        uint256 maxInterestRate,
        uint256 duration
    ) external payable override whenNotPaused nonReentrant {
        require(
            amount >= minLoanAmount && amount <= maxLoanAmount,
            "Invalid loan amount"
        );


        uint256 ethPrice = getETHPrice();

        uint256 requiredCollateral = amount.calculateRequiredCollateral(ethPrice, collateralizationRatio, priceFeed.decimals());

        require(msg.value >= requiredCollateral, "Insufficient collateral");

        loanCounter++;

        LoanRequest storage request = loanRequests[loanCounter];
        request.amount = amount;
        request.maxInterestRate = maxInterestRate;
        request.duration = duration;
        request.dueDate = block.timestamp + duration;
        request.matched = false;

        loansCore[loanCounter] = LoanCore({
            borrower: msg.sender,
            lender: address(0),
            amount: amount,
            collateral: msg.value,
            interestRate: maxInterestRate,
            rateType: InterestRateType.FIXED,
            duration: duration
        });

        borrowerLoans[msg.sender].push(loanCounter);
        tryAutomaticMatch(loanCounter);

        emit LoanRequested(loanCounter, msg.sender, amount, msg.value, maxInterestRate, duration);
    }

    function fundLoan(uint256 loanId) external whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];

        // Ensure the loan is not already active
        require(!status.active, "Loan already active");
        require(loan.lender == address(0), "Loan already funded");
        require(
            linkToken.allowance(msg.sender, address(this)) >= loan.amount,
            "Insufficient allowance for this user"
        );

        // Transfer the loan amount from lender to the contract
        require(
            linkToken.transferFrom(msg.sender, address(this), loan.amount),
            "Transfer failed"
        );

        // Mark the loan as funded and active
        loan.lender = msg.sender;
        status.startTime = block.timestamp;
        status.active = true;

        // Disburse the loan amount to the borrower
        require(
            linkToken.transfer(loan.borrower, loan.amount),
            "Loan disbursement failed"
        );

        // Record the loan in the lender's and borrower's loan records
        lenderLoans[msg.sender].push(loanId);
        borrowerLoans[loan.borrower].push(loanId);
        AllLoansID.push(loanId);

        emit LoanFunded(loanId, msg.sender);
        emit LoanDisbursed(loanId, loan.borrower, loan.amount); // New event to indicate loan disbursement
    }

    function makePartialRepayment(
        uint256 loanId,
        uint256 amount
    ) external override whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanInterest storage interest = loansInterest[loanId];

        require(status.active, "Loan not active");
        require(msg.sender == loan.borrower, "Not borrower");

        // Accrue interest before repayment to ensure interest is up-to-date
        accrueInterest(loanId);

        uint256 totalInterest = interest.accruedInterest;
        uint256 totalRepayment = loan.amount +
            totalInterest -
            status.repaidAmount;

        require(amount <= totalRepayment, "Repayment exceeds owed amount");

        // Transfer repayment amount from borrower to lender
        require(
            linkToken.transferFrom(msg.sender, loan.lender, amount),
            "Partial repayment failed"
        );

        // Update loan repayment status
        status.repaidAmount += amount;

        // Check if loan is fully repaid
        if (status.repaidAmount >= totalRepayment) {
            status.repaid = true;
            status.active = false;
            returnCollateral(loanId); // Return collateral to borrower
        }

        emit PartialRepayment(loanId, msg.sender, amount);
    }

    function allowanceCaller() external view returns (uint256) {
        uint256 allowance = linkToken.allowance(msg.sender, address(this));

        return allowance;
    }

    function accrueInterest(uint256 loanId) internal {
        LoanCore storage loan = loansCore[loanId];
        LoanInterest storage interest = loansInterest[loanId];
        LoanStatus storage status = loansStatus[loanId];

        require(status.active, "Loan not active");

        // Calculate time elapsed since the last accrual
        uint256 timeElapsed;
        if (interest.lastInterestAccrualTimestamp == 0) {
            timeElapsed = loan.duration; // Use the loan duration if no prior accrual
        } else {
            timeElapsed =
                block.timestamp -
                interest.lastInterestAccrualTimestamp;
        }

        require(timeElapsed > 0, "No time elapsed for interest accrual");

        // Calculate accrued interest using the elapsed time
        uint256 accrued = LoanCalculator.calculatePeriodicInterest(
            loan.amount,
            loan.interestRate,
            timeElapsed
        );

        // Update accrued interest and timestamp
        interest.accruedInterest += accrued;
        interest.lastInterestAccrualTimestamp = block.timestamp;

        emit InterestAccrued(loanId, accrued);
    }

    function repayLoanWithReward(
        uint256 loanId
    ) external whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanInterest storage interest = loansInterest[loanId];

        require(status.active, "Loan not active");
        require(msg.sender == loan.borrower, "Not borrower");

        // First, accrue interest before repayment
         accrueInterest(loanId); // This will calculate and update interest first

        // Calculate the total interest accrued so far
        uint256 totalInterest = interest.accruedInterest;

        require(totalInterest > 0, "no interest accrued!");

        // Deduct the total interest from the repayment amount
        uint256 reward = (totalInterest * 20) / 100; // 20% of interest as reward
        uint256 lenderInterest = totalInterest - reward; // Remaining interest for lender

        // Update accrued interest and timestamps
        interest.lastInterestAccrualTimestamp = block.timestamp; // Update timestamp

        // Calculate total repayment (principal + remaining interest - already repaid)
        uint256 totalRepayment = loan.amount +
            totalInterest -
            status.repaidAmount;

        require(totalRepayment > loan.amount, "Interest not calculated");
        require(reward > 0, "No reward calculated");

        require(
            linkToken.transferFrom(msg.sender, address(this), totalRepayment),
            "Transfer failed"
        );

        // Transfer lender's share (principal + lender's portion of interest)
        uint256 amountToLender = loan.amount + lenderInterest;
        require(
            linkToken.transfer(loan.lender, amountToLender),
            "Transfer to lender failed"
        );

        // Update loan status
        status.repaidAmount += totalRepayment; // Add repayment to the total
        status.active = false; // Mark loan as fully repaid
        status.repaid = true;
        status.defaulted = false;

        // Return collateral to borrower
        returnCollateral(loanId);

        emit LoanRepaid(loanId, msg.sender, totalRepayment);
        emit RewardCollected(loanId, reward); // Emit reward collection event
    }

    function liquidateOverdueLoan(
        uint256 loanId
    ) external whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];

        require(status.active, "Loan not active");
        require(block.timestamp > loan.duration, "Loan not overdue");
        require(!status.repaid, "Loan already repaid");

        // Transfer the Ether collateral to the lender
        transferCollateralToLender(loanId);

        // Mark the loan as defaulted and inactive
        status.active = false;
        status.defaulted = true;

        emit LoanLiquidated(loanId, loan.lender, loan.amount);
    }

    function transferCollateralToLender(uint256 loanId) internal {
        LoanCore storage loan = loansCore[loanId];

        // Ensure the contract holds sufficient Ether as collateral
        require(
            address(this).balance >= loan.collateral,
            "Insufficient collateral balance"
        );

        // Mark lender address as payable and transfer the collateral (Ether)
        address payable lenderPayable = payable(loan.lender);
        (bool success, ) = lenderPayable.call{value: loan.collateral}("");

        require(success, "Collateral transfer failed");
    }

    function returnCollateral(uint256 loanId) internal {
        LoanCore storage loan = loansCore[loanId];
        uint256 amount = loan.collateral;

        if (amount > 0) {
            loan.collateral = 0;
            (bool sent, ) = payable(loan.borrower).call{value: amount}("");
            require(sent, "Collateral transfer failed");
        }
    }

    function getETHPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    function withdrawRewards(address _owner) external onlyOwner nonReentrant {
        uint256 contractBalance = linkToken.balanceOf(address(this));
        require(contractBalance > 0, "No rewards to withdraw");

        require(
            linkToken.transfer(_owner, contractBalance),
            "Reward withdrawal failed"
        );

        emit RewardsWithdrawn(_owner, contractBalance);
    }

    function tryAutomaticMatch(uint256 loanId) internal {
        LoanRequest storage request = loanRequests[loanId];
        address bestLender;
        uint256 bestRate = type(uint256).max;

        for (uint256 i = 0; i < AllLoansID.length; i++) {
            address lender = address(uint160(AllLoansID[i]));
            if (lenderAvailableFunds[lender] >= request.amount) {
                uint256 offeredRate = getLenderOfferedRate(
                    lender,
                    request.amount
                );
                if (
                    offeredRate <= request.maxInterestRate &&
                    offeredRate < bestRate
                ) {
                    bestLender = lender;
                    bestRate = offeredRate;
                }
            }
        }

        if (bestLender != address(0)) {
            createMatchedLoan(loanId, bestLender, bestRate);
        }
    }

    function getrequiredCollateralAmount(uint256 loanAmount) external view returns(uint256) {

        uint256 ethPrice = getETHPrice();


        return loanAmount.calculateRequiredCollateral(ethPrice, collateralizationRatio, priceFeed.decimals());

    }



    function getLenderOfferedRate(
        address lender,
        uint256 amount
    ) internal view returns (uint256) {
        // Fetch lender's available funds
        uint256 availableFunds = lenderAvailableFunds[lender];

        // Ensure the lender has enough funds to cover the requested amount
        require(availableFunds >= amount, "Insufficient lender funds");

        // Calculate the utilization rate (percentage of available funds requested)
        uint256 utilizationRate = (amount * 100) / availableFunds;

        // Use utilization rate to determine the offered rate
        // This logic can be customized based on your lending protocol
        // For simplicity, let's assume a direct correlation
        uint256 baseRate = 2; // e.g., 5% base rate
        uint256 maxRate = 20; // e.g., 20% maximum rate

        // Higher utilization results in a higher offered rate, capped at maxRate
        uint256 offeredRate = baseRate +
            ((utilizationRate * (maxRate - baseRate)) / 100);
        if (offeredRate > maxRate) {
            offeredRate = maxRate; // Ensure rate does not exceed maxRate
        }

        return offeredRate;
    }

    function createMatchedLoan(
        uint256 loanId,
        address lender,
        uint256 rate
    ) internal {
        LoanCore storage loan = loansCore[loanId];
        loan.lender = lender;
        loan.interestRate = rate;
        loanRequests[loanId].matched = true;

        emit AutomaticMatch(loanId, lender, loan.borrower);
    }

    function updateCollateralizationRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Ratio too low");
        collateralizationRatio = newRatio;
    }

    function updateLiquidationThreshold(
        uint256 newThreshold
    ) external onlyOwner {
        require(newThreshold >= 100, "Threshold too low");
        liquidationThreshold = newThreshold;
    }

    function setLoanLimits(
        uint256 _minLoanAmount,
        uint256 _maxLoanAmount
    ) external onlyOwner {
        require(
            _minLoanAmount > 0,
            "Minimum loan amount must be greater than 0"
        );
        require(
            _maxLoanAmount > _minLoanAmount,
            "Maximum loan amount must be greater than minimum loan amount"
        );
        minLoanAmount = _minLoanAmount;
        maxLoanAmount = _maxLoanAmount;
    }

    function getTotalLoanPayment(uint256 loanId) external view returns (uint256 totalPayment, uint256 principal, uint256 interestAmount) {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanInterest storage interest = loansInterest[loanId];

        require(loan.amount > 0, "Loan does not exist");
        
        principal = loan.amount;
        
        // If loan is not active and already repaid, return the actual amounts paid
        if (!status.active && status.repaid) {
            return (status.repaidAmount, principal, status.repaidAmount - principal);
        }
        
        // Calculate time elapsed since loan start or last interest accrual
        uint256 timeElapsed;
        if (status.active) {
            if (interest.lastInterestAccrualTimestamp == 0) {
                timeElapsed = block.timestamp - status.startTime;
            } else {
                timeElapsed = block.timestamp - interest.lastInterestAccrualTimestamp;
            }
            
            // Calculate additional interest since last accrual
            uint256 additionalInterest = LoanCalculator.calculatePeriodicInterest(
                loan.amount,
                loan.interestRate,
                timeElapsed
            );
            
            
            interestAmount = interest.accruedInterest + additionalInterest;
        } else {
            interestAmount = interest.accruedInterest;
        }
        
        totalPayment = principal + interestAmount - status.repaidAmount;
        
        return (totalPayment, principal, interestAmount);
    }

    function getAllLoanRequests()
        external
        view
        returns (LoanRequestDetail[] memory)
    {
        // First pass to count valid requests
        uint256 validCount = 0;
        for (uint256 i = 1; i <= loanCounter; i++) {
            LoanRequest memory request = loanRequests[i];
            if (request.amount > 0) {
                validCount++;
            }
        }

        // Create array with exact size
        LoanRequestDetail[] memory details = new LoanRequestDetail[](
            validCount
        );
        uint256 currentIndex = 0;

        // Second pass to populate array
        for (uint256 i = 1; i <= loanCounter; i++) {
            LoanRequest memory request = loanRequests[i];
            LoanStatus memory status = loansStatus[i];
            LoanCore memory core = loansCore[i];

            if (request.amount > 0) {
                details[currentIndex] = LoanRequestDetail({
                    loanId: i,
                    borrower: core.borrower,
                    amount: request.amount,
                    maxInterestRate: request.maxInterestRate,
                    dueDate: request.dueDate,
                    duration: request.duration,
                    collateralAmount: core.collateral,
                    isActive: status.active,
                    hasRepaid: status.repaid
                });
                currentIndex++;
            }
        }

        return details;
    }
}
