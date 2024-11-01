import { useAuth } from "@workos-inc/authkit-react";
import React from "react";

export default function Login() {
 
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg">Redirecting to login...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--foreground]"></div>
        </div>
      </div>
    );
  }


