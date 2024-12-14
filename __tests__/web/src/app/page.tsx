/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
interface demo {
  name: string;
}
export default function Demo() {
  const [user, setUser] = useState<demo>();
  const addUser = async () => {
    const payload = {};
    const response = await api.post("/uknown", payload, {
      finally: () => {
        console.log("api request successful");
      },
    });

    if (response.success) {
      setUser(response.data);
    }
  };

  useEffect(() => {
    addUser();
  }, []);
  return (
    <div className=" flex items-center justify-center h-screen">
      {JSON.stringify(user)}
    </div>
  );
}
