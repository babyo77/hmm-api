import { toast } from "@/hooks/use-toast"; // import shadcn toast
import ApiClient from "hmm-api"; // import hmm-api
export const api = new ApiClient({
  baseUrl: process.env.BACKEND_URL,
  showGlobalToast: false,
  parseErrorResponse: (err) => {
    toast({
      variant: "destructive",
      title: err?.title || "Fetch failed",
      description: err?.desc || "Page not found",
    });
    return err;
  },
});
