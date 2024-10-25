import React from "react";
import { redirect } from "react-router-dom";
import { fireproof } from "use-fireproof";
import { DEFAULT_ENDPOINT, SYNC_DB_NAME } from "./show";

export async function loader({ request }) {
  const url = new URL(request.url);
  const localName = url.searchParams.get("localName");
  if (!localName) {
    throw new Error("Local name is required");
  }

  const remoteName = url.searchParams.get("remoteName");
  const endpoint = url.searchParams.get("endpoint") || DEFAULT_ENDPOINT;

  const syncDb = fireproof(SYNC_DB_NAME);
  const result = await syncDb.query((doc) => [doc.localName, doc.remoteName], {
    keys: [localName, remoteName],
    includeDocs: true,
  });
  if (result.rows.length === 0) {
    const ok = await syncDb.put({
      remoteName,
      localName,
      endpoint,
      firstConnect: true,
    });
  } else {
    const doc = result.rows[0].doc;
    console.log(doc);
    // TODO: Update the existing document if needed
    // await syncDb.put({ ...doc, endpoint, lastConnect: new Date() });
  }

  return redirect(`/fp/databases/${remoteName}`);
}

export default function DatabasesConnect() {
  return <></>;
}
