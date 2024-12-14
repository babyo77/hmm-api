import ApiClient from "../../../src/index";
import { toast } from "sonner";
export const api = new ApiClient({
  baseUrl: "https://fakestoreapi.com",
  toast: toast,
});
