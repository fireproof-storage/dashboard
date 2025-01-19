import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type DocBase, useFireproof } from "use-fireproof";
import DynamicTable from "../../components/DynamicTable";
import { headersForDocs } from "../../components/dynamicTableHelpers";

export default function ChangesHistory() {
  const { name } = useParams();
  const { database } = useFireproof(name);

  const [history, setHistory] = useState({ rows: [] } as {
    rows: { key: string; value: DocBase }[];
  });

  useEffect(() => {
    const handleChanges = async () => {
      const changes = await database.changes();
      setHistory(changes);
    };

    void handleChanges();
    return database.subscribe(handleChanges);
  }, [database]);

  const headers = headersForDocs(history.rows.map((row) => row.value));

  const rows = history.rows.map((row) => row.value).reverse();

  return (
    <div className="p-[28px] bg-fp-bg-01 text-fp-p rounded-fp-l">
      <div className="flex justify-between items-center h-[38px]">
        <nav className="">
          <Link
            to={`/fp/databases/${name}`}
            className="font-semibold hover:underline"
          >
            {name}
          </Link>
          <span className="mx-2">&gt;</span>
          <span>History</span>
        </nav>
      </div>
      {!!rows.length ? (
        <DynamicTable dbName={name} headers={headers} rows={rows} />
        ) : (
        <div className="m-10 mt-[80px] text-center text-[20px] opacity-60 font-semibold text-balance">
          No history found.
        </div>
        )
      }
    </div>
  );
}
