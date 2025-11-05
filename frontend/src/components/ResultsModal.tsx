import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { X, Lock, Users, TrendingUp } from "lucide-react";
import { Poll } from "./PollCard";
import { formatDate } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { ethers } from "ethers";

interface ResultsModalProps {
  isOpen: boolean;
  poll: Poll | null;
  onClose: () => void;
}

interface VoteResult {
  option: string;
  count: number;
  percentage: number;
}

export function ResultsModal({ isOpen, poll, onClose }: ResultsModalProps) {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if poll is already decrypted
  const { data: isDecrypted, refetch: refetchDecryptStatus } = useReadContract({
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

  // Read results if poll is decrypted
  const readResults = useCallback(async () => {
    if (!poll || !isDecrypted) return;

    console.log("📊 Reading results for poll:", poll.id);
    setIsLoading(true);

    try {
      const decryptedResults: VoteResult[] = [];
      let totalVotes = 0;

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        for (let i = 0; i < poll.options.length; i++) {
          try {
            const count = await contract.getVoteCount(BigInt(poll.id), BigInt(i));
            const countNumber = Number(count);
            totalVotes += countNumber;

            decryptedResults.push({
              option: poll.options[i],
              count: countNumber,
              percentage: 0,
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

        // Calculate percentages
        decryptedResults.forEach((result) => {
          result.percentage = totalVotes > 0 ? Math.round((result.count / totalVotes) * 100) : 0;
        });

        setResults(decryptedResults);
      }
    } catch (err) {
      console.error("Error reading results:", err);
    } finally {
      setIsLoading(false);
    }
  }, [poll, isDecrypted]);

  // Load results when modal opens and poll is decrypted
  useEffect(() => {
    if (isOpen && poll) {
      console.log("📊 ResultsModal opened for poll:", poll.id);
      // Refetch status first
      refetchDecryptStatus().then(({ data }) => {
        console.log("Decryption status:", data);
        if (data) {
          console.log("✅ Poll is decrypted, loading results");
          readResults();
        } else {
          console.log("🔒 Poll not decrypted yet");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, poll]); // Intentionally limited dependencies to prevent re-triggering

  if (!isOpen || !poll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{poll.title}</CardTitle>
              <CardDescription>Voting Results</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Total Votes: {poll.totalVoters}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Created: {formatDate(poll.startTime)} • Ends: {formatDate(poll.endTime)}
              </p>
            </div>

            {isDecrypted && results.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Vote Distribution (Decrypted)
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
                      💡 No votes yet. All options are currently at 0 votes.
                    </p>
                  </div>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">📊 Loading results...</p>
              </div>
            ) : (
              <div className="p-6 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <div className="flex flex-col items-center text-center gap-3">
                  <Lock className="h-10 w-10 text-primary" />
                  <div>
                    <h4 className="font-medium mb-1">Results are Encrypted</h4>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {poll.totalVoters === 0
                        ? "No votes have been cast yet."
                        : "Results are encrypted using FHE. Click the 'Decrypt' button to request decryption (requires authorization)."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Privacy Guarantee</h4>
            <p className="text-xs text-muted-foreground">
              All votes are encrypted using Fully Homomorphic Encryption (FHE). Individual votes remain private,
              and only authorized personnel can decrypt the aggregated results after the poll closes.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {isDecrypted && (
              <Button onClick={async () => {
                console.log("🔄 Refreshing results in ResultsModal");
                await refetchDecryptStatus();
                readResults();
              }}>
                Refresh Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

