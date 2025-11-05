import { useState } from "react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { X, Lock } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { Poll } from "./PollCard";
import { cn } from "@/lib/utils";

interface VoteModalProps {
  isOpen: boolean;
  poll: Poll | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function VoteModal({ isOpen, poll, onClose, onSuccess }: VoteModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleVote = async () => {
    if (selectedOption === null || !poll) return;

    try {
      // Simplified vote function for local testing
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "vote",
        args: [BigInt(poll.id), BigInt(selectedOption)],
      });
    } catch (error) {
      console.error("Vote error:", error);
      alert("Vote failed: " + (error as Error).message);
    }
  };

  // Reset and close on success
  if (isSuccess) {
    setTimeout(() => {
      setSelectedOption(null);
      onSuccess();
      onClose();
    }, 1000);
  }

  if (!isOpen || !poll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{poll.title}</CardTitle>
              <CardDescription>Cast your encrypted vote</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">Your vote is private</h4>
                <p className="text-xs text-muted-foreground">
                  Your vote will be encrypted using FHE technology. No one, not even the poll creator, can see
                  individual votes. Only aggregated results can be decrypted by authorized personnel.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Select your choice:</p>
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                  selectedOption === index
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      selectedOption === index ? "border-primary" : "border-muted-foreground"
                    )}
                  >
                    {selectedOption === index && (
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={isPending || isConfirming}>
              Cancel
            </Button>
            <Button
              onClick={handleVote}
              disabled={selectedOption === null || isPending || isConfirming}
            >
              {isPending ? "Confirming..." : isConfirming ? "Voting..." : isSuccess ? "Voted!" : "Submit Vote"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

