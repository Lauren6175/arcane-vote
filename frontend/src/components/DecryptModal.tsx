import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { X, Unlock, Lock, TrendingUp } from "lucide-react";
import { Poll } from "./PollCard";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { ethers } from "ethers";

interface DecryptModalProps {
  isOpen: boolean;
  poll: Poll | null;
  onClose: () => void;
}

interface VoteResult {
  option: string;
  count: number;
  percentage: number;
}

export function DecryptModal({ isOpen, poll, onClose }: DecryptModalProps) {
  const { address } = useAccount();
  const [results, setResults] = useState<VoteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptionRequested, setDecryptionRequested] = useState(false);

  // Check if user is authorized decryptor
  const { data: isAuthorized } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "isAuthorizedDecryptor",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  });

  // Check if poll is already decrypted
  const { data: isAlreadyDecrypted, refetch: refetchDecryptStatus } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "isDecrypted",
    args: poll ? [BigInt(poll.id)] : undefined,
    query: {
      refetchInterval: false, // Disable auto-polling
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  });

  // Write contract hook for requesting decryption
  const { data: hash, writeContract, isPending: isRequestingDecryption } = useWriteContract();

  // Wait for transaction confirmation
  const { isSuccess: isDecryptionConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Request decryption transaction
  const requestDecryption = useCallback(async () => {
    if (!poll) return;

    console.log("🔐 Requesting decryption transaction for poll:", poll.id);
    setError(null);

    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "requestDecryption",
        args: [BigInt(poll.id)],
      });
    } catch (err) {
      console.error("Error requesting decryption:", err);
      setError("Failed to request decryption. Please try again.");
    }
  }, [poll, writeContract]);

  // Read results after decryption is confirmed
  const readResults = useCallback(async () => {
    if (!poll) {
      console.log("No poll provided");
      return;
    }

    console.log("📊 Reading decrypted results for poll:", poll.id);
    setIsLoading(true);
    setError(null);

    try {
      // Add minimum loading time to make it visible
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
      
      const decryptedResults: VoteResult[] = [];
      let totalVotes = 0;

      // Use ethers to read vote counts
      if (window.ethereum) {
        console.log("📡 Creating provider and contract...");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        console.log("📊 Reading votes for", poll.options.length, "options");

        // Read vote counts for each option
        for (let i = 0; i < poll.options.length; i++) {
          try {
            console.log(`Reading votes for option ${i}: ${poll.options[i]}`);
            const count = await contract.getVoteCount(BigInt(poll.id), BigInt(i));
            const countNumber = Number(count);
            console.log(`Option ${i} has ${countNumber} votes`);
            totalVotes += countNumber;

            decryptedResults.push({
              option: poll.options[i],
              count: countNumber,
              percentage: 0, // Will calculate after we have total
            });
          } catch (err) {
            console.error(`Error reading option ${i}:`, err);
            decryptedResults.push({
              option: poll.options[i],
              count: 0,
              percentage: 0,
            });
          }
        }

        console.log("📊 Total votes:", totalVotes);

        // Wait for minimum loading time
        await minLoadingTime;

        // Calculate percentages
        decryptedResults.forEach((result) => {
          result.percentage = totalVotes > 0 ? Math.round((result.count / totalVotes) * 100) : 0;
        });

        console.log("✅ Decryption complete:", decryptedResults);
        setResults(decryptedResults);
      } else {
        console.error("MetaMask not found");
        setError("MetaMask not found. Please install MetaMask to decrypt results.");
      }
    } catch (err) {
      console.error("Error reading results:", err);
      setError("Failed to read results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [poll]);

  // When modal opens, check if already decrypted or request decryption
  useEffect(() => {
    if (isOpen && poll) {
      // Refetch decryption status first
      refetchDecryptStatus().then(() => {
        if (!decryptionRequested) {
          if (isAlreadyDecrypted) {
            console.log("✅ Poll already decrypted, reading results directly");
            setDecryptionRequested(true);
            readResults();
          } else {
            console.log("🔓 Modal not yet decrypted, requesting decryption transaction");
            setDecryptionRequested(true);
            requestDecryption();
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, poll]); // Intentionally limited dependencies to prevent re-triggering

  // When decryption is confirmed, refetch status and read results
  useEffect(() => {
    if (isDecryptionConfirmed && poll) {
      console.log("✅ Decryption confirmed, refetching status and reading results");
      refetchDecryptStatus().then(() => {
        console.log("🔄 Status refetched, isDecrypted:", isAlreadyDecrypted);
        readResults();
      });
    }
  }, [isDecryptionConfirmed, poll, readResults, refetchDecryptStatus, isAlreadyDecrypted]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDecryptionRequested(false);
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !poll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-primary" />
                Decrypt Results
              </CardTitle>
              <CardDescription>{poll.title}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authorization Status */}
          <div className={`p-4 rounded-lg border ${isAuthorized ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"}`}>
            <div className="flex items-start gap-3">
              <Lock className={`h-5 w-5 mt-0.5 ${isAuthorized ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`} />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">
                  {isAuthorized ? "✓ Authorized Decryptor" : "⚠ Limited Access"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isAuthorized
                    ? "You have permission to view the decrypted voting results."
                    : "You can view results, but you may not have full decryption permissions."}
                </p>
              </div>
            </div>
          </div>

          {/* Poll Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Voters:</span>
              <span className="font-medium">{poll.totalVoters}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium ${poll.isActive ? "text-green-600" : "text-gray-600"}`}>
                {poll.isActive ? "Active" : "Closed"}
              </span>
            </div>
          </div>

          {/* Results */}
          {isRequestingDecryption ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">🔐 Requesting decryption...</p>
              <p className="text-xs text-muted-foreground">Please confirm the transaction in MetaMask</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">📊 Reading results...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <Button className="mt-4" variant="outline" size="sm" onClick={() => {
                setError(null);
                setDecryptionRequested(false);
                requestDecryption();
              }}>
                Try Again
              </Button>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-primary" />
                Vote Distribution
              </div>
              {results
                .sort((a, b) => b.count - a.count)
                .map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        {index === 0 && result.count > 0 && (
                          <span className="text-xl">🏆</span>
                        )}
                        {result.option}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {result.count} votes ({result.percentage}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full arcane-gradient transition-all duration-500"
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              {poll.totalVoters === 0 && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 No votes yet. All options are currently at 0 votes. Share this poll to start collecting votes!
                  </p>
                </div>
              )}
            </div>
          ) : !decryptionRequested ? (
            <div className="p-6 rounded-lg border border-dashed border-muted text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Click to request decryption</p>
              <Button size="sm" onClick={() => {
                setDecryptionRequested(true);
                requestDecryption();
              }}>
                Request Decryption
              </Button>
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-muted text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Waiting for confirmation...</p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">🔐 Privacy Notice</h4>
            <p className="text-xs text-muted-foreground">
              These results show aggregated vote counts. Individual votes remain encrypted and anonymous.
              Only authorized personnel can decrypt and view these results.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={async () => {
                console.log("🔄 Refresh button clicked");
                // Always refetch status first
                const { data } = await refetchDecryptStatus();
                console.log("Current decryption status:", data);
                
                if (data) {
                  // Already decrypted, just read results
                  console.log("✅ Already decrypted, reading results");
                  readResults();
                } else {
                  // Not yet decrypted, request decryption
                  console.log("🔐 Not decrypted, requesting decryption");
                  setError(null);
                  setDecryptionRequested(false);
                  requestDecryption();
                }
              }} 
              disabled={isRequestingDecryption || isLoading}
            >
              {isRequestingDecryption ? "Requesting..." : isLoading ? "Loading..." : "Refresh Results"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

