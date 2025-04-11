import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";

const ScrollButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop;
      setVisible(scrolled > 300);
    };

    window.addEventListener("scroll", toggleVisible);
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed right-8 bottom-8 flex flex-col gap-2">
      <button
        onClick={scrollToTop}
        className={`${
          visible ? "opacity-100" : "opacity-0"
        } bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-all duration-300`}
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>
      <button
        onClick={scrollToBottom}
        className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full"
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </div>
  );
};

const NavItem = ({
  title,
  children,
  isOpen,
  onToggle,
  onItemClick,
  selectedItem,
}) => {
  return (
    <div className="text-gray-400">
      <div
        className="flex items-center cursor-pointer py-2 px-4 hover:text-gray-200 transition-colors duration-150 ease-in-out"
        onClick={children ? onToggle : () => onItemClick(title)}
      >
        {children && (
          <span className="mr-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        <span
          className={`${selectedItem === title ? "text-white" : ""} text-sm`}
        >
          {title}
        </span>
      </div>
      {isOpen && children && <div className="ml-4">{children}</div>}
    </div>
  );
};

const Documentation = () => {
  const [openIntroduction, setOpenIntroduction] = useState(true);
  const [openGettingStarted, setOpenGettingStarted] = useState(false);
  const [openPlatformOverview, setOpenPlatformOverview] = useState(false);
  const [openLendingOnLendlink, setOpenLendingOnLendlink] = useState(false);
  const [openBorrowingOnLendlink, setOpenBorrowingOnLendlink] = useState(false);
  const [selectedItem, setSelectedItem] = useState("Overview");
  const [activeSection, setActiveSection] = useState("");

  const navigationOrder = [
    "Overview",
    "Core Features",
    "Supported Assets",
    "Long-term Goals",
    "How to Join",
    "Managing Lending Pools",
    "Creating a Borrow Order",
    "Depositing Collateral",
    "Loan-to-Value (LTV) Ratios",
    "Repayment Process",
    "Contact and Support",
  ];

  const handlePrevious = () => {
    const currentIndex = navigationOrder.indexOf(selectedItem);
    if (currentIndex > 0) {
      setSelectedItem(navigationOrder[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = navigationOrder.indexOf(selectedItem);
    if (currentIndex < navigationOrder.length - 1) {
      setSelectedItem(navigationOrder[currentIndex + 1]);
    }
  };

  const isFirstItem = selectedItem === navigationOrder[0];
  const isLastItem =
    selectedItem === navigationOrder[navigationOrder.length - 1];

  const handleItemClick = (title) => {
    setSelectedItem(title);

    if (
      [
        "Overview",
        "Core Features",
        "Supported Assets",
        "Long-term Goals",
      ].includes(title)
    ) {
      setActiveSection("Introduction");
    } else if (["How to Join"].includes(title)) {
      setActiveSection("Getting Started");
    } else if (["Managing Lending Pools"].includes(title)) {
      setActiveSection("Lending on LENDLINK");
    } else if (
      [
        "Creating a Borrow Order",
        "Depositing Collateral",
        "Loan-to-Value (LTV) Ratios",
        "Repayment Process",
      ].includes(title)
    ) {
      setActiveSection("Borrowing on LENDLINK");
    } else if (["Contact and Support"].includes(title)) {
      setActiveSection("Contact and Support");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <div className="flex pt-14">
        <div className="fixed w-64 top-14 bottom-0 bg-[#121212] border-r border-gray-800 md:block hidden">
          <div className="h-full overflow-y-auto">
            <div className="py-6">
              {/* Introduction Section */}
              <NavItem
                title="Introduction"
                isOpen={openIntroduction}
                onToggle={() => setOpenIntroduction(!openIntroduction)}
              >
                <NavItem
                  title="Overview"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
                <NavItem
                  title="Core Features"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
                <NavItem
                  title="Supported Assets"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
                <NavItem
                  title="Long-term Goals"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
              </NavItem>

              {/* Getting Started Section */}
              <NavItem
                title="Getting Started"
                isOpen={openGettingStarted}
                onToggle={() => setOpenGettingStarted(!openGettingStarted)}
              >
                <NavItem
                  title="Platform Overview"
                  isOpen={openPlatformOverview}
                  onToggle={() =>
                    setOpenPlatformOverview(!openPlatformOverview)
                  }
                >
                  <NavItem
                    title="How to Join"
                    onItemClick={handleItemClick}
                    selectedItem={selectedItem}
                  />
                </NavItem>
              </NavItem>

              {/* Lending on LENDLINK */}
              <NavItem
                title="Lending on LENDLINK"
                isOpen={openLendingOnLendlink}
                onToggle={() =>
                  setOpenLendingOnLendlink(!openLendingOnLendlink)
                }
              >
                <NavItem
                  title="Managing Lending Pools"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
              </NavItem>

              {/* Borrowing on LENDLINK */}
              <NavItem
                title="Borrowing on LENDLINK"
                isOpen={openBorrowingOnLendlink}
                onToggle={() =>
                  setOpenBorrowingOnLendlink(!openBorrowingOnLendlink)
                }
              >
                <NavItem
                  title="Creating a Borrow Order"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
                <NavItem
                  title="Depositing Collateral"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
                <NavItem
                  title="Loan-to-Value (LTV) Ratios"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
                <NavItem
                  title="Repayment Process"
                  onItemClick={handleItemClick}
                  selectedItem={selectedItem}
                />
              </NavItem>

              {/* Contact and Support */}
              <NavItem
                title="Contact and Support"
                isOpen={openGettingStarted}
                onToggle={() => setOpenGettingStarted(!openGettingStarted)}
                onItemClick={handleItemClick}
                selectedItem={selectedItem}
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="md:ml-64 flex-1">
          <div className="max-w-4xl mx-auto p-8">
            <div className="space-y-6">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-4">
                {activeSection}
              </div>
              <h1 className="text-4xl font-bold text-white mb-8">
                {selectedItem}
              </h1>

              {/* Content for each selected item */}
              {selectedItem === "Overview" && (
                <div className="space-y-6">
                  <p className="text-gray-300 leading-relaxed">
                    <strong>LENDLINK</strong> is a decentralized platform
                    leveraging blockchain technology to revolutionize
                    small-scale lending. Designed for individuals and
                    businesses, it offers secure, transparent, and inclusive
                    peer-to-peer micro-loans while addressing the inefficiencies
                    of traditional lending systems. Borrowers can seamlessly
                    request loans, and lenders can earn interest, all within a
                    trustless ecosystem powered by smart contracts. The platform
                    ensures fast, cost-effective transactions and a
                    user-friendly interface that simplifies loan requests,
                    approvals, repayments, and interest calculations.
                  </p>
                </div>
              )}

              {selectedItem === "Core Features" && (
                <div className="space-y-6">
                  <ul className="list-disc pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      <b>Collateralized Loans with ETH:</b> Borrowers can
                      request loans by depositing Ether (ETH) as collateral. The
                      loan amount is determined based on the collateral value
                      and a predefined collateralization ratio.
                    </li>
                    <li>
                      <b>Dynamic Interest Rates:</b> Interest rates are
                      dynamically calculated based on lender availability and
                      loan utilization rates, ensuring competitive and fair
                      rates for both borrowers and lenders.
                    </li>
                    <li>
                      <b>Automatic Loan Matching:</b> The platform automatically
                      matches borrowers with suitable lenders based on loan
                      amount, interest rate, and lender availability,
                      streamlining the lending process.
                    </li>
                    <li>
                      <b>Loan Liquidation for Overdue Loans:</b> Loans that
                      exceed their due date are automatically liquidated, with
                      the collateral transferred to the lender to mitigate risk.
                    </li>
                    <li>
                      <b>Flexible Loan Terms:</b> Borrowers can specify loan
                      amounts, durations, and maximum interest rates, while
                      lenders can fund loans that meet their criteria.
                    </li>
                    <li>
                      <b>Health Factor Monitoring:</b> The platform continuously
                      monitors the health of loans, ensuring that
                      collateralization ratios and liquidation thresholds are
                      maintained to protect lenders.
                    </li>
                    <li>
                      <b>Transparent Loan Management:</b> Borrowers and lenders
                      can view all active and historical loans, including
                      details such as loan amounts, interest rates, collateral,
                      and repayment status.
                    </li>
                  </ul>
                </div>
              )}

              {selectedItem === "Supported Assets" && (
                <div className="space-y-6">
                  <p>
                    Currently, <strong>LENDLINK</strong> operates on the{" "}
                    <strong>Base Sepolia</strong> test network, supporting{" "}
                    <strong>Ethereum ETH and Chainlink LINK</strong> as the
                    primary assets. ETH is used as collateral for loans, while
                    LINK is used as the loan currency. Plans to introduce
                    additional assets (e.g., other ERC-20 tokens) and expand
                    network support (e.g., Layer 2 solutions or other
                    EVM-compatible chains) are in the roadmap.
                  </p>
                </div>
              )}

              {selectedItem === "Long-term Goals" && (
                <div className="space-y-6">
                  <p>
                    One of the long-term objectives of <strong>LENDLINK</strong>{" "}
                    is to build a decentralized credit reputation system using
                    on-chain loan history and borrower behavior. This
                    transparent, trustless credit scoring mechanism will help
                    users access better loan terms, higher borrowing limits, and
                    broader DeFi opportunities.
                  </p>
                </div>
              )}

              {selectedItem === "How to Join" && (
                <div className="space-y-6">
                  <ol className="list-decimal pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      <b>Connect Your Wallet:</b> Start by connecting your
                      Ethereum-compatible wallet (e.g., MetaMask) to the
                      platform. This wallet will be used for secure
                      transactions, managing funds, and interacting with the
                      smart contract.
                    </li>
                    <li>
                      <b>Choose Your Role:</b> Decide whether you want to act as
                      a borrower or a lender. Borrowers can request loans by
                      depositing collateral, while lenders can fund loans and
                      earn interest.
                    </li>
                    <li>
                      <b>Deposit Collateral (For Borrowers):</b> If you're a
                      borrower, deposit Ethereum (ETH) as collateral to secure
                      your loan. The required collateral amount is calculated
                      based on the loan amount and the platform's
                      collateralization ratio.
                    </li>
                    <li>
                      <b>Request or Fund a Loan:</b>
                      <ul className="list-disc pl-5 px-6 text-gray-300 leading-relaxed space-y-4">
                        <li>
                          Borrowers: Submit a loan request by specifying the
                          loan amount, maximum interest rate, and repayment
                          duration. The platform will automatically match your
                          request with a suitable lender.
                        </li>
                        <li>
                          Lenders: Browse available loan requests or create your
                          own lending terms. Fund loans using Chainlink (LINK)
                          tokens to earn interest.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <b>Repay or Liquidate:</b>
                      <ul className="list-disc pl-5 px-6 text-gray-300 leading-relaxed space-y-4">
                        <li>
                          Borrowers: Repay your loan (with interest) by the due
                          date to reclaim your collateral. Timely repayments may
                          also earn you rewards.
                        </li>
                        <li>
                          Lenders: In case of overdue loans, the platform will
                          automatically liquidate the collateral to protect your
                          funds.
                        </li>
                      </ul>
                    </li>
                  </ol>
                </div>
              )}

              {selectedItem === "Managing Lending Pools" && (
                <div className="space-y-6">
                  <ol className="list-decimal pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      <b>Monitor Repayments:</b> As borrowers repay their loans,
                      the platform will automatically distribute repayments
                      (principal + interest) to your wallet. You can track
                      repayment schedules, interest earned, and overdue loans in
                      real-time through your dashboard.
                    </li>
                    <li>
                      <b>Liquidate Overdue Loans:</b> In case of overdue loans,
                      the platform will automatically liquidate the borrower's
                      collateral to protect your funds. You can view the status
                      of liquidated loans and the collateral recovered.
                    </li>
                  </ol>
                </div>
              )}

              {selectedItem === "Creating a Borrow Order" && (
                <div className="space-y-6">
                  <ol className="list-decimal pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      <b>Connect Your Wallet:</b> Start by connecting your
                      Ethereum-compatible wallet (e.g., MetaMask) to the
                      platform. This wallet will be used for secure
                      transactions, managing funds, and interacting with the
                      smart contract.
                    </li>
                    <li>
                      <b>Deposit Collateral:</b> Deposit Ethereum (ETH) as
                      collateral to secure your loan. The required collateral
                      amount is calculated based on the loan amount and the
                      platform’s collateralization ratio.
                    </li>
                    <li>
                      <b>Set Up Your Borrow Order:</b> Specify the loan amount,
                      maximum interest rate, and repayment duration.
                    </li>
                    <li>
                      <b>Submit Your Order:</b> Once submitted, the platform
                      will automatically match your request with a suitable
                      lender.
                    </li>
                  </ol>
                </div>
              )}

              {selectedItem === "Depositing Collateral" && (
                <div className="space-y-6">
                  <p>
                    <strong>LENDLINK</strong> requires borrowers to deposit
                    collateral to secure their loans, ensuring lender protection
                    in case of non-repayment.
                  </p>
                  <ul className="list-disc pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      <strong>Supported Collateral:</strong> Sepolia ETH (for
                      collateral deposit).
                    </li>
                    <li>
                      <strong> Collateral Deposit Process:</strong> After
                      creating a borrow order, deposit the required collateral
                      via your Smart Wallet. The platform automatically
                      calculates the required collateral based on the loan
                      amount and collateralization ratio, ensuring you meet the
                      necessary threshold to secure the loan.
                    </li>
                  </ul>
                </div>
              )}

              {selectedItem === "Loan-to-Value (LTV) Ratios" && (
                <div className="space-y-6">
                  <h2>
                    The Loan-to-Value (LTV) ratio determines the amount you can
                    borrow based on the value of the collateral you provide.
                  </h2>
                  <h2>
                    Collateralization Ratio: Currently set at 120%. This means
                    borrowers must deposit collateral worth 120% of the loan
                    amount.
                  </h2>

                  <ul className="list-disc pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      For example, if you request a loan of 1,000 LINK tokens
                      (worth $1,000), you will need to deposit at least $1,200
                      worth of collateral (ETH). Maintaining a Healthy LTV
                    </li>
                    <h1 className="text-2xl font-bold text-white mb-8">
                      Maintaining a Healthy LTV
                    </h1>
                    <li>
                      <stong> Liquidation Threshold:</stong> If the value of
                      your collateral falls below 110% of the loan amount, your
                      loan may be liquidated to protect the lender.
                    </li>
                    <li>
                      To avoid liquidation, ensure the value of your collateral
                      remains sufficient to cover the loan amount.
                    </li>
                  </ul>
                </div>
              )}

              {selectedItem === "Repayment Process" && (
                <div className="space-y-6">
                  <p>
                    Repaying your loan on <strong>LENDLINK</strong> is simple:
                  </p>

                  <ul className="list-disc pl-5 text-gray-300 leading-relaxed space-y-4">
                    <li>
                      Manual Repayment: You can repay the loan early, including
                      partial repayments, to reduce interest or avoid
                      liquidation risks. Repayments are made in LINK.
                    </li>
                    <li>
                      Collateral Return: Once your loan is fully repaid,
                      including the principal and interest, your collateral
                      (ETH) will be automatically returned. The collateral can
                      then be used for future loans, or withdrawn.
                    </li>
                  </ul>
                </div>
              )}

              {selectedItem === "Contact and Support" && (
                <div className="space-y-6">
                  <p>
                    Information on how to contact LENDLINK support team and
                    engage with the community for assistance and discussions.
                  </p>
                  <h3 className="text-2xl font-bold text-white mb-8">
                    Support Channels
                  </h3>
                  <p>
                    If you need assistance or have questions about using the
                    LENDLINK platform, our support team is here to help. Whether
                    you have technical issues, need guidance on lending or
                    borrowing, or want to learn more about platform features,
                    our dedicated team is available to provide the support you
                    need.
                  </p>

                  <li>
                    <strong>Support:</strong> support@lendlink.com
                  </li>
                </div>
              )}

              <div className="mt-12 flex justify-between border-t border-gray-800 pt-4">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstItem}
                  className={`flex items-center ${
                    isFirstItem
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white"
                  } transition-colors`}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLastItem}
                  className={`flex items-center ${
                    isLastItem
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white"
                  } transition-colors`}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollButton />
    </div>
  );
};

export default Documentation;