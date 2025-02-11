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
    <div className="@container p-card bg-fp-bg-01 text-fp-p rounded-fp-l">
      <div className="flex justify-end items-center min-h-[38px] gap-y-[20px] flex-wrap sm:flex-nowrap">
        <nav className="text-fp-s flex-grow">
          <Link
            to={`/fp/databases/${name}`}
            className="text-14-bold break-all hover:underline hover:text-fp-p"
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
      <div className="flex items-center mb-[20px]">
        <h2>Fireproof metadata</h2>
        <div className="group relative text-fp-dec-02 cursor-pointer p-2 hover:text-fp-s">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.00001 1C9.85666 1 11.6373 1.73755 12.9501 3.0504C14.263 4.36325 15.0005 6.14385 15.0005 8.0005C15.0005 9.85715 14.263 11.6378 12.9501 12.9506C11.6373 14.2634 9.85666 15.001 8.00001 15.001C6.14336 15.001 4.36276 14.2634 3.04991 12.9506C1.73706 11.6378 0.999512 9.85715 0.999512 8.0005C0.999512 6.14385 1.73706 4.36325 3.04991 3.0504C4.36276 1.73755 6.14336 1 8.00001 1ZM9.05001 5.298C9.57001 5.298 9.99201 4.937 9.99201 4.402C9.99201 3.867 9.56901 3.506 9.05001 3.506C8.53001 3.506 8.11001 3.867 8.11001 4.402C8.11001 4.937 8.53001 5.298 9.05001 5.298ZM9.23301 10.925C9.23301 10.818 9.27001 10.54 9.24901 10.382L8.42701 11.328C8.25701 11.507 8.04401 11.631 7.94401 11.598C7.89864 11.5813 7.86072 11.549 7.83707 11.5068C7.81342 11.4646 7.8056 11.4154 7.81501 11.368L9.18501 7.04C9.29701 6.491 8.98901 5.99 8.33601 5.926C7.64701 5.926 6.63301 6.625 6.01601 7.512C6.01601 7.618 5.99601 7.882 6.01701 8.04L6.83801 7.093C7.00801 6.916 7.20601 6.791 7.30601 6.825C7.35528 6.84268 7.39565 6.87898 7.41846 6.92609C7.44127 6.97321 7.4447 7.02739 7.42801 7.077L6.07001 11.384C5.91301 11.888 6.21001 12.382 6.93001 12.494C7.99001 12.494 8.61601 11.812 9.23401 10.925H9.23301Z" fill="currentColor" />
          </svg>
          <div className="absolute bottom-10 right-[-120px] w-[240px] @[380px]:right-[-180px] @[560px]:bottom-7 @[560px]:left-5 @[560px]:w-[360px] @[380px]:w-[280px] px-5 py-3.5 bg-fp-bg-00 border border-fp-dec-01 text-14 text-fp-s rounded-fp-s hidden group-hover:block">
            <span className="text-14-bold text-fp-a-03">The document _id</span> is unique within a ledger, and assigned randomly. Use it to specify which record to update.
          </div>
        </div>
      </div>
      <CodeHighlight code={JSON.stringify(idFirstMeta, null, 2)} />
    </div>
  );
}
