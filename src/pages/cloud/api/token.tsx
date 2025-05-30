import { URI } from "@adviser/cement";
import { ps } from "@fireproof/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../../../app-context.tsx";
import { SelectedTenantLedger } from "./selected-tenant-ledger.tsx";

export function redirectBackUrl() {
  const uri = URI.from(window.location.href);
  if (uri.hasParam("token")) {
    const backUrl = URI.from(uri.getParam("back_url", ""));
    if (backUrl.protocol.startsWith("http")) {
      const fromUrl = window.location.href;
      const toUrl = backUrl.toString();
      console.log("REDIRECT_BACK_URL HANDLER TRIGGERED");
      console.log("%c FROM: %c" + fromUrl, "background:#333; color:white; font-weight:bold", "background:none; color:blue");
      console.log("%c TO (COPY THIS): %c" + toUrl, "background:#333; color:lime; font-weight:bold; font-size:14px", "background:none; color:blue; text-decoration:underline; font-size:14px");
      window.location.href = backUrl.toString();
    }
  }
}

interface TenantLedgerWithName extends ps.cloud.TenantLedger {
  readonly name: string;
}

export function ApiToken() {
  const { cloud } = useContext(AppContext);

  const buri = URI.from(window.location.href);

  const [searchParams, setSearchParams] = useSearchParams();

  // const navigate = useNavigate();

  const [initialParameters, setInitialParameters] = useState(false);

  const [createApiToken, setCreateApiToken] = useState<Partial<TenantLedgerWithName>>({});

  // console.log("createApiToken", searchParams.toString(), createApiToken);

  const skipChooser = searchParams.has("skipChooser");
  const couldSelected = skipChooser || (!!createApiToken.ledger && !!createApiToken.tenant);

  function selectLedger(param: TenantLedgerWithName) {
    setSearchParams((prev) => {
      // console.log("setSearchParams", prev.toString());
      prev.set("local_ledger_name", param.name);
      prev.set("tenant", param.tenant);
      prev.set("ledger", param.ledger);
      return prev;
    });
    setCreateApiToken(param);
  }

  const [redirectCountdown, setRedirectCountdown] = useState({
    state: "waiting", // | "started" | "running",
    countdownSecs: parseInt(searchParams.get("countdownSecs") ?? "3"),
    interval: undefined as unknown | undefined,
  });

  const {
    data: cloudToken,
    isLoading: isLoadingCloudToken,
    error: errorCloudToken,
  } = useQuery({
    queryKey: [createApiToken.ledger, createApiToken.tenant],
    queryFn: async () => {
      const resultId = searchParams.get("result_id");
      if (!resultId) {
        throw new Error("No result_id");
      }
      console.log("call getCloudSession", redirectCountdown.state, resultId);
      const rToken = await cloud.api.getCloudSessionToken({
        resultId,
        selected: createApiToken,
      });
      if (rToken.isErr()) {
        throw rToken.Err();
      }

      return rToken.Ok().token;
    },
    enabled: couldSelected,
  });

  // const back_url = BuildURI.from(buri.getParam("back_url"))
  //   .setParam("fpToken", cloudToken ?? "not-ready")
  //   .URI();
  // const redirectTo = buri.build().setParam("token", "ready").setParam("back_url", back_url.toString()).URI();

  // const [doNavigate, setDoNavigate] = useState(false);

  useEffect(() => {
    if (redirectCountdown.state === "stopped" && redirectCountdown.interval) {
      clearInterval(redirectCountdown.interval as unknown as number);
    }
    if (redirectCountdown.state === "started" && cloudToken) {
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev.countdownSecs <= 0) {
            clearInterval(interval);
            
            // Log the redirect URL right before the actual redirect
            const backUrl = URI.from(searchParams.get("back_url") || "");
            
            // Get the original redirect URL and the result_id
            let backUrlString = backUrl.toString();
            const resultId = searchParams.get("result_id");
            
            // CRITICAL FIX: Make sure to include the result_id in the redirect URL
            // Without this, the client app can't poll for the token
            let finalRedirectUrl = backUrlString;
            if (resultId) {
              // Add the result_id to the URL
              const separator = backUrlString.includes("?") ? "&" : "?";
              finalRedirectUrl = `${backUrlString}${separator}result_id=${resultId}`;
            }
            
            // Log what's happening with the token and result_id
            console.log("%c REDIRECTING BACK TO (with result_id): %c" + finalRedirectUrl, 
                      "background:#333; color:lime; font-weight:bold; font-size:14px", 
                      "background:none; color:blue; text-decoration:underline; font-size:14px");
            
            console.log("%c TOKEN FLOW INFO: %c The token is NOT passed in URL. Client will poll API with result_id", 
                      "background:#333; color:yellow; font-weight:bold", 
                      "background:none; color:black");
            
            // Log the important parameters for debugging
            console.log("TOKEN PARAMETERS (stored server-side):", {
              token: cloudToken,
              resultId,
              ledger: createApiToken.ledger,
              tenant: createApiToken.tenant,
              tokenApiEndpoint: `${window.location.origin}/api` // This is where the client should poll
            });
            
            // Use the modified redirect URL that includes the result_id
            window.location.href = finalRedirectUrl;
            // window.open("", "_self")?.close();
            // setDoNavigate(true);
            return { ...prev, state: "finished" };
          }
          return { ...prev, countdownSecs: prev.countdownSecs - 1 };
        });
      }, 1000);
      setRedirectCountdown((prev) => ({ ...prev, interval }));
      return () => clearInterval(interval);
    }
  }, [redirectCountdown.state, cloudToken]);

  if (cloudToken && redirectCountdown.state === "waiting") {
    // Log the redirect target URL before starting the timer
    const backUrl = URI.from(searchParams.get("back_url") || "");
    const backUrlString = backUrl.toString();
    console.log("%c REDIRECT TARGET URL (easy to copy): %c" + backUrlString, "background:#333; color:yellow; font-weight:bold", "background:none; color:blue; text-decoration:underline");
    console.log("TOKEN being sent to client:", cloudToken);
    setRedirectCountdown({ ...redirectCountdown, state: "started" });
  }

  // if (cloudToken && !redirectCountdown.start) {
  //   setRedirectCountdown({ ...redirectCountdown, start: true});
  // }

  // console.log("ApiToken", buri.asObj());

  // const [showPossibleLedgers, setShowPossibleLedgers] = useState(false);
  // const [ledgerSelected, setLedgerSelected] = useState(false);
  // const [ledgers, setLedgers] = useState<[]>([]);
  const queryClient = useQueryClient();

  const { data: fromApiRows, isLoading: isLoadingLedgers, error: errorLedgers } = cloud.getListTenantsLedgersByUser();

  const tenantsData = fromApiRows?.map((row) => {
    return {
      tenant: {
        ...row.tenant,
        selected: !!row.ledgers.find(
          (l) => l.ledgerId === searchParams.get("ledger") || l.name === searchParams.get("local_ledger_name"),
        ),
      },
      ledgers: row.ledgers.map((l) => {
        return {
          ...l,
          selected: l.ledgerId === searchParams.get("ledger") || l.name === searchParams.get("local_ledger_name"),
        };
      }),
    };
  });

  useEffect(() => {
    if (initialParameters) {
      return;
    }
    if (!tenantsData) {
      return;
    }
    setInitialParameters(true);
    let justOneLedgerSelected = 0;
    let ledgerSelected: (ps.dashboard.LedgerUser & { selected: boolean }) | undefined = undefined;
    tenantsData.forEach((tenant) => {
      tenant.ledgers.forEach((ledger) => {
        if (ledger.selected) {
          justOneLedgerSelected++;
          ledgerSelected = ledger;
        }
      });
    });
    if (!ledgerSelected || justOneLedgerSelected !== 1) {
      return;
    }
    // typescript o my typescript
    const l = ledgerSelected as ps.dashboard.LedgerUser;
    const ledgerFromUrl = searchParams.get("ledger");
    if (ledgerFromUrl && ledgerFromUrl !== l.ledgerId) {
      return;
    }
    selectLedger({
      ledger: l.ledgerId,
      tenant: l.tenantId,
      name: l.name,
    });
  }, [tenantsData, initialParameters]);

  const result_id = searchParams.get("result_id");
  if (!result_id || result_id.length < 5) {
    return <div>Invalid result_id</div>;
  }

  if (cloud._clerkSession?.isSignedIn === false) {
    const tos = buri.build().pathname("/login").cleanParams().setParam("redirect_url", buri.toString()).URI();
    console.log("tos", tos);
    return <Navigate to={tos.withoutHostAndSchema} />;
    // return <div>Not logged in:{tos}</div>;
  }

  if (isLoadingLedgers && !skipChooser) {
    return <div>Loading ledgers...</div>;
  }
  if (errorLedgers) {
    return <div>Error loading ledgers: {errorLedgers.message}</div>;
  }

  const showChooser = !(isLoadingCloudToken || errorCloudToken || cloudToken);
  // console.log("showChooser", showChooser, isLoadingCloudToken, errorCloudToken, cloudToken);

  if (skipChooser) {
    return <div></div>; // intentionally left blank
  }

  return (
    <>
      <div>
        <div>
          {searchParams.get("local_ledger_name") && (
            <div>
              <label>Your local database name is: </label>
              <b>{searchParams.get("local_ledger_name")}</b>
            </div>
          )}
          {searchParams.get("back_url") && (
            <div>
              <label>You are coming from: </label>
              <small>
                <a href={searchParams.get("back_url") ?? ""}>{searchParams.get("back_url")}</a>
              </small>
            </div>
          )}
          {searchParams.get("tenant") && (
            <div>
              <label>Your local tenant preset is: </label>
              <b>{searchParams.get("tenant")}</b>
            </div>
          )}
          {searchParams.get("ledger") && (
            <div>
              <label>Your local ledger preset is: </label>
              <b>{searchParams.get("ledger")}</b>
            </div>
          )}
        </div>
      </div>

      {showChooser && (
        <ChooseLedger
          searchParams={searchParams}
          couldSelected={false}
          tenantsData={tenantsData}
          onSelect={selectLedger}
          onAdd={(a) => {
            queryClient.invalidateQueries({ queryKey: ["listTenantsLedgersByUser"] });
            selectLedger(a);
          }}
        />
      )}

      <div>
        {isLoadingCloudToken && <div>Loading token...</div>}
        {errorCloudToken && <div>Loading token failed with {errorCloudToken.message}</div>}
        {cloudToken && (
          <div>
            <SelectedTenantLedger
              dbName={searchParams.get("local_ledger_name") ?? ""}
              tenantAndLedger={createApiToken as TenantLedgerWithName}
              cloudToken={cloudToken}
            />
            {/* <h2>Back to Your App</h2>
            <b>
              <Link to={redirectTo.toString()} className="text-fp-p">
                {" "}
                {back_url.build().cleanParams("fpToken").toString()}
              </Link>
            </b> */}
            <div>
              <button
                onClick={() => {
                  setRedirectCountdown({ ...redirectCountdown, state: "stopped" });
                  // setCreateApiToken({} as Partial<TenantLedgerWithName>);
                  // setSearchParams((prev) => {
                  //   prev.delete("tenant");
                  //   prev.delete("ledger");
                  //   return prev;
                  // });
                }}
              >
                Stop
              </button>
            </div>
            <div>
              <div>Redirecting in {redirectCountdown.countdownSecs} seconds...</div>
              <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
                <div><strong>Token Flow Information:</strong></div>
                <div style={{ marginBottom: '8px' }}>
                  <p><strong>Result ID:</strong> {searchParams.get("result_id")}</p>
                  <p><strong>Token is stored server-side</strong> and will be retrieved by client via API polling</p>
                  <p><strong>Redirect URL:</strong></p>
                </div>
                <div style={{ wordBreak: 'break-all', color: 'blue', cursor: 'pointer' }} 
                     onClick={(e) => { 
                       navigator.clipboard.writeText(URI.from(searchParams.get("back_url") || "").toString());
                       alert('Redirect URL copied to clipboard!');
                     }}>
                  {URI.from(searchParams.get("back_url") || "").toString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AddIfNotSelectedLedger({
  tenant,
  urlLedgerName,
  ledgers,
  onAdd,
}: {
  tenant: ps.dashboard.UserTenant;
  urlLedgerName: string;
  ledgers: (ps.dashboard.LedgerUser & { selected: boolean })[];
  onAdd: (ledger: TenantLedgerWithName) => void;
}) {
  const { cloud } = useContext(AppContext);
  const mutation = useMutation({
    mutationFn: async ({ tenant, ledgerName }: { tenant: ps.dashboard.UserTenant; ledgerName: string }) => {
      const res = await cloud.api.createLedger({
        ledger: {
          tenantId: tenant.tenantId,
          name: ledgerName,
        },
      });
      if (res.isErr()) {
        throw res.Err();
      }
      return res.Ok();
    },
  });

  const ledger = ledgers.find((l) => l.selected);
  if (ledger && urlLedgerName.length > 0) {
    // reset if ledger is selected
    urlLedgerName = "";
  }
  const [localLedgerName, setLocalLedgerName] = useState(urlLedgerName);

  if (mutation.isSuccess) {
    onAdd({
      name: mutation.data.ledger.name,
      ledger: mutation.data.ledger.ledgerId,
      tenant: mutation.data.ledger.tenantId,
    });
    return <></>;
  }
  console.log("mutation", mutation.isPending, ledger);

  // if (ledger && !urlLedgerName?.length) {
  //   return <></>;
  // }
  if (mutation.isError) {
    console.log("mutation.error", mutation.error);
    return <div>Error: {mutation.error.message}</div>;
  }
  if (mutation.isPending) {
    console.log("mutation.isPending", mutation.isPending);
    return <div>Adding ledger...</div>;
  }
  return (
    <tr>
      <td>
        <label>DB-Name</label>
        <input
          type="text"
          value={localLedgerName}
          onChange={(e) => {
            setLocalLedgerName(e.target.value);
          }}
        />
      </td>
      <td>
        <button
          onClick={() => {
            mutation.mutate({ tenant, ledgerName: localLedgerName });
          }}
        >
          <IfThenBold condition={!!localLedgerName.length} text="Add" />
        </button>
      </td>
    </tr>
  );
}

function SelectLedger({
  ledger,
  onSelect,
}: {
  ledger: ps.dashboard.LedgerUser & { selected: boolean };
  onSelect: (ledger: ps.cloud.TenantLedger) => void;
}) {
  return (
    <button
      onClick={() => {
        onSelect({
          ledger: ledger.ledgerId,
          tenant: ledger.tenantId,
        });
      }}
    >
      <IfThenBold condition={ledger.selected} text="Select" />
    </button>
  );
}

function IfThenBold({ condition, text }: { condition: boolean; text: string }) {
  if (condition) {
    return <b>{text}</b>;
  }
  return text;
}

function ChooseLedger({
  couldSelected,
  tenantsData,
  onSelect,
  onAdd,
  searchParams,
}: {
  searchParams: URLSearchParams;
  couldSelected: boolean;
  tenantsData?: {
    tenant: ps.dashboard.UserTenant & { selected: boolean };
    ledgers: (ps.dashboard.LedgerUser & { selected: boolean })[];
  }[];
  onSelect: (ledger: TenantLedgerWithName) => void;
  onAdd: (ledger: TenantLedgerWithName) => void;
}) {
  return (
    <>
      <h2>Choose Tenants</h2>
      <table>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Ledger</th>
          </tr>
        </thead>
        <tbody>
          {tenantsData?.map((row) => (
            <tr key={row.tenant.tenantId}>
              <td>
                <IfThenBold condition={row.tenant.selected} text={row.tenant.tenant.name ?? ""} />
                <small>[${row.tenant.tenantId}]</small>
              </td>
              <td>
                <table>
                  <tbody>
                    {row.ledgers.map((ledger) => (
                      <tr key={ledger.ledgerId}>
                        <td>
                          <IfThenBold condition={ledger.selected} text={ledger.name} />
                          <small>[{ledger.ledgerId}]</small>
                        </td>
                        <td>
                          {!couldSelected && (
                            <SelectLedger
                              ledger={ledger}
                              onSelect={() => {
                                onSelect({
                                  ledger: ledger.ledgerId,
                                  tenant: row.tenant.tenantId,
                                  name: ledger.name,
                                });
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    {!couldSelected && (
                      <AddIfNotSelectedLedger
                        tenant={row.tenant}
                        urlLedgerName={searchParams.get("local_ledger_name") ?? ""}
                        ledgers={row.ledgers}
                        onAdd={onAdd}
                      />
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
