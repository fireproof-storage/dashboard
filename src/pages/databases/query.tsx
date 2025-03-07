import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapFn, useFireproof } from "use-fireproof";
import { EditableCodeHighlight } from "../../components/CodeHighlight";
import DynamicTable from "../../components/DynamicTable";
import { Button } from "../../components/Button"
import { headersForDocs } from "../../components/dynamicTableHelpers";

type AnyMapFn = MapFn<object>;

export default function Query() {
  const { name } = useParams();
  if (!name) throw new Error("No database name provided");

  const emptyMap = `(doc, emit) => {
    emit(doc._id, doc) 
}
  `;

  const [editorCode, setEditorCode] = useState<string>(emptyMap);
  const [editorCodeFnString, setEditorCodeFnString] = useState<string>(
    () => editorCode
  );
  const [userCodeError, setUserCodeError] = useState<string | null>(null);

  function editorChanged({ code }: { code: string }) {
    setEditorCode(code);
  }

  async function runTempQuery() {
    try {
      // Try to evaluate the function to check for  errors
      eval(`(${editorCode})`);
      setEditorCodeFnString(editorCode);
      setUserCodeError(null);
    } catch (error) {
      setUserCodeError(error.message);
    }
  }

  function saveTempQuery() {
    console.log("save not implemented");
  }

  return (
    <div className="p-card bg-fp-bg-01 rounded-fp-l">
      <div className="flex justify-between items-center mb-4 h-[38px]">
        <nav className="text-fp-s">
          <Link
            to={`/fp/databases/${name}`}
            className="text-14-bold break-all hover:underline hover:text-fp-p"
          >
            {name}
          </Link>
          <span className="mx-2">&gt;</span>
          <span>Query</span>
        </nav>
      </div>

      <h2 className="text-20 mb-[12px] mt-[32px]">
        Query Editor
      </h2>
      <p className="mb-[20px]">
        Enter your map function below. This function will be used to query the
        database.
      </p>

      <EditableCodeHighlight
        onChange={editorChanged}
        code={editorCode}
        language="javascript"
      />
      <div className="flex gap-[14px] mt-[14px] justify-end">
        <Button
          variation="secondary"
          style="min-w-[105px]"
          onClick={saveTempQuery}
        >
          Save
        </Button>
        <Button
          variation="primary"
          style="min-w-[105px]"
          onClick={runTempQuery}
        >
          Query
        </Button>
      </div>

      {userCodeError ? (
        <div className="mt-4 border border-fp-red p-4 pb-6 rounded-fp-s">
          <h3 className="text-fp-red text-20 mb-2">Error:</h3>
          <p className="text-fp-s">{userCodeError}</p>
        </div>
      ) : (
        <QueryDynamicTable mapFn={editorCodeFnString} name={name} />
      )}
    </div>
  );
}

function QueryDynamicTable({ mapFn, name }: { mapFn: string; name: string }) {
  const { useLiveQuery } = useFireproof(name);
  const allDocs = useLiveQuery(eval(`(${mapFn})`));
  const docs = allDocs.docs.filter((doc) => doc);
  console.log(docs);
  const headers = headersForDocs(docs);

  if (!docs.length) return null;
  return (
    <DynamicTable
      headers={headers}
      th="key"
      link={["_id"]}
      rows={docs}
      dbName={name}
    />
  );
}
