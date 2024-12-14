"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { page_routes } from "@/lib/routes-config";
import { TerminalSquareIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("npm i hmm-api@latest").then(() => {
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex sm:min-h-[85.5vh] min-h-[85vh] flex-col items-center justify-center text-center px-2 sm:py-8 py-12">
      <h1 className="text-3xl font-bold mb-4 sm:text-6xl">
        ⚡️ Effortless API Calls 🌐 with Smart Error Handling ⚠️ & Toast
        Notifications 🍞 - Simple & Reliable 🚀
      </h1>
      <p className="mb-8 sm:text-xl max-w-[800px] text-muted-foreground">
        Write less, debug less, and focus on what matters!
      </p>
      <div className="flex flex-row items-center gap-5">
        <Link
          href={`/docs${page_routes[0].href}`}
          className={buttonVariants({ className: "px-6", size: "lg" })}
        >
          Get Started
        </Link>
      </div>
      <button
        onClick={copyToClipboard}
        className="flex flex-row items-start sm:gap-2 gap-0.5 text-muted-foreground text-md mt-7 -mb-12 max-[800px]:mb-12 font-code sm:text-base text-sm font-medium hover:text-primary transition-colors duration-200 focus:outline-none  focus:ring-0 rounded-md p-1"
      >
        {copied ? (
          <CheckIcon className="w-5 h-5 sm:mr-1 mt-0.5 text-green-500" />
        ) : (
          <TerminalSquareIcon className="w-5 h-5 sm:mr-1 mt-0.5" />
        )}
        {"npm i hmm-api"}
      </button>
    </div>
  );
}
