"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
interface demo {
  name: string;
}
export default function Demo() {
  const [user, setUser] = useState<demo["name"]>();
  const addUser = async () => {
    const payload = {};
    const response = await api.post<demo>("/uknown", payload, {
      finally: () => {
        console.log("api request successful");
      },
    });

    if (response.success) {
      setUser(response.data?.name);
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
