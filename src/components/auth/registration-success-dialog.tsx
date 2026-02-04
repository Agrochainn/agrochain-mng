"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface RegistrationSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function RegistrationSuccessDialog({
  isOpen,
  onClose,
  message,
}: RegistrationSuccessDialogProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoToLogin = () => {
    setIsRedirecting(true);
    onClose();
    router.push("/auth?message=signup-success");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isRedirecting && !open) {
          handleGoToLogin();
        }
      }}
    >
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-b from-primary/5 to-background shadow-2xl rounded-2xl">
        <DialogHeader className="text-center pt-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-in zoom-in duration-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Registration Successful!
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2">
            {message ||
              "Your account has been created successfully. You can now log in to the management dashboard."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6 pb-4">
          <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-medium">Account verified and active</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-medium">Dashboard access granted</span>
            </div>
          </div>

          <Button
            onClick={handleGoToLogin}
            disabled={isRedirecting}
            className="w-full h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg active:scale-95"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecting to Login...
              </>
            ) : (
              <>
                Proceed to Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
