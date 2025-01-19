import { rawConnect } from "@fireproof/cloud";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { useFireproof } from "use-fireproof";
import DynamicTable from "../../components/DynamicTable";
import { headersForDocs } from "../../components/dynamicTableHelpers";
import { truncateDbName } from "../../layouts/app";

export const DEFAULT_ENDPOINT =
  "fireproof://cloud.fireproof.direct?getBaseUrl=https://storage.fireproof.direct/";
export const SYNC_DB_NAME = "fp_sync";

export default function Show() {
  const { name, endpoint } = useParams();
  if (!name) {
    throw new Error("Name is required");
  }
  return <TableView key={name} name={name} />;
}

function TableView({ name }: { name: string }) {
  const { useLiveQuery, database } = useFireproof(name);
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showQuickstart, setShowQuickstart] = useState(false);
  const [activeTab, setActiveTab] = useState<"react" | "vanilla">("react");
  const connectionInfoRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [connectionInfoPosition, setConnectionInfoPosition] = useState({
    top: 0,
    left: 0,
  });

  const { useLiveQuery: usePetnameLiveQuery, useAllDocs } =
    useFireproof(SYNC_DB_NAME);

  const myPetnames = usePetnameLiveQuery<{
    localName: string;
    endpoint: string;
    remoteName: string;
  }>("sanitizedRemoteName", {
    key: name,
  });

  console.log(myPetnames);

  const petName = myPetnames.docs[0]?.localName || "";

  let connection, remoteName;
  if (myPetnames.docs.length > 0) {
    const endpoint = myPetnames.docs[0].endpoint;
    remoteName = myPetnames.docs[0].remoteName;
    if (endpoint) {
      connection = rawConnect(database as any, remoteName, endpoint);
    }
  }

  const allDocs = useLiveQuery("_id");
  const docs = allDocs.docs.filter((doc) => doc);

  const headers = headersForDocs(docs);

  const handleDeleteDatabase = async () => {
    if (
      window.confirm(`Are you sure you want to delete the database "${name}"?`)
    ) {
      const DBDeleteRequest = window.indexedDB.deleteDatabase(`fp.${name}`);

      DBDeleteRequest.onerror = (event) => {
        console.error("Error deleting database.");
      };

      DBDeleteRequest.onsuccess = (event) => {
        console.log("Database deleted successfully");
        console.log(event);
      };
      window.location.href = "/";
    }
  };

  const deleteDocument = async (docId: string) => {
    if (window.confirm(`Are you sure you want to delete this document?`)) {
      await database.del(docId);
    }
  };

  const currentHost = window.location.origin;
  const currentEndpoint = myPetnames.docs[0]?.endpoint || "";
  const currentLocalName = myPetnames.docs[0]?.localName || "";
  const currentRemoteName = myPetnames.docs[0]?.remoteName || "";

  const connectionUrl = `${currentHost}/fp/databases/connect?endpoint=${encodeURIComponent(
    currentEndpoint
  )}&localName=${encodeURIComponent(
    currentLocalName
  )}&remoteName=${encodeURIComponent(currentRemoteName)}`;

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    navigator.clipboard.writeText(connectionUrl).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (err) => console.error("Could not copy text: ", err)
    );
  };

  const handleConnectionInfoClick = () => {
    if (connectionInfoRef.current) {
      const rect = connectionInfoRef.current.getBoundingClientRect();
      setConnectionInfoPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.right + window.scrollX - 256, // 256px is width of the popup
      });
    }
    setShowConnectionInfo(!showConnectionInfo);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close if clicking inside the popup
      const popupElement = document.getElementById("connection-info-popup");
      if (popupElement?.contains(event.target as Node)) {
        return;
      }

      if (
        connectionInfoRef.current &&
        !connectionInfoRef.current.contains(event.target as Node)
      ) {
        setShowConnectionInfo(false);
      }
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="@container p-[28px] bg-fp-bg-01 rounded-fp-l text-fp-p">
      {connection && (
        <div className="mb-4 border border-fp-dec-00 rounded-fp-s p-[20px]">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setShowQuickstart(showQuickstart => !showQuickstart)}
          >
            <h3 className="font-bold text-[20px] flex-grow select-none">Quickstart</h3>
            <svg 
              width="14"
              height="7"
              viewBox="0 0 14 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transform ${
                showQuickstart ? "rotate-180 text-fp-p" : "text-fp-dec-01"
              }`}
            >
              <path d="M1 1L7 6L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

          </div>
          {showQuickstart && (
            <div className="mt-4">
              <div className="flex border-b border-fp-dec-00 text-fp-p mb-4">
                <button
                  className={`px-4 py-2 font-medium border-b-2 select-none ${
                    activeTab === "react"
                      ? "border-fp-a-03 text-fp-a-03" 
                      : "border-transparent"
                  }`}
                  onClick={() => setActiveTab("react")}
                >
                  React
                </button>
                <button
                  className={`px-4 py-2 font-medium border-b-2 select-none ${
                    activeTab === "vanilla"
                      ? " border-fp-a-03 text-fp-a-03"
                      : "border-transparent"
                  }`}
                  onClick={() => setActiveTab("vanilla")}
                >
                  Vanilla JS
                </button>
              </div>

                <pre className="bg-fp-bg-00 p-[12px] rounded-fp-s border border-fp-dec-00 text-xs overflow-x-auto">
                  {activeTab === "react" &&
`import { useFireproof } from "use-fireproof";
import { connect } from "@fireproof/cloud";

