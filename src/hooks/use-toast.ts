"use client";

// Wrapper around sonner for compatibility
import { toast as sonnerToast } from "sonner";

/**
 * Hook providing toast notifications via sonner
 * Simple wrapper to maintain a consistent API across the app
 */
function useToast() {
  return {
    toast: sonnerToast,
    dismiss: sonnerToast.dismiss,
  };
}

// Direct export for convenience (e.g., import { toast } from "@/hooks/use-toast")
const toast = sonnerToast;

export { useToast, toast };
