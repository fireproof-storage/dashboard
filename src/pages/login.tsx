import React from "react";
import { redirect } from "react-router-dom";

export async function loader({ request }) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  if (state) {
    const nextURL = JSON.parse(state).next_url;
    console.log(nextURL);
    if (nextURL) {
      return redirect(nextURL);
    }
  }
  return null;
}

export default function Login() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-lg">Logging you in...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--foreground]"></div>
      </div>
    </div>
  );
}
