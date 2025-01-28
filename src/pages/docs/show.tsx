import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFireproof } from "use-fireproof";
import { Button } from "../../components/Button"

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
    const confirmed = confirm("Are you sure?");

    if (confirmed) {
      await database.del(_id);
      navigate(-1);
    }
  }

  function editorChanged({ code, valid }: { code: string; valid: boolean }) {
    setNeedsSave(valid);
    setDocToSave(() => code);
  }

  const { _id: id, ...data } = doc;

  const idFirstMeta = { _id };
  const title = id ? `Edit document: ${_id}` : "Create new document";

  return (
    <div className="p-[28px] bg-fp-bg-01 text-fp-p rounded-fp-l">
      <div className="flex justify-end items-center min-h-[38px] gap-y-[20px] flex-wrap sm:flex-nowrap">
        <nav className="text-fp-s flex-grow">
          <Link
            to={`/fp/databases/${name}`}
            className="font-semibold break-all hover:underline hover:text-fp-p"
          >
            {name}
          </Link>
          <span className="mx-2">&gt;</span>
          <span>{_id ? `Document: ${_id}` : "New Document"}</span>
        </nav>
        {_id && (
          <Button
            variation="destructive"
            onClick={() => deleteDocument(_id)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M7.19999 1.59998C7.05147 1.60005 6.90589 1.64148 6.77957 1.71962C6.65326 1.79775 6.55119 1.90951 6.48479 2.04238L5.90559 3.19998H3.19999C2.98782 3.19998 2.78434 3.28426 2.63431 3.43429C2.48428 3.58432 2.39999 3.7878 2.39999 3.99998C2.39999 4.21215 2.48428 4.41563 2.63431 4.56566C2.78434 4.71569 2.98782 4.79998 3.19999 4.79998V12.8C3.19999 13.2243 3.36856 13.6313 3.66862 13.9313C3.96868 14.2314 4.37565 14.4 4.79999 14.4H11.2C11.6243 14.4 12.0313 14.2314 12.3314 13.9313C12.6314 13.6313 12.8 13.2243 12.8 12.8V4.79998C13.0122 4.79998 13.2157 4.71569 13.3657 4.56566C13.5157 4.41563 13.6 4.21215 13.6 3.99998C13.6 3.7878 13.5157 3.58432 13.3657 3.43429C13.2157 3.28426 13.0122 3.19998 12.8 3.19998H10.0944L9.51519 2.04238C9.4488 1.90951 9.34673 1.79775 9.22042 1.71962C9.0941 1.64148 8.94852 1.60005 8.79999 1.59998H7.19999ZM5.59999 6.39998C5.59999 6.1878 5.68428 5.98432 5.83431 5.83429C5.98434 5.68426 6.18782 5.59998 6.39999 5.59998C6.61217 5.59998 6.81565 5.68426 6.96568 5.83429C7.11571 5.98432 7.19999 6.1878 7.19999 6.39998V11.2C7.19999 11.4121 7.11571 11.6156 6.96568 11.7657C6.81565 11.9157 6.61217 12 6.39999 12C6.18782 12 5.98434 11.9157 5.83431 11.7657C5.68428 11.6156 5.59999 11.4121 5.59999 11.2V6.39998ZM9.59999 5.59998C9.38782 5.59998 9.18434 5.68426 9.03431 5.83429C8.88428 5.98432 8.79999 6.1878 8.79999 6.39998V11.2C8.79999 11.4121 8.88428 11.6156 9.03431 11.7657C9.18434 11.9157 9.38782 12 9.59999 12C9.81217 12 10.0157 11.9157 10.1657 11.7657C10.3157 11.6156 10.4 11.4121 10.4 11.2V6.39998C10.4 6.1878 10.3157 5.98432 10.1657 5.83429C10.0157 5.68426 9.81217 5.59998 9.59999 5.59998Z" fill="currentColor"/>
            </svg>
            Delete Document
          </Button>
        )}
      </div>

      <h2 className="mt-6 mb-[20px]">Editable data fields</h2>
      <EditableCodeHighlight
        onChange={editorChanged}
        code={JSON.stringify(data, null, 2)}
      />
      <div className="flex gap-[14px] justify-end mt-[14px] mb-[32px]">
        <Button
          variation="secondary"
          tag={Link}
          to={`/fp/databases/${name}`}
          style="min-w-[105px]"
        >
          Cancel
        </Button>
        <Button
          variation="primary"
          disabled={!needsSave}
          style="min-w-[105px]"
          onClick={() => {
            saveDocument(_id);
          }}
        >
        Save
      </Button>
      </div>
      <h2 className="mb-[20px]">Fireproof metadata</h2>
      <CodeHighlight code={JSON.stringify(idFirstMeta, null, 2)} />
    </div>
  );
}
