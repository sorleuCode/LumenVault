import { createContext, useCallback, useContext, useEffect, useState } from "react";
import useContractInstance from "../hooks/useContractInstance";
import { formatUnits, formatEther, Contract } from "ethers";
import { readOnlyProvider } from "../constants/readOnlyProvider";
import lendLinkABI from "../ABI/lendLink.json";

const loanContext = createContext({
    loanRequests: []
});

export const LoanContextProvider = ({ children }) => {
    const [loanRequests, setLoanRequests] = useState([]);
    const readOnlyTodoContract = useContractInstance();

    const formatLoanRequest = (loan) => {
        const dueDate = new Date(Number(loan.dueDate) * 1000).toLocaleString();
        const durationInDays = Math.floor(Number(loan.duration) / (60 * 60 * 24));
        const loanId = Number(loan.loanId);

        return {
            loanId: loanId,
            borrower: String(loan.borrower),
            amount: formatUnits(loan.amount, 18, 3),
            maxInterestRate: (Number(loan.maxInterestRate) / 100).toFixed(2),
            dueDate: dueDate,
            duration: durationInDays > 0 ? durationInDays : Math.floor(Number(loan.duration) / (60 * 60)),
            collateralAmount: formatEther(loan.collateralAmount, 18, 3).toLocaleString(),
            isActive: Boolean(loan.isActive),
            hasRepaid: Boolean(loan.hasRepaid),
            collateralRatio: "120",
            isDays: durationInDays > 0 ? true : false
        };
    };

    const getLoanRequests = useCallback(async () => {
        if (!readOnlyTodoContract) return;

        try {
            const data = await readOnlyTodoContract.getAllLoanRequests();
            const formattedLoanRequests = data.map(formatLoanRequest);
            setLoanRequests(formattedLoanRequests);
        } catch (error) {
            console.log("Error fetching Loans", error);
        }
    }, [readOnlyTodoContract]);

    useEffect(() => {
        getLoanRequests();
    }, [getLoanRequests]);

    // Event Handlers
    const handleLoanRequested = useCallback((loanId, borrower, amount, collateral, maxInterestRate, duration) => {
        const newLoan = {
            loanId: Number(loanId),
            borrower: String(borrower),
            amount: formatUnits(amount, 18, 3),
            maxInterestRate: (Number(maxInterestRate) / 100).toFixed(2),
            dueDate: new Date(Date.now() + Number(duration) * 1000).toLocaleString(),
            duration: Math.floor(Number(duration) / (60 * 60 * 24)) || Math.floor(Number(duration) / (60 * 60)),
            collateralAmount: formatEther(collateral, 18, 3).toLocaleString(),
            isActive: false,
            hasRepaid: false,
            collateralRatio: "120",
            dueDateTimestamp: Number(loan.dueDate) * 1000, // Add timestamp for comparison
            isDays: Number(duration) >= 86400 // 24 hours in seconds
        };

        setLoanRequests(prev => [...prev, newLoan]);
    }, []);

    const handleLoanFunded = useCallback((loanId) => {
        setLoanRequests(prev => prev.map(loan => 
            Number(loan.loanId) === Number(loanId) 
                ? { ...loan, isActive: true }
                : loan
        ));
    }, []);

    const handleLoanRepaid = useCallback((loanId) => {
        setLoanRequests(prev => prev.map(loan => 
            Number(loan.loanId) === Number(loanId)
                ? { ...loan, hasRepaid: true, isActive: false }
                : loan
        ));
    }, []);



    // Set up event listeners
    useEffect(() => {
        const contract = new Contract(
            import.meta.env.VITE_LEND_LINK_CONTRACT_ADDRESS,
            lendLinkABI,
            readOnlyProvider
        );

        contract.on("LoanRequested", handleLoanRequested);
        contract.on("LoanFunded", handleLoanFunded);
        contract.on("LoanRepaid", handleLoanRepaid);

        return () => {
            contract.off("LoanRequested", handleLoanRequested);
            contract.off("LoanFunded", handleLoanFunded);
            contract.off("LoanRepaid", handleLoanRepaid);
        };
    }, [handleLoanRequested, handleLoanFunded, handleLoanRepaid]);

    return (
        <loanContext.Provider value={{ loanRequests }}>
            {children}
        </loanContext.Provider>
    );
};

export const useLoanRequests = () => {
    const context = useContext(loanContext);
    return context;
};