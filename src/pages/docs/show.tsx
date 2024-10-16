import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFireproof } from "use-fireproof";

import {
  CodeHighlight,
  EditableCodeHighlight,
} from "../../components/CodeHighlight";

export default function Document() {
  const { name } = useParams();
  const navigate = useNavigate();
  let { id: _id } = useParams();
  _id = _id === "new" ? undefined : _id;

  const { useDocument, database } = useFireproof(name);

  const [doc] = useDocument(() => ({ _id: _id! }));
  const [docToSave, setDocToSave] = useState<string>(
    JSON.stringify(doc, null, 2)
  );
  const [needsSave, setNeedsSave] = useState(false);

  async function saveDocument(_id?: string) {
    const data = JSON.parse(docToSave);
    const resp = await database.put({ _id, ...data });
    if (!_id) {
      navigate(`/fp/databases/${name}/docs/${resp.id}`);
      return;
    }
    setNeedsSave(false);
  }

  async function deleteDocument(_id: string) {
    alert("Are you sure?");
    await database.del(_id);
    navigate(-1);
  }

  function editorChanged({ code, valid }: { code: string; valid: boolean }) {
    setNeedsSave(valid);
    setDocToSave(() => code);
  }

  const { _id: id, ...data } = doc;

  const idFirstMeta = { _id };
  const title = id ? `Edit document: ${_id}` : "Create new document";

  return (
    <div className="p-6 bg-[--muted]">
      <div className="flex justify-between items-center mb-4">
        <nav className="text-lg text-[--muted-foreground]">
          <Link
            to={`/fp/databases/${name}`}
            className="font-medium text-[--foreground] hover:underline"
          >
            {name}
          </Link>
          <span className="mx-2">&gt;</span>
          <span>{_id ? `Document: ${_id}` : "New Document"}</span>
        </nav>
      </div>
      <h3>Editable data fields</h3>
      <EditableCodeHighlight
        onChange={editorChanged}
        code={JSON.stringify(data, null, 2)}
      />
      <div className="flex space-x-4 mt-4">
        <button
          onClick={() => {
            saveDocument(_id);
          }}
          className={`${
            needsSave
              ? "bg-[--accent] hover:bg-[--accent]/80 text-accent-foreground"
              : "bg-[--muted] text-muted-foreground"
          } font-bold py-2 px-4 rounded`}
        >
          Save
        </button>
        {_id && (
          <button
            onClick={() => deleteDocument(_id)}
            className="text-white bg-[--destructive] hover:bg-[--destructive]/80 text-destructive-foreground font-bold py-2 px-4 rounded"
          >
            Delete
          </button>
        )}
        <Link
          to={`/fp/databases/${name}`}
          className="bg-[--muted] hover:bg-[--muted]/80 text-muted-foreground font-bold py-2 px-4 rounded"
        >
          Cancel
        </Link>
      </div>
      <h3 className="mt-4">Fireproof metadata</h3>
      <CodeHighlight code={JSON.stringify(idFirstMeta, null, 2)} />
    </div>
  );
}