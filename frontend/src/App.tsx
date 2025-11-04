import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PollCard, Poll } from "./components/PollCard";
import { CreatePollModal } from "./components/CreatePollModal";
import { VoteModal } from "./components/VoteModal";
import { ResultsModal } from "./components/ResultsModal";
import { DecryptModal } from "./components/DecryptModal";
import { Button } from "./components/ui/Button";
import { Plus, Vote as VoteIcon } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config/contract";
import { ethers } from "ethers";

function App() {
  const { address, isConnected } = useAccount();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get poll count - force refetch on refreshKey change
  const { data: pollCount, refetch: refetchPollCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "pollCount",
    query: {
      refetchInterval: false, // Disable auto-polling
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnMount: true, // Only fetch on mount
    },
  });

  // Load polls with debounce
  useEffect(() => {
    let isCancelled = false;

    const loadPolls = async () => {
      if (!pollCount || isCancelled) return;

      const loadedPolls: Poll[] = [];
      const count = Number(pollCount);

      // Helper function to read contract data
      const readContract = async (functionName: string, args: any[]) => {
        try {
          if (isCancelled) return null;
          if (!window.ethereum) {
            console.warn("MetaMask not found");
            return null;
          }
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          return await contract[functionName](...args);
        } catch (error) {
          console.error(`Error reading ${functionName}:`, error);
          return null;
        }
      };

      for (let i = 0; i < count; i++) {
        if (isCancelled) break;
        
        try {
          // Read poll info from contract
          const pollInfo = await readContract("getPollInfo", [i]);
          const pollOptions = await readContract("getPollOptions", [i]);
          const hasVotedResult = address ? await readContract("hasVoted", [i, address]) : false;

          if (pollInfo && pollOptions && !isCancelled) {
            const poll: Poll = {
              id: i,
              title: pollInfo[0] || `Poll ${i + 1}`,
              description: pollInfo[1] || "No description",
              startTime: Number(pollInfo[2]),
              endTime: Number(pollInfo[3]),
              isActive: pollInfo[4],
              creator: pollInfo[5],
              totalVoters: Number(pollInfo[6]),
              options: pollOptions,
              hasVoted: hasVotedResult || false,
            };

            loadedPolls.push(poll);
          }
        } catch (error) {
          console.error(`Error loading poll ${i}:`, error);
        }
        
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!isCancelled) {
        setPolls(loadedPolls);
      }
    };

    const timeoutId = setTimeout(() => {
      loadPolls();
    }, 300); // Debounce 300ms

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pollCount, refreshKey, address]);

  const handleVote = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsVoteModalOpen(true);
  };

  const handleViewResults = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsResultsModalOpen(true);
  };

  const handleDecrypt = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsDecryptModalOpen(true);
  };

  const handleRefresh = async () => {
    console.log("🔄 Refreshing polls...");
    // Force refetch poll count from contract
    await refetchPollCount();
    // Update refresh key to trigger useEffect
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl arcane-gradient glow mb-6 animate-float">
            <VoteIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 gradient-text">
            Enterprise Private Governance
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Anonymous voting powered by <span className="text-primary font-semibold">Fully Homomorphic Encryption</span>.
            <br />
            Your vote, your privacy, guaranteed.
          </p>
        </div>

        {/* Actions */}
        {isConnected ? (
          <div className="mb-12 flex flex-col sm:flex-row justify-center gap-4 animate-slide-in-right">
            <Button 
              size="lg" 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-glow group"
            >
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Create New Poll
            </Button>
            <Button size="lg" variant="outline" onClick={handleRefresh} className="group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 group-hover:rotate-180 transition-transform duration-500">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Refresh Polls
            </Button>
          </div>
        ) : (
          <div className="mb-12 text-center animate-scale-in">
            <div className="glass p-8 rounded-2xl border border-primary/20 max-w-lg mx-auto">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <VoteIcon className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg text-foreground/90">Connect your wallet to create and participate in polls</p>
            </div>
          </div>
        )}

        {/* Polls Grid */}
        {polls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {polls.map((poll, index) => (
              <div 
                key={poll.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PollCard
                  poll={poll}
                  onVote={handleVote}
                  onViewResults={handleViewResults}
                  onDecrypt={handleDecrypt}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-scale-in">
            <div className="glass p-12 rounded-3xl border border-white/5 max-w-lg mx-auto">
              <div className="inline-flex p-6 rounded-2xl bg-primary/10 mb-6">
                <VoteIcon className="h-16 w-16 text-primary/60" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 gradient-text">No Polls Yet</h3>
              <p className="text-muted-foreground mb-8 text-lg">Be the first to create a poll for your organization</p>
              {isConnected && (
                <Button size="lg" onClick={() => setIsCreateModalOpen(true)} className="btn-glow group">
                  <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  Create First Poll
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreatePollModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />
      <VoteModal
        isOpen={isVoteModalOpen}
        poll={selectedPoll}
        onClose={() => setIsVoteModalOpen(false)}
        onSuccess={handleRefresh}
      />
      <ResultsModal
        isOpen={isResultsModalOpen}
        poll={selectedPoll}
        onClose={() => setIsResultsModalOpen(false)}
      />
      <DecryptModal
        isOpen={isDecryptModalOpen}
        poll={selectedPoll}
        onClose={() => setIsDecryptModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Zama's FHEVM • Built with Privacy First</p>
          <p className="mt-2">© 2024 Arcane Vote - Enterprise Private Governance System</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

