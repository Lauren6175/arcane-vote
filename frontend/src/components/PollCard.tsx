import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Clock, Users, CheckCircle2, Unlock, Sparkles } from "lucide-react";
import { formatTimeRemaining, formatAddress } from "@/lib/utils";
import { useAccount } from "wagmi";

export interface Poll {
  id: number;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  creator: string;
  totalVoters: number;
  hasVoted?: boolean;
}

interface PollCardProps {
  poll: Poll;
  onVote: (poll: Poll) => void;
  onViewResults: (poll: Poll) => void;
  onDecrypt: (poll: Poll) => void;
}

export function PollCard({ poll, onVote, onViewResults, onDecrypt }: PollCardProps) {
  const { address } = useAccount();
  const isCreator = address?.toLowerCase() === poll.creator.toLowerCase();
  const canVote = poll.isActive && !poll.hasVoted && address;

  return (
    <Card className="glass-strong card-hover overflow-hidden group">
      {/* Gradient top border */}
      <div className="h-1 arcane-gradient" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold leading-tight mb-1 line-clamp-2">
              {poll.title}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {poll.description}
            </CardDescription>
          </div>
          {poll.isActive ? (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full badge-success shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground shrink-0">
              Closed
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Poll Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2.5">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate text-foreground/80">{formatTimeRemaining(poll.endTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2.5">
            <Users className="h-4 w-4 text-secondary shrink-0" />
            <span className="text-foreground/80">{poll.totalVoters} votes</span>
          </div>
        </div>

        {isCreator && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-primary font-medium">You created this poll</span>
          </div>
        )}

        {/* Options */}
        <div className="pt-1">
          <p className="text-xs font-medium text-muted-foreground mb-2.5">Options:</p>
          <div className="flex flex-wrap gap-2">
            {poll.options.map((option, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-white/5 hover:border-primary/30 transition-colors"
              >
                {option}
              </span>
            ))}
          </div>
        </div>

        {/* Voted Status */}
        {poll.hasVoted && (
          <div className="p-3 rounded-lg badge-success border animate-scale-in">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              You have already voted in this poll
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {canVote && (
            <Button 
              onClick={() => onVote(poll)} 
              className="w-full btn-glow"
              size="lg"
            >
              Cast Vote
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => onViewResults(poll)}
              className="group"
            >
              <span className="group-hover:text-primary transition-colors">
                View Results
              </span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => onDecrypt(poll)}
              className="group"
            >
              <Unlock className="mr-1.5 h-4 w-4 group-hover:rotate-12 transition-transform" />
              Decrypt
            </Button>
          </div>
        </div>

        {/* Creator Info */}
        <div className="pt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Creator:</span>
          <span className="font-mono text-foreground/60">{formatAddress(poll.creator)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
