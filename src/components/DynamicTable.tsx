/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useNavigate } from "react-router-dom";

export default function DynamicTable({
  hrefFn,
  dbName,
  headers,
  rows,
  th = "_id",
  link = ["_id"],
}: any) {
  const navigate = useNavigate();

  return (
    <div className="relative mt-4 pb-[8px] overflow-x-scroll">
      <table className="w-full text-left text-fp-p border-collapse">
        <thead className="text-[11px] uppercase opacity-60 relative z-10">
          <tr key={"header" + Math.random()}>
            {headers.map((header: string) => (
              <th
                key={header}
                scope="col"
                className="px-[15px] py-[10px] font-semibold"
              >
                {header === '_id' ? 'document id' : header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-fp-bg-00 border border-fp-dec-00 font-medium">
          {rows.map((fields: any) => (
            <tr
              key={fields._id}
              className="hover:bg-fp-bg-02 border-b border-fp-dec-00 cursor-pointer"
              onClick={() => {
                navigate(`/fp/databases/${dbName}/docs/${fields._id}`);
              }}
            >
              {headers.map((header: string) =>
                header === th ? (
                  <th
                    key={header}
                    scope="row"
                    className="px-[15px] py-[12px] text-inherit font-medium whitespace-nowrap"
                  >
                    {formatTableCellContent(fields[header])}
                  </th>
                ) : (
                  <td key={header} className="px-[15px] py-[12px]">
                    {formatTableCellContent(fields[header])}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTableCellContent(obj: any) {
  if (typeof obj === "string") return obj;
  return JSON.stringify(obj);
}
