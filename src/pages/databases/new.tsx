import React from "react";
import { useForm } from "react-hook-form";
import { Form, redirect, useSubmit } from "react-router-dom";
import { fireproof } from "use-fireproof";
import { Button } from "../../components/Button"

export async function Action({ request }) {
  const dbName = (await request.json()).dbName;
  const database = fireproof(dbName);
  await database.blockstore.loader?.ready();
  return redirect(`/fp/databases/${dbName}`);
}

export default function New() {
  const submit = useSubmit();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    submit(data, {
      method: "post",
      action: ".",
      encType: "application/json",
    });
  };

  return (
    <div className="px-card py-[45px] bg-fp-bg-01 rounded-fp-l text-fp-p">
      <h3 className="text-fp-p text-20">
        New Database Name:
      </h3>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-5 sm:flex"
      >
        <div className="w-full sm:max-w-xs">
          <label htmlFor="dbName" className="sr-only">
            Database Name
          </label>
          <input
            id="dbName"
            {...register("dbName", { required: true })}
            type="text"
            placeholder="New database name..."
            autoFocus
            className="w-full py-2 px-3 bg-fp-bg-00 border border-fp-dec-00 rounded-fp-s text-14 text-fp-p placeholder-fp-dec-02 focus:placeholder-transparent focus:outline-none focus:ring-1 focus:ring-fp-dec-02 focus:border-transparent"
          />
        </div>
        <Button
          variation="primary"
          style="w-full mt-[14px] sm:ml-3 sm:mt-0 sm:w-auto"
          type="submit"
        >
          Create
        </Button>
      </Form>
    </div>
  );
}
