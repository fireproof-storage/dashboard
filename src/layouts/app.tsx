import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router-dom";
import { fireproof } from "use-fireproof";
import { authResult } from "../auth";
import { SYNC_DB_NAME } from "../pages/databases/show";

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

export function truncateDbName(name: string, maxLength: number) {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
}

export default function Layout() {
  const { databases, user } = useLoaderData<{
    databases: { name: string; queries: any[] }[];
    user: any;
  }>();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const darkModePreference = localStorage.getItem("darkMode");
    return darkModePreference === "true";
  });
  const [showEmailModal, setShowEmailModal] = useState(user.publicMetadata.marketingOptIn === undefined);
  const [emailPreference, setEmailPreference] = useState(false);

  useEffect(() => {
    if (params.name) {
      setOpenMenu(params.name);
    }
  }, [params.name]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  const toggleMenu = (dbName: string) => {
    setOpenMenu(openMenu === dbName ? null : dbName);
  };

  const navigateToDatabase = (dbName: string) => {
    navigate(`/fp/databases/${dbName}`);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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

  const navLinks = [
    { to: "", label: "All Documents" },
    { to: "/history", label: "History" },
    { to: "/query", label: "Query" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-fp-bg-00">
      {showEmailModal && (
        <div className="fixed inset-0 bg-[--background]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[--background] border border-[--border] p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-[--foreground] mb-4">Email Preferences</h2>
            <p className="mb-4 text-[--muted-foreground]">Would you like to receive emails from us?</p>
            <div className="flex items-start gap-2 mb-6">
              <input
                type="checkbox"
                id="emailPreference"
                checked={emailPreference}
                onChange={(e) => setEmailPreference(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="emailPreference" className="text-[--muted-foreground]">
                Yes, I'd like to receive (occasional, genuinely informative) emails from Fireproof.
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleEmailPreference}
                className="px-4 py-2 bg-[--accent] text-[--accent-foreground] rounded hover:bg-[--accent]/80"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Button - Hidden when sidebar is open */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="md:hidden absolute top-2 left-6 z-50 rounded-md"
        >
          <svg
            className="text-fp-p"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4.5 18H31.5"/>
            <path d="M4.5 9H31.5" />
            <path d="M4.5 27H31.5" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-0 bg-fp-bg-00 z-40 w-[280px] transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col border-r border-fp-dec-00 overflow-hidden`}
      >
        <div className="flex h-[60px] text-fp-p items-center px-5 flex-shrink-0 justify-between">
          <Link
            to="/fp/databases"
            className="flex items-center gap-2 text-[16px] font-semibold"
            onClick={() => setIsSidebarOpen(false)}
          >
            <img
              src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8IS0tIENyZWF0b3I6IENvcmVsRFJBVyBYNyAtLT4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWw6c3BhY2U9InByZXNlcnZlIiB2ZXJzaW9uPSIxLjEiIHN0eWxlPSJzaGFwZS1yZW5kZXJpbmc6Z2VvbWV0cmljUHJlY2lzaW9uOyB0ZXh0LXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247IGltYWdlLXJlbmRlcmluZzpvcHRpbWl6ZVF1YWxpdHk7IGZpbGwtcnVsZTpldmVub2RkOyBjbGlwLXJ1bGU6ZXZlbm9kZCINCnZpZXdCb3g9IjYwMDAgNjAwMCA1MDAwIDUwMDAiDQogeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPg0KIDxkZWZzPg0KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KICAgPCFbQ0RBVEFbDQogICAgLmZpbDEge2ZpbGw6bm9uZX0NCiAgICAuZmlsMyB7ZmlsbDojRUU1MjFDfQ0KICAgIC5maWwyIHtmaWxsOiNGMTZDMTJ9DQogICAgLmZpbDQge2ZpbGw6I0Y1ODcwOX0NCiAgICAuZmlsNSB7ZmlsbDojRjlBMTAwfQ0KICAgIC5maWwwIHtmaWxsOndoaXRlfQ0KICAgXV0+DQogIDwvc3R5bGU+DQogPC9kZWZzPg0KIDxnIGlkPSJMYXllcl94MDAyMF8xIj4NCiAgPGcgaWQ9Il83NDUyMDM5MjAiPg0KICAgPGxpbmUgY2xhc3M9ImZpbDEiIHgxPSI4MzMzIiB5MT0iNjAzNCIgeDI9IjYzNDIiIHkyPSAiOTQ4MyIgLz4NCiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwyIiBwb2ludHM9Ijg5OTcsNzE4MyA4MzkxLDcwMjEgNzY2OSw3MTg0IDcwMDYsODMzMyA3MDA2LDgzMzMgNzQ4OSw4NDY4IDgzMzMsODMzMyAiLz4NCiAgIDxwYXRoIGNsYXNzPSJmaWwzIiBkPSJNNzY2OSA3MTgzbDY0NyAwIDY4MSAwYzAsLTQ5MSAtMjY3LC05MjAgLTY2MywtMTE0OWwtMSAwIC02NjQgMTE0OXoiLz4NCiAgIDxwYXRoIGNsYXNzPSJmaWw0IiBkPSJNODMzMyA4MzMzbC0xMzI3IDBjMCwwIDAsMCAwLDEgMCwwIC0xLDAgLTEsMGwtNjYzIDExNDkgNzc1IDI1NyA1NTIgLTI1NyA2NjQgLTExNDkgMCAtMXptNjY0IDExNTBsNTk0IDIzMCA3MzMgLTIzMCAxIDBjMCwtNDkxIC0yNjcsLTkyMCAtNjY0LC0xMTUwbDAgMCAtNjY0IDExNTB6Ii8+DQogICA8cGF0aCBjbGFzcz0iZmlsNSIgZD0iTTc2NjkgOTQ4M2wtMTMyNyAwIDY2NCAxMTUwIDAgMCAxMzI3IDBjLTM5NywtMjMwIC02NjQsLTY1OSAtNjY0LC0xMTUwbDAgMHptMjY1NiAwbC0xMzI4IDAgLTY2NCAxMTUwIDEzMjggMCA2NjQgLTExNTB6Ii8+DQogIDwvZz4NCiA8L2c+DQo8L3N2Zz4NCg=="
              alt="Fireproof Logo"
              className="h-6 w-6"
            />
            <span>Fireproof Dashboard</span>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-fp-p p-2 rounded-full bg-fp-dec-00 hover:bg-fp-dec-01"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4.49988 4.5L15.4999 15.5" />
              <path d="M4.49988 15.5L15.4999 4.49996" />
            </svg>
          </button>
        </div>

        {/* Sidebar nav */}
        <div className="flex-1 overflow-y-auto">
          <nav className="grid gap-4 px-[20px] py-4 font-medium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[16px]">
                <span className="font-semibold text-fp-dec-01 text-[11px] uppercase">Databases</span>
              </div>
              <Link
                data-id="15"
                className="inline-flex items-center justify-center rounded bg-fp-s p-[7px] text-fp-bg-00 transition hover:opacity-60"
                to="/fp/databases/new"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  stroke-width="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5V19" />
                  <path d="M5 12H19" />
                </svg>
              </Link>
            </div>
            <div className="grid gap-2">
              {databases.map((db) => (
                <div key={db.name}>
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => navigateToDatabase(db.name)}
                      className="flex-grow text-left rounded text-[16px] text-fp-p p-[8px] hover:bg-fp-bg-01"
                    >
                      <span title={db.name}>{truncateDbName(db.name, 20)}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(db.name);
                      }}
                      className="flex items-center text-fp-s justify-center w-[40px] h-[40px] hover:bg-fp-bg-01 hover:text-fp-s rounded-fp-s"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`${openMenu === db.name ? "rotate-180 text-fp-p" : ""}`}
                      >
                        <path d="M6 14L12 9L18 14" />
                      </svg>
                    </button>
                  </div>
                  <div
                    className={`mt-[4px] overflow-hidden transition-all duration-200 ease-in-out ${
                      openMenu === db.name
                        ? "max-h-[500px] mb-[12px] opacity-100 pointer-events-auto"
                        : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    {navLinks.map((link) => (
                      <NavLink
                        end
                        key={link.to}
                        to={`/fp/databases/${db.name}${link.to}`}
                        className={({ isActive }) =>
                          `mb-[4px] block rounded pr-[8px] pl-[20px] py-[8px] leading-[25px] hover:bg-fp-bg-01 hover:text-fp-p ${
                            isActive ? "text-fp-p font-bold bg-fp-bg-01" : "text-fp-s"
                          }`
                        }
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        {link.label}
                      </NavLink>
                    ))}
                    {db.queries.length > 0 && (
                      <div className="text-sm pl-[20px] mt-[16px]">
                        <span className="opacity-40">Saved Queries:</span>
                        {db.queries.map((query, index) => (
                          <NavLink
                            key={index}
                            to={`/fp/databases/${db.name}/query/${query._id}`}
                            className="mt-[16px] block rounded px-[12px] py-[8px] leading-[25px] hover:bg-fp-bg-01"
                          >
                            {query.name || `Query ${index + 1}`}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b border-fp-dec-00 px-[20px] flex-shrink-0">
          <h1 className="flex-1 text-lg font-semibold"></h1>
          <div className="flex items-center gap-[16px] text-fp-s">
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
