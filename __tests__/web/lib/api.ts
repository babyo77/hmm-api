import ApiClient from "hmm-api";
import { toast } from "sonner";
export const api = new ApiClient({
  toast: toast,
});
