import { redirect } from "react-router-dom";

export async function indexLoader(/*{ request }*/) {
  return redirect("/fp/cloud");
}

export function Index() {
  return;
  // <div className="flex flex-col items-center justify-center h-full">
  //   <h2 className="text-2xl font-semibold">Welcome to Fireproof</h2>
  //   {/* <p className="text-muted-foreground"> */}
  //   <h3 className="text-xl font-semibold">
  //     <Link to="/fp/databases">Your Ledgers</Link>
  //   </h3>
  //   <h3 className="text-xl font-semibold">
  //     <Link to="/fp/cloud">Connect Ledger to Fireproof Cloud</Link>
  //   </h3>
  //   {/* </p> */}
  // </div>
}
