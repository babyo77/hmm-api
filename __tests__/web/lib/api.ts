import { toast } from "@/hooks/use-toast"; // import shadcn toast
import ApiClient from "hmm-api"; // import hmm-api
export const api = new ApiClient({
  baseUrl: process.env.BACKEND_URL,
  toast: toast,
  parseErrorResponse: (err) => {
    return { message: err.error, title: err.title };
  },
});
