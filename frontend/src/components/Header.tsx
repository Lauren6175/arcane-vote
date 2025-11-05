import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Vote, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/5 shadow-lg">
      <div className="container flex h-18 items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl arcane-gradient glow group cursor-pointer">
            <Vote className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-background flex items-center justify-center">
              <Shield className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Arcane Vote</h1>
            <p className="text-xs text-muted-foreground font-medium">Enterprise Private Governance</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
