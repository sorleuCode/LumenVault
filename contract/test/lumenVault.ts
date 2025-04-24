import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LoanManager, MockUsdt } from "../typechain-types";
import { parseEther, parseUnits } from "ethers";

describe("LoanManager", function () {
  let loanManager: LoanManager;
  let usdtToken: MockUsdt;
  let owner: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;
  const initialNativeUsdtPrice = parseUnits("2000", 18); // 1 ETH = 2000 USDT
  const loanAmount = parseUnits("1000", 18); // 1000 USDT
  const maxInterestRate = 500; // 5%
  const duration = 30 * 24 * 60 * 60; // 30 days

  beforeEach(async function () {
    [owner, borrower, lender] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUsdt = await ethers.getContractFactory("MockUsdt");
    usdtToken = await MockUsdt.deploy();
    await usdtToken.waitForDeployment();

    // Deploy LoanManager
    const LoanManager = await ethers.getContractFactory("LoanManager");
    loanManager = await LoanManager.deploy(
      await usdtToken.getAddress(),
      initialNativeUsdtPrice
    );
    await loanManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await loanManager.owner()).to.equal(owner.address);
    });

    it("should set the correct USDT token", async function () {
      expect(await loanManager.usdtToken()).to.equal(
        await usdtToken.getAddress()
      );
    });

    it("should set the initial native USDT price", async function () {
      expect(await loanManager.getNativePrice()).to.equal(
        initialNativeUsdtPrice
      );
    });
  });

  describe("Loan Request", function () {
    it("should allow requesting a loan with sufficient collateral", async function () {
      const collateral = await loanManager.getRequiredCollateralAmount(
        loanAmount
      );
      await expect(
        loanManager
          .connect(borrower)
          .requestLoan(loanAmount, maxInterestRate, duration, {
            value: collateral,
          })
      )
        .to.emit(loanManager, "LoanRequested")
        .withArgs(
          1,
          borrower.address,
          loanAmount,
          collateral,
          maxInterestRate,
          duration
        );

      const loanCore = await loanManager.loansCore(1);
      expect(loanCore.borrower).to.equal(borrower.address);
      expect(loanCore.amount).to.equal(loanAmount);
      expect(loanCore.collateral).to.equal(collateral);
    });

    it("should revert if loan amount is below minimum", async function () {
      await expect(
        loanManager
          .connect(borrower)
          .requestLoan(parseUnits("0.5", 18), maxInterestRate, duration, {
            value: parseEther("1"),
          })
      ).to.be.revertedWith("Invalid loan amount");
    });

    it("should refund excess collateral", async function () {
      const collateral = await loanManager.getRequiredCollateralAmount(
        loanAmount
      );
      const excessCollateral = collateral + parseEther("1");
      const initialBalance = await ethers.provider.getBalance(borrower.address);

      await loanManager
        .connect(borrower)
        .requestLoan(loanAmount, maxInterestRate, duration, {
          value: excessCollateral,
        });

      const finalBalance = await ethers.provider.getBalance(borrower.address);
      expect(finalBalance).to.be.closeTo(
        initialBalance - collateral,
        parseEther("0.01")
      );
    });
  });

  describe("Loan Funding", function () {
    let loanId: number;
    beforeEach(async function () {
      const collateral = await loanManager.getRequiredCollateralAmount(
        loanAmount
      );
      await loanManager
        .connect(borrower)
        .requestLoan(loanAmount, maxInterestRate, duration, {
          value: collateral,
        });
      loanId = 1;

      // Mint USDT to lender
      await usdtToken.connect(lender).mint();
    });

    it("should allow funding a loan", async function () {
      await usdtToken
        .connect(lender)
        .approve(await loanManager.getAddress(), loanAmount);

      await expect(loanManager.connect(lender).fundLoan(loanId))
        .to.emit(loanManager, "LoanFunded")
        .withArgs(loanId, lender.address)
        .and.to.emit(loanManager, "LoanDisbursed")
        .withArgs(loanId, borrower.address, loanAmount);

      const loanCore = await loanManager.loansCore(loanId);
      expect(loanCore.lender).to.equal(lender.address);

      const loanStatus = await loanManager.loansStatus(loanId);
      expect(loanStatus.active).to.be.true;
    });

    it("should revert if insufficient allowance", async function () {
      await expect(
        loanManager.connect(lender).fundLoan(loanId)
      ).to.be.revertedWith("Insufficient allowance for this user");
    });
  });

  describe("Loan Repayment", function () {
    let loanId: number;
    beforeEach(async function () {
      const collateral = await loanManager.getRequiredCollateralAmount(
        loanAmount
      );
      await loanManager
        .connect(borrower)
        .requestLoan(loanAmount, maxInterestRate, duration, {
          value: collateral,
        });
      loanId = 1;

      await usdtToken.connect(lender).mint();
      await usdtToken
        .connect(lender)
        .approve(await loanManager.getAddress(), loanAmount);
      await loanManager.connect(lender).fundLoan(loanId);

      await usdtToken.connect(borrower).mint();
      await usdtToken
        .connect(borrower)
        .approve(await loanManager.getAddress(), parseUnits("2000", 18));

      // Fast forward time to accrue interest
      await network.provider.send("evm_increaseTime", [duration / 2]);
      await network.provider.send("evm_mine");
    });

    it("should allow partial repayment", async function () {
      const repaymentAmount = parseUnits("500", 18);
      await expect(
        loanManager
          .connect(borrower)
          .makePartialRepayment(loanId, repaymentAmount)
      )
        .to.emit(loanManager, "PartialRepayment")
        .withArgs(loanId, borrower.address, repaymentAmount);

      const loanStatus = await loanManager.loansStatus(loanId);
      expect(loanStatus.repaidAmount).to.equal(repaymentAmount);
    });

    it("should allow full repayment with reward", async function () {
      const initialCollateral = (await loanManager.loansCore(loanId)).collateral;
      const initialBorrowerBalance = await ethers.provider.getBalance(
        borrower.address
      );

      await expect(loanManager.connect(borrower).repayLoanWithReward(loanId))
        .to.emit(loanManager, "LoanRepaid")
        .and.to.emit(loanManager, "RewardCollected");

      const loanStatus = await loanManager.loansStatus(loanId);
      expect(loanStatus.repaid).to.be.true;
      expect(loanStatus.active).to.be.false;

      // Check collateral returned
      const finalBorrowerBalance = await ethers.provider.getBalance(
        borrower.address
      );
      expect(finalBorrowerBalance).to.be.closeTo(
        initialBorrowerBalance + initialCollateral,
        parseEther("0.01")
      );
    });
  });

  describe("Loan Liquidation", function () {
    let loanId: number;
    beforeEach(async function () {
      const collateral = await loanManager.getRequiredCollateralAmount(
        loanAmount
      );
      await loanManager
        .connect(borrower)
        .requestLoan(loanAmount, maxInterestRate, duration, {
          value: collateral,
        });
      loanId = 1;

      await usdtToken.connect(lender).mint();
      await usdtToken
        .connect(lender)
        .approve(await loanManager.getAddress(), loanAmount);
      await loanManager.connect(lender).fundLoan(loanId);
    });

    it("should allow liquidation of overdue loan with insufficient collateral", async function () {
      // Fast forward past due date
      await network.provider.send("evm_increaseTime", [duration + 86400]);
      await network.provider.send("evm_mine");

      // Update price to make collateral insufficient
      await loanManager
        .connect(owner)
        .updateNativeUsdtPrice(parseUnits("5000", 18)); // 1 ETH = 5000 USDT

      const initialLenderBalance = await ethers.provider.getBalance(
        lender.address
      );
      await expect(loanManager.liquidateOverdueLoan(loanId))
        .to.emit(loanManager, "LoanLiquidated")
        .withArgs(loanId, lender.address, (await loanManager.loansCore(loanId)).collateral);

      const loanStatus = await loanManager.loansStatus(loanId);
      expect(loanStatus.defaulted).to.be.true;
      expect(loanStatus.active).to.be.false;

      // Check collateral transferred to lender
      const finalLenderBalance = await ethers.provider.getBalance(lender.address);
      expect(finalLenderBalance).to.be.gt(initialLenderBalance);
    });
  });

  describe("Owner Functions", function () {
    it("should allow owner to update collateralization ratio", async function () {
      await loanManager.connect(owner).updateCollateralizationRatio(130);
      expect(await loanManager.collateralizationRatio()).to.equal(130);
    });

    it("should allow owner to withdraw rewards", async function () {
      // Fund contract with some USDT
      await usdtToken.connect(owner).mint();

      const initialBalance = await usdtToken.balanceOf(owner.address);
      await expect(loanManager.connect(owner).withdrawRewards(owner.address))
        .to.emit(loanManager, "RewardsWithdrawn")
        .withArgs(owner.address, parseUnits("100", 18));

      expect(await usdtToken.balanceOf(owner.address)).to.equal(
        initialBalance + parseUnits("100", 18)
      );
    });
  });
});