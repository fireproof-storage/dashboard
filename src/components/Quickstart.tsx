import React, { useState } from "react";
import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("javascript", javascript);

const highlightReact = (remoteName) => {
  const code = `import { useFireproof } from "use-fireproof";
import { connect } from "@fireproof/cloud";

export default function App() {
  const { database, useLiveQuery, useDocument } = useFireproof("my_db");
  connect(database, "${remoteName}");
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
}`
  return hljs.highlight(code, { language: "javascript" }).value;
}

export default function Quickstart({ remoteName }) {
  const [copied, setCopied] = useState(false);
  const [showQuickstart, setShowQuickstart] = useState(false);
  const [activeTab, setActiveTab] = useState<"react" | "vanilla">("react");

  const copyToClipboard = (e: React.MouseEvent) => {
    const wrap = e.target.closest("pre") || e.target.previousElementSibling?.closest("pre") || e.target.nextElementSibling?.closest("pre");
    const targ = wrap?.querySelector("code");
    const text = targ?.innerText;
    if (!text) return;
    navigator.clipboard.writeText(text.trimStart()).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      (err) => console.error("Could not copy text: ", err)
    );
  };
  
  return (
    <div className="mb-4 border border-fp-dec-00 rounded-fp-s">
      <div
        className="flex items-center cursor-pointer p-main"
        onClick={() => setShowQuickstart(showQuickstart => !showQuickstart)}
      >
        <h3 className="text-20 flex-grow select-none">Quickstart</h3>
        <svg 
          width="14"
          height="7"
          viewBox="0 0 14 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transform ${
            showQuickstart ? "rotate-180 text-fp-p" : "text-fp-dec-02"
          }`}
        >
          <path d="M1 1L7 6L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {showQuickstart && (
        <div className="mt-4 px-main pb-main">
          <div
            className="flex border-b border-fp-dec-00 text-fp-p text-14 mb-4"
  
          >
            <button
              className={`px-4 py-2 border-b-2 select-none ${
                activeTab === "react"
                  ? "border-fp-a-03 text-fp-a-03" 
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("react")}
            >
              React
            </button>
            <button
              className={`px-4 py-2 border-b-2 select-none ${
                activeTab === "vanilla"
                  ? " border-fp-a-03 text-fp-a-03"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("vanilla")}
            >
              Vanilla JS
            </button>
          </div>
          <div className="relative">
            <button
              className="absolute top-1 right-1 p-2 select-none text-fp-dec-02 hover:text-fp-p z-10"
              onClick={copyToClipboard}
            >
              {copied ? 
              (
                <svg className="pointer-events-none text-fp-p" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 15L12 19.5L20.5 8.5" />
                </svg>
              ) : (
                <svg className="pointer-events-none" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="text-fp-bg-00" fill="currentColor" d="M18.2813 6V8.26305H20.5C21.6046 8.26305 22.5 9.15848 22.5 10.263V21.9999C22.5 23.1045 21.6046 23.9999 20.5 23.9999H11.7188C10.6142 23.9999 9.71875 23.1045 9.71875 21.9999V19.263H7.5C6.39543 19.263 5.5 18.3676 5.5 17.263V6C5.5 4.89543 6.39543 4 7.5 4H16.2813C17.3858 4 18.2813 4.89543 18.2813 6Z" />
                  <path stroke="currentColor" strokeWidth="1.8" d="M17.2813 9.26316V6C17.2813 5.44771 16.8335 5 16.2813 5H7.5C6.94772 5 6.5 5.44772 6.5 6V17.2632C6.5 17.8154 6.94772 18.2632 7.5 18.2632H10.7188M17.2813 9.26316H11.7188C11.1665 9.26316 10.7188 9.71087 10.7188 10.2632V18.2632M17.2813 9.26316H20.5C21.0523 9.26316 21.5 9.71087 21.5 10.2632V22C21.5 22.5523 21.0523 23 20.5 23H11.7188C11.1665 23 10.7188 22.5523 10.7188 22V18.2632" />
                </svg>
              )}
            </button>
            <pre className="language-javascript min-h-14 bg-fp-bg-00 p-[12px] rounded-fp-s border border-fp-dec-00 text-code overflow-x-auto">
              {activeTab === "react" && (
                <code dangerouslySetInnerHTML={{ __html: highlightReact(remoteName) }} />
              )}
              {activeTab === "vanilla" && ``}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
