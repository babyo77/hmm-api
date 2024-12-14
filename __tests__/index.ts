import ApiClient from "../src/index";

const api = new ApiClient({
  baseUrl: "https://music-player-api-mu.vercel.app",
  showGlobalToast: false,
  credentials: "include",
  parseErrorResponse: (error) => {
    if (typeof error === "object") {
      return error.message || "An error occurred on the server";
    }
    return "An unexpected error occurred";
  },
});

(async () => {
  const getResponse = await api.get("/a/xaraa");
  if (getResponse.success) {
    console.log(getResponse.data);
    return;
  }
  console.error(getResponse.error);
})();
