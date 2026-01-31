"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions({
      title: "确认操作",
      description: "您确定要继续吗？",
      confirmText: "确定",
      cancelText: "取消",
      variant: "default",
      ...options,
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolver(true);
  };

  const handleCancel = () => {
    setOpen(false);
    resolver(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(val) => !val && handleCancel()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            <DialogDescription className="pt-2">
              {options.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancel}>
              {options.cancelText}
            </Button>
            <Button 
              variant={options.variant === "destructive" ? "destructive" : "default"} 
              onClick={handleConfirm}
              className={options.variant === "default" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
