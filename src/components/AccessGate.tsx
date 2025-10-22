import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Define valid access codes here
const VALID_CODES = ["SOHAM", "AKUL", "TAYLOR", "NICO", "CHRIS", "FADRO", "ADAM", "PAWEL", "TYMON", "KUBA", "SZYMON"];

interface AccessGateProps {
  onAccessGranted: () => void;
}

export const AccessGate = ({ onAccessGranted }: AccessGateProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (VALID_CODES.includes(code.toUpperCase().trim())) {
      localStorage.setItem("stratosphere_access", "granted");
      onAccessGranted();
    } else {
      setError("Invalid access code. Please try again.");
      setCode("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Stratosphere</h1>
          <p className="text-muted-foreground">Enter your access code to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="access-code">Access Code</Label>
            <Input
              id="access-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Enter access code"
              className="text-center text-lg tracking-wider"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" size="lg">
            Access Application
          </Button>
        </form>
      </div>
    </div>
  );
};
