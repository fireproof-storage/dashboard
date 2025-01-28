import React, { useEffect, useState, createContext, useContext } from "react";
import { Outlet, redirect, useLoaderData } from "react-router-dom";
import { fireproof } from "use-fireproof";
import { authResult } from "../auth";
import { SYNC_DB_NAME } from "../pages/databases/show";
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import { Button } from "../components/Button"

const DarkModeContext = createContext()

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

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (!context) throw new Error('Darkmode context used outside of the Provider')
  return context.isDarkMode
}

function getDarkMode() {
  const storedDarkMode = localStorage.getItem("darkMode");
  const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)").matches
  return storedDarkMode === "true" || darkModePreference;
}

export default function Layout() {
  const { databases, user } = useLoaderData<{
    databases: { name: string; queries: any[] }[];
    user: any;
  }>();

  const [showEmailModal, setShowEmailModal] = useState(user.publicMetadata.marketingOptIn === undefined);
  const [emailPreference, setEmailPreference] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => getDarkMode());

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
    <DarkModeContext.Provider value={{ isDarkMode }}>
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
                <Button
                  variation="primary"
                  type="button"
                  onClick={handleEmailPreference}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
        <Sidebar databases={databases} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <main className="flex-1 overflow-y-auto p-[20px]">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>
    </DarkModeContext.Provider>
  );
}
