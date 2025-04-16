import { createContext, useCallback, useContext, useEffect, useState } from "react";
import useContractInstance from "../hooks/useContractInstance";
import { formatUnits, formatEther, Contract, keccak256, toUtf8Bytes } from "ethers";
import { readOnlyProvider } from "../constants/readOnlyProvider";
import lumenVaultABI from "../ABI/lumenVault.json";

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
            console.error("Error fetching Loans:", error);
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
            dueDateTimestamp: Number(duration) * 1000,
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

    // Poll for events
    useEffect(() => {
        const contract = new Contract(
            import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS,
            lumenVaultABI,
            readOnlyProvider
        );

        // Define event topics (keccak256 hash of event signatures)
        const eventTopics = {
            LoanRequested: keccak256(toUtf8Bytes("LoanRequested(uint256,address,uint256,uint256,uint256,uint256)")),
            LoanFunded: keccak256(toUtf8Bytes("LoanFunded(uint256)")),
            LoanRepaid: keccak256(toUtf8Bytes("LoanRepaid(uint256)"))
        };

        // Polling function
        const pollEvents = async () => {
            try {
                // Fetch logs for each event
                for (const [eventName, topic] of Object.entries(eventTopics)) {
                    const filter = {
                        address: import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS,
                        topics: [topic],
                        fromBlock: 'latest',
                        toBlock: 'latest'
                    };
                    const logs = await readOnlyProvider.getLogs(filter);
                    logs.forEach(log => {
                        try {
                            const parsedLog = contract.interface.parseLog(log);
                            if (eventName === "LoanRequested") {
                                handleLoanRequested(
                                    parsedLog.args.loanId,
                                    parsedLog.args.borrower,
                                    parsedLog.args.amount,
                                    parsedLog.args.collateral,
                                    parsedLog.args.maxInterestRate,
                                    parsedLog.args.duration
                                );
                            } else if (eventName === "LoanFunded") {
                                handleLoanFunded(parsedLog.args.loanId);
                            } else if (eventName === "LoanRepaid") {
                                handleLoanRepaid(parsedLog.args.loanId);
                            }
                        } catch (parseError) {
                            console.error(`Error parsing log for ${eventName}:`, parseError);
                        }
                    });
                }
            } catch (error) {
                console.error("Error polling events:", error);
                if (error.code === -32601) {
                    console.error("RPC method not supported:", error.message);
                }
            }
        };

        // Poll every 10 seconds
        const intervalId = setInterval(pollEvents, 10000);
        pollEvents(); // Initial call

        // Cleanup
        return () => clearInterval(intervalId);
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