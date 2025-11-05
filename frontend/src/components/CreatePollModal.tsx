import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { X, Plus, Trash2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePollModal({ isOpen, onClose, onSuccess }: CreatePollModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("7");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredOptions = options.filter((opt) => opt.trim() !== "");
    if (filteredOptions.length < 2) {
      alert("Please provide at least 2 options");
      return;
    }

    const durationInSeconds = parseInt(duration) * 24 * 60 * 60; // Convert days to seconds

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "createPoll",
      args: [title, description, filteredOptions, BigInt(durationInSeconds)],
    });
  };

  // Reset form and close modal on success
  if (isSuccess) {
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setDuration("7");
      onSuccess();
      onClose();
    }, 1000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Poll</CardTitle>
              <CardDescription>Set up a private voting poll for your organization</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Board Member Election 2024"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  (e.target as HTMLInputElement).setCustomValidity("");
                }}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Please fill out this field.")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Provide details about this poll..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  (e.target as HTMLTextAreaElement).setCustomValidity("");
                }}
                onInvalid={(e) => (e.target as HTMLTextAreaElement).setCustomValidity("Please fill out this field.")}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Options *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={options.length >= 10}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        updateOption(index, e.target.value);
                        (e.target as HTMLInputElement).setCustomValidity("");
                      }}
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Please fill out this field.")}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="365"
                placeholder="7"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  (e.target as HTMLInputElement).setCustomValidity("");
                }}
                onInvalid={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.validity.valueMissing) {
                    target.setCustomValidity("Please fill out this field.");
                  } else if (target.validity.rangeUnderflow) {
                    target.setCustomValidity("Value must be greater than or equal to 1.");
                  } else if (target.validity.rangeOverflow) {
                    target.setCustomValidity("Value must be less than or equal to 365.");
                  }
                }}
                required
              />
              <p className="text-xs text-muted-foreground">Poll will remain active for this many days</p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending || isConfirming}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isConfirming}>
                {isPending ? "Confirming..." : isConfirming ? "Creating..." : isSuccess ? "Created!" : "Create Poll"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

