import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { IconButton } from "./Button"

const navLinks = [
  { to: "", label: "All Documents" },
  { to: "/history", label: "History" },
  { to: "/query", label: "Query" },
];

export function truncateDbName(name: string, maxLength: number) {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
}

export default function Sidebar({ databases }) {
  const navigate = useNavigate();
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filteredDatabases = databases.filter(item => {
    return item.name.includes(searchQuery)
  })

  const navigateToDatabase = (dbName: string) => {
    navigate(`/fp/databases/${dbName}`);
    setOpenMenu(dbName);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const toggleMenu = (dbName: string) => {
    setOpenMenu(openMenu => openMenu === dbName ? null : dbName);
  };

  useEffect(() => {
    if (params.name) {
      setOpenMenu(params.name);
    }
  }, [params.name]);

  return (
    <>
      {/* Mobile Menu Button - Hidden when sidebar is open */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(isOpen => !isOpen)}
          className="md:hidden absolute top-2 left-6 z-50"
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
    <div
      className={`fixed md:static inset-0 bg-fp-bg-00 z-40 w-[280px] transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 flex flex-col border-r border-fp-dec-00 overflow-hidden`}
    >
      <div className="flex h-[56px] text-fp-p items-center px-main flex-shrink-0 justify-between">
        <Link
          to="/fp/databases"
          className="flex items-center gap-2 text-14-heading"
          onClick={() => setIsSidebarOpen(false)}
        >
          <img
            src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8IS0tIENyZWF0b3I6IENvcmVsRFJBVyBYNyAtLT4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWw6c3BhY2U9InByZXNlcnZlIiB2ZXJzaW9uPSIxLjEiIHN0eWxlPSJzaGFwZS1yZW5kZXJpbmc6Z2VvbWV0cmljUHJlY2lzaW9uOyB0ZXh0LXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247IGltYWdlLXJlbmRlcmluZzpvcHRpbWl6ZVF1YWxpdHk7IGZpbGwtcnVsZTpldmVub2RkOyBjbGlwLXJ1bGU6ZXZlbm9kZCINCnZpZXdCb3g9IjYwMDAgNjAwMCA1MDAwIDUwMDAiDQogeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPg0KIDxkZWZzPg0KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KICAgPCFbQ0RBVEFbDQogICAgLmZpbDEge2ZpbGw6bm9uZX0NCiAgICAuZmlsMyB7ZmlsbDojRUU1MjFDfQ0KICAgIC5maWwyIHtmaWxsOiNGMTZDMTJ9DQogICAgLmZpbDQge2ZpbGw6I0Y1ODcwOX0NCiAgICAuZmlsNSB7ZmlsbDojRjlBMTAwfQ0KICAgIC5maWwwIHtmaWxsOndoaXRlfQ0KICAgXV0+DQogIDwvc3R5bGU+DQogPC9kZWZzPg0KIDxnIGlkPSJMYXllcl94MDAyMF8xIj4NCiAgPGcgaWQ9Il83NDUyMDM5MjAiPg0KICAgPGxpbmUgY2xhc3M9ImZpbDEiIHgxPSI4MzMzIiB5MT0iNjAzNCIgeDI9IjYzNDIiIHkyPSAiOTQ4MyIgLz4NCiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwyIiBwb2ludHM9Ijg5OTcsNzE4MyA4MzkxLDcwMjEgNzY2OSw3MTg0IDcwMDYsODMzMyA3MDA2LDgzMzMgNzQ4OSw4NDY4IDgzMzMsODMzMyAiLz4NCiAgIDxwYXRoIGNsYXNzPSJmaWwzIiBkPSJNNzY2OSA3MTgzbDY0NyAwIDY4MSAwYzAsLTQ5MSAtMjY3LC05MjAgLTY2MywtMTE0OWwtMSAwIC02NjQgMTE0OXoiLz4NCiAgIDxwYXRoIGNsYXNzPSJmaWw0IiBkPSJNODMzMyA4MzMzbC0xMzI3IDBjMCwwIDAsMCAwLDEgMCwwIC0xLDAgLTEsMGwtNjYzIDExNDkgNzc1IDI1NyA1NTIgLTI1NyA2NjQgLTExNDkgMCAtMXptNjY0IDExNTBsNTk0IDIzMCA3MzMgLTIzMCAxIDBjMCwtNDkxIC0yNjcsLTkyMCAtNjY0LC0xMTUwbDAgMCAtNjY0IDExNTB6Ii8+DQogICA8cGF0aCBjbGFzcz0iZmlsNSIgZD0iTTc2NjkgOTQ4M2wtMTMyNyAwIDY2NCAxMTUwIDAgMCAxMzI3IDBjLTM5NywtMjMwIC02NjQsLTY1OSAtNjY0LC0xMTUwbDAgMHptMjY1NiAwbC0xMzI4IDAgLTY2NCAxMTUwIDEzMjggMCA2NjQgLTExNTB6Ii8+DQogIDwvZz4NCiA8L2c+DQo8L3N2Zz4NCg=="
            alt="Fireproof Logo"
            className="h-6 w-6"
          />
          <span className="text-l">Fireproof Dashboard</span>
        </Link>

        {/* Close button for mobile */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden text-fp-p p-2 rounded-full bg-fp-dec-00 hover:bg-fp-dec-02"
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
        <nav className="grid gap-4 p-main pt-0">

          {/* Search */}
          <div className="relative mt-[1px] mb-2">
            <svg className="absolute left-1.5 top-2 text-fp-dec-01" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M8.73228 14.7609C7.13018 14.7609 5.77442 14.1916 4.66501 13.0529C3.55559 11.9142 3.00059 10.5234 3 8.88045C2.99941 7.23754 3.55441 5.84674 4.66501 4.70804C5.7756 3.56935 7.13136 3 8.73228 3C10.3332 3 11.6893 3.56935 12.8004 4.70804C13.9116 5.84674 14.4663 7.23754 14.4646 8.88045C14.4646 9.54389 14.3617 10.1696 14.1559 10.7577C13.9501 11.3457 13.6709 11.8659 13.3181 12.3183L16.7575 15.4847C16.9192 15.6505 17 15.8616 17 16.1179C17 16.3743 16.9192 16.5854 16.7575 16.7512C16.5958 16.9171 16.39 17 16.1402 17C15.8903 17 15.6845 16.9171 15.5228 16.7512L12.0835 13.5848C11.6425 13.9467 11.1354 14.2332 10.5622 14.4443C9.98898 14.6554 9.379 14.7609 8.73228 14.7609ZM8.73228 12.9515C9.83464 12.9515 10.7718 12.5559 11.5437 11.7646C12.3157 10.9733 12.7014 10.0119 12.7008 8.88045C12.7002 7.74899 12.3145 6.78792 11.5437 5.99722C10.773 5.20653 9.83582 4.81058 8.73228 4.80937C7.62874 4.80816 6.69188 5.20411 5.9217 5.99722C5.15152 6.79033 4.76554 7.7514 4.76378 8.88045C4.76202 10.0095 5.14799 10.9709 5.9217 11.7646C6.69541 12.5583 7.63227 12.9539 8.73228 12.9515Z" />
            </svg>
            <input
              className="w-full py-1.5 px-[28px] bg-fp-bg-00 border border-fp-dec-00 rounded-fp-s text-14 text-fp-p placeholder-fp-dec-01 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-fp-dec-01 focus:border-transparent"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <svg 
                className="text-fp-dec-01 hover:text-fp-dec-02 absolute top-2 right-2 cursor-pointer"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onClick={() => setSearchQuery("")}
              >
                <path fill="currentColor" d="M7.14645 6.64645C7.34171 6.45118 7.65829 6.45118 7.85355 6.64645L10 8.79289L12.1464 6.64645C12.3417 6.45118 12.6583 6.45118 12.8536 6.64645C13.0488 6.84171 13.0488 7.15829 12.8536 7.35355L10.7071 9.5L12.8536 11.6464C13.0488 11.8417 13.0488 12.1583 12.8536 12.3536C12.6583 12.5488 12.3417 12.5488 12.1464 12.3536L10 10.2071L7.85355 12.3536C7.65829 12.5488 7.34171 12.5488 7.14645 12.3536C6.95118 12.1583 6.95118 11.8417 7.14645 11.6464L9.29289 9.5L7.14645 7.35355C6.95118 7.15829 6.95118 6.84171 7.14645 6.64645Z" />
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M16.5 9.5C16.5 13.0899 13.5899 16 10 16C6.41015 16 3.5 13.0899 3.5 9.5C3.5 5.91015 6.41015 3 10 3C13.5899 3 16.5 5.91015 16.5 9.5ZM15.5 9.5C15.5 12.5376 13.0376 15 10 15C6.96243 15 4.5 12.5376 4.5 9.5C4.5 6.46243 6.96243 4 10 4C13.0376 4 15.5 6.46243 15.5 9.5Z" />
              </svg>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-fp-dec-02 text-11">Databases</span>
            </div>
            <IconButton
              type="primary"
              tag={Link}
              data-id="15"
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
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5V19" />
                <path d="M5 12H19" />
              </svg>
            </IconButton>
          </div>
          <div className="grid gap-2">
            {filteredDatabases.map((db) => (
              <div key={db.name}>
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => navigateToDatabase(db.name)}
                    className="flex-grow text-left rounded-fp-s text-16 text-fp-p p-[8px] hover:bg-fp-bg-01"
                  >
                    <span title={db.name}>{truncateDbName(db.name, 20)}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(db.name);
                    }}
                    className="flex items-center justify-center w-[40px] h-[40px] hover:bg-fp-bg-01 hover:text-fp-s rounded-fp-s"
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
                      className={`${openMenu === db.name ? "rotate-180 text-fp-p" : "text-fp-dec-02"}`}
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
                        `mb-[4px] block rounded-fp-s pr-[8px] pl-main py-[8px] text-14 hover:bg-fp-bg-01 hover:text-fp-p ${
                          isActive ? "text-fp-p text-14-bold bg-fp-bg-01" : "text-fp-s"
                        }`
                      }
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  {db.queries.length > 0 && (
                    <div className="pl-main mt-[16px]">
                      <span className="text-11 text-fp-dec-02 px-[14px] mb-[8px]">Saved Queries:</span>
                      {db.queries.map((query, index) => (
                        <NavLink
                          key={index}
                          to={`/fp/databases/${db.name}/query/${query._id}`}
                          className="mt-[4px] block rounded-fp-s px-[14px] py-[8px] text-14 hover:bg-fp-bg-01"
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
  </>
  );
}