export default function App() {
  const { database, useLiveQuery, useDocument } = useFireproof("my_db");
  connect(database, '${remoteName}');
  const { docs } = useLiveQuery("_id");

  const [newDoc, setNewDoc, saveNewDoc] = useDocument({ input: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newDoc.input) {
      await saveNewDoc();
      setNewDoc(); // Reset for new entry
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={newDoc.input}
          onChange={(e) => setNewDoc({ input: e.target.value })}
        />
        <button>Add</button>
      </form>
      <ul>
        {docs.map((doc) => (
          <li key={doc._id}>{JSON.stringify(doc)}</li>
        ))}
      </ul>
    </div>
  );
}`}
                  {activeTab === "vanilla" && ``}
                </pre>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-4 gap-4">
        <nav className="max-[500px] h-[38px] flex-grow flex items-center flex-wrap">
          <Link
            to={`/fp/databases/${name}`}
            className="font-semibold text-fp-p hover:underline truncate max-w-[150px]"
          >
            {truncateDbName(name, 12)}
          </Link>
          {petName && (
            <>
              <span className="mx-1">&gt;</span>
              <span className="truncate max-w-[80px]">{petName}</span>
            </>
          )}
          <span className="mx-1">&gt;</span>
          <span className="truncate">All Documents ({docs.length})</span>
        </nav>

        <div className="flex gap-2 items-center max-[500px]:self-auto">
          {connection && (
            <div className="relative" ref={connectionInfoRef}>
              <div
                onClick={handleConnectionInfoClick}
                className="cursor-pointer inline-flex items-center justify-center h-[38px] rounded-fp-s bg-fp-bg-00 px-3 py-2 font-medium transition-colors border border-fp-dec-00 whitespace-nowrap hover:opacity-60"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </div>
              {showConnectionInfo &&
                createPortal(
                  <div
                    id="connection-info-popup"
                    className="fixed bg-fp-bg-00 border border-fp-dec-00 rounded-fp-s shadow-lg z-[9999] w-64"
                    style={{
                      top: connectionInfoPosition.top + "px",
                      left: connectionInfoPosition.left + "px",
                    }}
                  >
                    <div className="p-4">
                      <h3 className="font-bold mb-2">Share Database:</h3>
                      <button
                        onClick={copyToClipboard}
                        className="w-full p-2 bg-fp-p text-fp-bg-00 rounded-fp-s hover:opacity-60 transition-colors"
                      >
                        {copySuccess ? "Copied!" : "Copy Share Link"}
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          )}

          {/* Mobile Actions Dropdown */}
          <div className="relative block @[575px]:hidden" ref={actionsRef}>
            <button
              onClick={() => setShowActions(!showActions)}
              className="inline-flex items-center justify-center gap-[5px] rounded bg-fp-p h-[38px] px-[14px] pr-[14px] pl-[24px] py-[11px] min-w-[108px] font-medium text-fp-bg-00 transition-colors hover:opacity-60 whitespace-nowrap"
            >
              Actions
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transform ${
                  showActions ? "rotate-180" : ""
                }`}>
                <path d="M3.5 7L8 11L12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 p-[18px] text-fp-p bg-fp-bg-00 rounded-fp-s border border-fp-dec-00 z-[999]">
                <Link
                  to={`/fp/databases/${name}/docs/new`}
                  className="w-full flex items-center gap-[5px] mb-[24px] text-fp-p whitespace-nowrap"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 3.5C9 2.94772 8.55228 2.5 8 2.5C7.44772 2.5 7 2.94772 7 3.5V7H3.5C2.94772 7 2.5 7.44772 2.5 8C2.5 8.55228 2.94772 9 3.5 9H7V12.5C7 13.0523 7.44772 13.5 8 13.5C8.55228 13.5 9 13.0523 9 12.5V9H12.5C13.0523 9 13.5 8.55228 13.5 8C13.5 7.44772 13.0523 7 12.5 7H9V3.5Z" fill="currentColor"/>
                  </svg>
                  New Document
                </Link>
                <button
                  onClick={handleDeleteDatabase}
                  className="w-full flex items-center gap-[5px] text-fp-dang whitespace-nowrap"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill-rule="evenodd" clipRule="evenodd" d="M7.19999 1.59998C7.05147 1.60005 6.90589 1.64148 6.77957 1.71962C6.65326 1.79775 6.55119 1.90951 6.48479 2.04238L5.90559 3.19998H3.19999C2.98782 3.19998 2.78434 3.28426 2.63431 3.43429C2.48428 3.58432 2.39999 3.7878 2.39999 3.99998C2.39999 4.21215 2.48428 4.41563 2.63431 4.56566C2.78434 4.71569 2.98782 4.79998 3.19999 4.79998V12.8C3.19999 13.2243 3.36856 13.6313 3.66862 13.9313C3.96868 14.2314 4.37565 14.4 4.79999 14.4H11.2C11.6243 14.4 12.0313 14.2314 12.3314 13.9313C12.6314 13.6313 12.8 13.2243 12.8 12.8V4.79998C13.0122 4.79998 13.2157 4.71569 13.3657 4.56566C13.5157 4.41563 13.6 4.21215 13.6 3.99998C13.6 3.7878 13.5157 3.58432 13.3657 3.43429C13.2157 3.28426 13.0122 3.19998 12.8 3.19998H10.0944L9.51519 2.04238C9.4488 1.90951 9.34673 1.79775 9.22042 1.71962C9.0941 1.64148 8.94852 1.60005 8.79999 1.59998H7.19999ZM5.59999 6.39998C5.59999 6.1878 5.68428 5.98432 5.83431 5.83429C5.98434 5.68426 6.18782 5.59998 6.39999 5.59998C6.61217 5.59998 6.81565 5.68426 6.96568 5.83429C7.11571 5.98432 7.19999 6.1878 7.19999 6.39998V11.2C7.19999 11.4121 7.11571 11.6156 6.96568 11.7657C6.81565 11.9157 6.61217 12 6.39999 12C6.18782 12 5.98434 11.9157 5.83431 11.7657C5.68428 11.6156 5.59999 11.4121 5.59999 11.2V6.39998ZM9.59999 5.59998C9.38782 5.59998 9.18434 5.68426 9.03431 5.83429C8.88428 5.98432 8.79999 6.1878 8.79999 6.39998V11.2C8.79999 11.4121 8.88428 11.6156 9.03431 11.7657C9.18434 11.9157 9.38782 12 9.59999 12C9.81217 12 10.0157 11.9157 10.1657 11.7657C10.3157 11.6156 10.4 11.4121 10.4 11.2V6.39998C10.4 6.1878 10.3157 5.98432 10.1657 5.83429C10.0157 5.68426 9.81217 5.59998 9.59999 5.59998Z" fill="currentColor"/>
                  </svg>
                  Delete Database
                </button>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden @[575px]:flex gap-2">
            <button
              onClick={handleDeleteDatabase}
              className="inline-flex items-center justify-center gap-[5px] py-2  h-[38px] rounded-fp-s min-w-[154px] bg-fp-bg-00 font-medium text-fp-dang border border-fp-dang transition-colors whitespace-nowrap hover:opacity-60"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill-rule="evenodd" clipRule="evenodd" d="M7.19999 1.59998C7.05147 1.60005 6.90589 1.64148 6.77957 1.71962C6.65326 1.79775 6.55119 1.90951 6.48479 2.04238L5.90559 3.19998H3.19999C2.98782 3.19998 2.78434 3.28426 2.63431 3.43429C2.48428 3.58432 2.39999 3.7878 2.39999 3.99998C2.39999 4.21215 2.48428 4.41563 2.63431 4.56566C2.78434 4.71569 2.98782 4.79998 3.19999 4.79998V12.8C3.19999 13.2243 3.36856 13.6313 3.66862 13.9313C3.96868 14.2314 4.37565 14.4 4.79999 14.4H11.2C11.6243 14.4 12.0313 14.2314 12.3314 13.9313C12.6314 13.6313 12.8 13.2243 12.8 12.8V4.79998C13.0122 4.79998 13.2157 4.71569 13.3657 4.56566C13.5157 4.41563 13.6 4.21215 13.6 3.99998C13.6 3.7878 13.5157 3.58432 13.3657 3.43429C13.2157 3.28426 13.0122 3.19998 12.8 3.19998H10.0944L9.51519 2.04238C9.4488 1.90951 9.34673 1.79775 9.22042 1.71962C9.0941 1.64148 8.94852 1.60005 8.79999 1.59998H7.19999ZM5.59999 6.39998C5.59999 6.1878 5.68428 5.98432 5.83431 5.83429C5.98434 5.68426 6.18782 5.59998 6.39999 5.59998C6.61217 5.59998 6.81565 5.68426 6.96568 5.83429C7.11571 5.98432 7.19999 6.1878 7.19999 6.39998V11.2C7.19999 11.4121 7.11571 11.6156 6.96568 11.7657C6.81565 11.9157 6.61217 12 6.39999 12C6.18782 12 5.98434 11.9157 5.83431 11.7657C5.68428 11.6156 5.59999 11.4121 5.59999 11.2V6.39998ZM9.59999 5.59998C9.38782 5.59998 9.18434 5.68426 9.03431 5.83429C8.88428 5.98432 8.79999 6.1878 8.79999 6.39998V11.2C8.79999 11.4121 8.88428 11.6156 9.03431 11.7657C9.18434 11.9157 9.38782 12 9.59999 12C9.81217 12 10.0157 11.9157 10.1657 11.7657C10.3157 11.6156 10.4 11.4121 10.4 11.2V6.39998C10.4 6.1878 10.3157 5.98432 10.1657 5.83429C10.0157 5.68426 9.81217 5.59998 9.59999 5.59998Z" fill="currentColor"/>
              </svg>
              Delete Database
            </button>
            <Link
              to={`/fp/databases/${name}/docs/new`}
              className="inline-flex items-center justify-center gap-[5px] py-2 h-[38px] rounded-fp-s min-w-[154px] bg-fp-p font-medium text-fp-bg-00 transition-colors hover:opacity-60"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-fp-bg-00"
              >
                <path d="M9 3.5C9 2.94772 8.55228 2.5 8 2.5C7.44772 2.5 7 2.94772 7 3.5V7H3.5C2.94772 7 2.5 7.44772 2.5 8C2.5 8.55228 2.94772 9 3.5 9H7V12.5C7 13.0523 7.44772 13.5 8 13.5C8.55228 13.5 9 13.0523 9 12.5V9H12.5C13.0523 9 13.5 8.55228 13.5 8C13.5 7.44772 13.0523 7 12.5 7H9V3.5Z" fill="currentColor"/>
              </svg>
              New Document
            </Link>
          </div>
        </div>
      </div>

      <div>
        {docs.length === 0 ? (
          <div className="m-10 mt-14 text-center text-[20px] opacity-60 font-semibold text-balance @[575px]:mt-20">
            No documents found. <Link to={`/fp/databases/${name}/docs/new`} className="font-semibold underline">Create a new document</Link> to get started.
          </div>
        ) : (
          <DynamicTable
            headers={headers}
            th="key"
            link={["_id"]}
            rows={docs}
            dbName={name}
            onDelete={deleteDocument}
          />
        )}
      </div>
    </div>
  );
}
