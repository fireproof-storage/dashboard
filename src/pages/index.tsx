import React from "react";
import { redirect } from "react-router-dom";

export async function loader() {
  return redirect(`/fp/databases`);
}

export default function Index() {
  return <></>;
}