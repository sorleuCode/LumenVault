// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILoanManager.sol";
import "./libraries/CollateralUtils.sol";
import "./libraries/CollateralRegistry.sol";
import "./libraries/LoanCalculator.sol";
import "./storage/LoanStorage.sol";

contract LoanManager is ILoanManager, LoanStorage, ReentrancyGuard, Pausable {
    using CollateralUtils for uint256;

    IERC20 public usdtToken; // Mock USDT as the loan currency
    address public owner;

    uint256 public nativeUsdtPrice; // Manual Native Token/USDT price (e.g., 1 PHS = 0.05 USDT)
    uint8 public priceDecimals = 18; // Fixed decimals for manual price feed

    uint256 public collateralizationRatio = 120; // 120%
    uint256 public liquidationThreshold = 110; // 110%
    uint256 public loanCounter;
    uint256 public minLoanAmount = 10**18; // 1 USDT
    uint256 public maxLoanAmount = 100_000 * 10**18; // 100K USDT

    constructor(IERC20 _usdtToken, uint256 _initialNativeUsdtPrice) {
        usdtToken = _usdtToken;
        nativeUsdtPrice = _initialNativeUsdtPrice;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function updateNativeUsdtPrice(uint256 _newPrice) external onlyOwner {
        nativeUsdtPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    event PriceUpdated(uint256 newPrice);

    function getNativePrice() public view returns (uint256) {
        require(nativeUsdtPrice > 0, "Price not set");
        return nativeUsdtPrice;
    }

    function requestLoan(
        uint256 amount,
        uint256 maxInterestRate,
        uint256 duration
    ) external payable override whenNotPaused nonReentrant {
        require(amount >= minLoanAmount && amount <= maxLoanAmount, "Invalid loan amount");

        uint256 nativePrice = getNativePrice();
        uint256 requiredCollateral = amount.calculateRequiredCollateral(nativePrice, collateralizationRatio, priceDecimals);
        require(msg.value >= requiredCollateral, "Insufficient native token collateral");

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

        // Refund excess native token
        if (msg.value > requiredCollateral) {
            uint256 refund = msg.value - requiredCollateral;
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    function fundLoan(uint256 loanId) external whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];

        require(!status.active, "Loan already active");
        require(loan.lender == address(0), "Loan already funded");
        require(usdtToken.allowance(msg.sender, address(this)) >= loan.amount, "Insufficient allowance");

        require(usdtToken.transferFrom(msg.sender, address(this), loan.amount), "Transfer failed");

        loan.lender = msg.sender;
        status.startTime = block.timestamp;
        status.active = true;

        require(usdtToken.transfer(loan.borrower, loan.amount), "Loan disbursement failed");

        lenderLoans[msg.sender].push(loanId);
        borrowerLoans[loan.borrower].push(loanId);
        AllLoansID.push(loanId);

        emit LoanFunded(loanId, msg.sender);
        emit LoanDisbursed(loanId, loan.borrower, loan.amount);
    }

    function makePartialRepayment(uint256 loanId, uint256 amount) external override whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanInterest storage interest = loansInterest[loanId];

        require(status.active, "Loan not active");
        require(msg.sender == loan.borrower, "Not borrower");

        accrueInterest(loanId);

        uint256 totalInterest = interest.accruedInterest;
        uint256 totalRepayment = loan.amount + totalInterest - status.repaidAmount;

        require(amount <= totalRepayment, "Repayment exceeds owed amount");

        require(usdtToken.transferFrom(msg.sender, loan.lender, amount), "Partial repayment failed");

        status.repaidAmount += amount;

        if (status.repaidAmount >= totalRepayment) {
            status.repaid = true;
            status.active = false;
            returnCollateral(loanId);
        }

        emit PartialRepayment(loanId, msg.sender, amount);
    }

    function allowanceCaller() external view returns (uint256) {
        return usdtToken.allowance(msg.sender, address(this));
    }

    function accrueInterest(uint256 loanId) internal {
        LoanCore storage loan = loansCore[loanId];
        LoanInterest storage interest = loansInterest[loanId];
        LoanStatus storage status = loansStatus[loanId];

        require(status.active, "Loan not active");

        uint256 timeElapsed;
        if (interest.lastInterestAccrualTimestamp == 0) {
            timeElapsed = loan.duration;
        } else {
            timeElapsed = block.timestamp - interest.lastInterestAccrualTimestamp;
        }

        require(timeElapsed > 0, "No time elapsed for interest accrual");

        uint256 accrued = LoanCalculator.calculatePeriodicInterest(
            loan.amount,
            loan.interestRate,
            timeElapsed
        );

        interest.accruedInterest += accrued;
        interest.lastInterestAccrualTimestamp = block.timestamp;

        emit InterestAccrued(loanId, accrued);
    }

    function repayLoanWithReward(uint256 loanId) external whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanInterest storage interest = loansInterest[loanId];

        require(status.active, "Loan not active");
        require(msg.sender == loan.borrower, "Not borrower");

        accrueInterest(loanId);

        uint256 totalInterest = interest.accruedInterest;
        require(totalInterest > 0, "No interest accrued!");

        uint256 reward = (totalInterest * 20) / 100;
        uint256 lenderInterest = totalInterest - reward;

        interest.lastInterestAccrualTimestamp = block.timestamp;

        uint256 totalRepayment = loan.amount + totalInterest - status.repaidAmount;

        require(totalRepayment > loan.amount, "Interest not calculated");
        require(reward > 0, "No reward calculated");

        require(usdtToken.transferFrom(msg.sender, address(this), totalRepayment), "Transfer failed");

        uint256 amountToLender = loan.amount + lenderInterest;
        require(usdtToken.transfer(loan.lender, amountToLender), "Transfer to lender failed");

        status.repaidAmount += totalRepayment;
        status.active = false;
        status.repaid = true;
        status.defaulted = false;

        returnCollateral(loanId);

        emit LoanRepaid(loanId, msg.sender, totalRepayment);
        emit RewardCollected(loanId, reward);
    }

    function getTotalLoanPayment(uint256 loanId) public view returns (uint256 totalPayment, uint256 principal, uint256 interestAmount) {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanInterest storage interest = loansInterest[loanId];

        require(loan.amount > 0, "Loan does not exist");

        principal = loan.amount;

        if (!status.active && status.repaid) {
            return (status.repaidAmount, principal, status.repaidAmount - principal);
        }

        uint256 timeElapsed;
        if (status.active) {
            if (interest.lastInterestAccrualTimestamp == 0) {
                timeElapsed = block.timestamp - status.startTime;
            } else {
                timeElapsed = block.timestamp - interest.lastInterestAccrualTimestamp;
            }

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

    function liquidateOverdueLoan(uint256 loanId) external whenNotPaused nonReentrant {
        LoanCore storage loan = loansCore[loanId];
        LoanStatus storage status = loansStatus[loanId];
        LoanRequest storage request = loanRequests[loanId];

        require(status.active, "Loan not active");
        require(block.timestamp > request.dueDate, "Loan not overdue");
        require(!status.repaid, "Loan already repaid");

        (uint256 debt,,) = getTotalLoanPayment(loanId); // USDT owed
        uint256 collateralValue = (loan.collateral * nativeUsdtPrice) / (10 ** priceDecimals); // USDT value of native token
        require(debt > (collateralValue * liquidationThreshold) / 100, "Collateral still sufficient");

        transferCollateralToLender(loanId);

        status.active = false;
        status.defaulted = true;

        emit LoanLiquidated(loanId, loan.lender, loan.collateral);
    }

    function transferCollateralToLender(uint256 loanId) internal {
        LoanCore storage loan = loansCore[loanId];
        uint256 amount = loan.collateral;

        loan.collateral = 0;
        (bool success, ) = payable(loan.lender).call{value: amount}("");
        require(success, "Collateral transfer failed");
    }

    function returnCollateral(uint256 loanId) internal {
        LoanCore storage loan = loansCore[loanId];
        uint256 amount = loan.collateral;

        if (amount > 0) {
            loan.collateral = 0;
            (bool success, ) = payable(loan.borrower).call{value: amount}("");
            require(success, "Collateral return failed");
        }
    }

    function withdrawRewards(address _owner) external onlyOwner nonReentrant {
        uint256 contractBalance = usdtToken.balanceOf(address(this));
        require(contractBalance > 0, "No rewards to withdraw");

        require(usdtToken.transfer(_owner, contractBalance), "Reward withdrawal failed");

        emit RewardsWithdrawn(_owner, contractBalance);
    }

    function tryAutomaticMatch(uint256 loanId) internal {
        LoanRequest storage request = loanRequests[loanCounter];
        address bestLender;
        uint256 bestRate = type(uint256).max;

        for (uint256 i = 0; i < AllLoansID.length; i++) {
            address lender = address(uint160(AllLoansID[i]));
            if (lenderAvailableFunds[lender] >= request.amount) {
                uint256 offeredRate = getLenderOfferedRate(lender, request.amount);
                if (offeredRate <= request.maxInterestRate && offeredRate < bestRate) {
                    bestLender = lender;
                    bestRate = offeredRate;
                }
            }
        }

        if (bestLender != address(0)) {
            createMatchedLoan(loanId, bestLender, bestRate);
        }
    }

    function getRequiredCollateralAmount(uint256 loanAmount) external view returns (uint256) {
        uint256 nativePrice = getNativePrice();
        return loanAmount.calculateRequiredCollateral(nativePrice, collateralizationRatio, priceDecimals);
    }

    function getLenderOfferedRate(address lender, uint256 amount) internal view returns (uint256) {
        uint256 availableFunds = lenderAvailableFunds[lender];
        require(availableFunds >= amount, "Insufficient lender funds");

        uint256 utilizationRate = (amount * 100) / availableFunds;
        uint256 baseRate = 2;
        uint256 maxRate = 20;

        uint256 offeredRate = baseRate + ((utilizationRate * (maxRate - baseRate)) / 100);
        if (offeredRate > maxRate) {
            offeredRate = maxRate;
        }
        return offeredRate;
    }

    function createMatchedLoan(uint256 loanId, address lender, uint256 rate) internal {
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

    function updateLiquidationThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold >= 100, "Threshold too low");
        liquidationThreshold = newThreshold;
    }

    function setLoanLimits(uint256 _minLoanAmount, uint256 _maxLoanAmount) external onlyOwner {
        require(_minLoanAmount > 0, "Minimum loan amount must be greater than 0");
        require(_maxLoanAmount > _minLoanAmount, "Maximum loan amount must be greater than minimum loan amount");
        minLoanAmount = _minLoanAmount;
        maxLoanAmount = _maxLoanAmount;
    }

    function getAllLoanRequests() external view returns (LoanRequestDetail[] memory) {
        uint256 validCount = 0;
        for (uint256 i = 1; i <= loanCounter; i++) {
            LoanRequest memory request = loanRequests[i];
            if (request.amount > 0) {
                validCount++;
            }
        }

        LoanRequestDetail[] memory details = new LoanRequestDetail[](validCount);
        uint256 currentIndex = 0;

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