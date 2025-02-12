import { Clerk } from "@clerk/clerk-js";
import { useContext } from "react";
import { NavLink, redirect, useLocation, useParams } from "react-router-dom";
import { AppContext, type AppContextType } from "../app-context.tsx";
import { Plus } from "../components/Plus.tsx";
import { WithSidebar } from "../layouts/with-sidebar.tsx";

// TODO: This is a temporary loader to ensure the user is logged in with Clerk.
// TODO: We should move this to a provider agnostic loader
export function cloudLoader(ctx: AppContextType) {
  return async ({ request }: { request: Request }) => {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    const clerk = new Clerk(publishableKey);
    await clerk.load({});
    if (!clerk.user) {
      const url = new URL(request.url);
      return redirect(`/login?next_url=${encodeURIComponent(url.pathname)}`);
    }
    return null;
  };
}

export function Cloud() {
  return <WithSidebar sideBarComponent={<SidebarCloud />} />;
}

function SidebarCloud() {
  const { sideBar, cloud } = useContext(AppContext);
  const { setIsSidebarOpen } = sideBar;
  const { tenantId } = useParams();
  const location = useLocation();
  console.log("tenantId", tenantId);
  const ledgerList = cloud.getListLedgersByUser(tenantId);

  if (ledgerList.isPending) {
    return <div>Loading...</div>;
  }

  if (!ledgerList.data) {
    return <div>Not found</div>;
  }

  function isHomeActive(path: string) {
    const regex = new RegExp(`/fp/cloud/tenants/${tenantId}/(overview|members|admin)?$`);
    return regex.test(location.pathname) || path === location.pathname;
  }

  const navItems = [
    { id: "home", label: "Home", path: `/fp/cloud/tenants/${tenantId}` },
    { id: "ledgers", label: "Ledgers", path: `/fp/cloud/tenants/${tenantId}/ledgers` },
    // { id: "members", label: "Members", path: `/fp/cloud/tenants/${tenantId}/members` },
    // { id: "admin", label: "Admin", path: `/fp/cloud/tenants/${tenantId}/admin` },
  ];

  return (
    <div className="space-y-1">
      {navItems.map((item) => (
        <div key={item.path} className="flex items-center justify-between">
          <NavLink
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            end={item.id !== "home"}
            className={({ isActive }) => `
              flex items-center rounded-md px-2 py-2 text-sm transition-colors flex-1  text-fp-dec-03
              ${
                (item.id === "home" ? isHomeActive(item.path) : isActive)
                  ? "text-fp-p text-14-bold bg-fp-bg-01"
                  : "text-[--muted-foreground] hover:bg-[--accent] hover:text-[--foreground]"
              }
            `}
          >
            {item.label}
          </NavLink>
          {item.id === "ledgers" && (
            <NavLink
              to={`/fp/cloud/tenants/${tenantId}/ledgers/new`}
              className="p-1 hover:bg-[--accent]/10 rounded mr-2"
              title="Create New Ledger"
            >
              <Plus />
            </NavLink>
          )}
        </div>
      ))}

      {/* Ledger List */}
      <div className="grid gap-1">
        {ledgerList.data.ledgers
          .filter((i) => i.tenantId === tenantId)
          .map((ledger) => (
            <NavLink
              key={ledger.ledgerId}
              to={`/fp/cloud/tenants/${tenantId}/ledgers/${ledger.ledgerId}`}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `mb-[4px] block rounded-fp-s pr-[8px] pl-main py-[8px] text-14 hover:bg-fp-bg-01 hover:text-fp-p ${
                  isActive ? "text-fp-p text-14-bold bg-fp-bg-01" : "text-fp-s"
                }`
              }
            >
              {ledger.name}
            </NavLink>
          ))}
      </div>
    </div>
  );
}
