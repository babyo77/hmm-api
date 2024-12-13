"use client";

import { useEffect } from "react";
import { api } from "../../lib/api";

export default function Home() {
  useEffect(() => {
    api.get("https://music-player-api-mu.vercel.app/s");
  });
  return;
}
