import React, { useEffect, useState } from "react";
import { Outlet, redirect, useLoaderData } from "react-router-dom";
import { fireproof } from "use-fireproof";
import { authResult } from "../auth";
import { SYNC_DB_NAME } from "../pages/databases/show";
import Sidebar from "../components/Sidebar"

const reservedDbNames: string[] = [
  `fp.${SYNC_DB_NAME}`,
  "fp.petname_mappings",
  "fp.fp_sync",
];

export async function loader({ request }) {
  if (!authResult.user) {
    return redirect(
      `/login?next_url=${encodeURIComponent(window.location.href)}`,
    );
  }

  const databases = await getIndexedDBNamesWithQueries();
  return { databases, user: authResult.user };
}

async function getIndexedDBNamesWithQueries(): Promise<
  { name: string; queries: any[] }[]
> {
  try {
    const databases = await indexedDB.databases();
    const userDbs = databases
      .filter(
        (db) =>
          db.name!.startsWith("fp.") &&
          !db.name!.endsWith("_queries") &&
          !reservedDbNames.includes(db.name!),
      )
      .map((db) => db.name!.substring(3));

    const dbsWithQueries = await Promise.all(
      userDbs.map(async (dbName) => {
        const queryDbName = `fp_${dbName}_queries`;
        const queryDb = fireproof(queryDbName);
        const allDocs = await queryDb.allDocs({ includeDocs: true });
        const queries = allDocs.rows.map((row) => row.value);

        return { name: dbName, queries };
      }),
    );

    return dbsWithQueries;
  } catch (error) {
    console.error("Error fetching IndexedDB names and queries:", error);
    return [];
  }
}

export default function Layout() {
  const { databases, user } = useLoaderData<{
    databases: { name: string; queries: any[] }[];
    user: any;
  }>();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const darkModePreference = localStorage.getItem("darkMode");
    return darkModePreference === "true";
  });
  const [showEmailModal, setShowEmailModal] = useState(user.publicMetadata.marketingOptIn === undefined);
  const [emailPreference, setEmailPreference] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(isDarkMode => !isDarkMode);
  };

  const handleEmailPreference = async () => {
    try {
      fetch(import.meta.env.VITE_EMAIL_PREFERENCE_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          optIn: emailPreference, userId: user.id
        })
      });
      user.publicMetadata.marketingOptin = emailPreference;
      setShowEmailModal(false);
     
    } catch (error) {
      console.error("Error updating email preference:", error);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-fp-bg-00">
      {showEmailModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center text-fp-p">
          <div className="bg-fp-bg-00 border border-fp-dec-00 px-8 py-6 rounded-fp-s shadow-lg max-w-lg w-full">
            <h2 className="font-semibold text-[34px] mb-4">Email Preferences</h2>
            <p className="mb-4 text-fp-s text-[16px]">Would you like to receive emails from us?</p>
            <div className="flex items-start gap-2 mb-6">
              <input
                type="checkbox"
                id="emailPreference"
                checked={emailPreference}
                onChange={(e) => setEmailPreference(e.target.checked)}
                className="w-[28px] h-[28px] cursor-pointer mt-[-2px] accent-fp-a-01"
              />
              <label htmlFor="emailPreference" className="text-[16px] text-fp-s cursor-pointer hover:text-fp-p">
                Yes, I'd like to receive (occasional, genuinely informative) emails from Fireproof.
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleEmailPreference}
                className="px-5 py-2 bg-fp-p font-medium text-fp-bg-00 rounded-fp-s hover:opacity-60"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar databases={databases} />

      {/* Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-fp-dec-00 px-[20px] flex-shrink-0">
          <h1 className="flex-1 text-lg font-semibold"></h1>
          <div className="flex items-center gap-[8px] text-fp-s sm:gap-[16px]">
            <a
              href="https://use-fireproof.com/docs/welcome/"
              rel="noopener noreferrer"
              target="_blank"
              className="mx-[4px] hover:underline hover:text-fp-p"
            >
              Docs
            </a>
            <a
              href="https://fireproof.storage/blog/"
              rel="noopener noreferrer"
              target="_blank"
              className="mx-[4px] hover:underline hover:text-fp-p"
            >
              Blog
            </a>
            <a
              href="https://discord.gg/ZEjnnnFF2D"
              rel="noopener noreferrer"
              target="_blank"
              className="mx-[4px] hover:underline hover:text-fp-p"
            >
              Community
            </a>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-fp-dec-00 text-fp-p hover:opacity-60"
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2">
              {user && (
                <img
                  src={
                    user.imageUrl ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
                  }
                  alt={user.firstName || "User profile"}
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-[20px]">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
