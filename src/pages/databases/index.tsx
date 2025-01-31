export default function DatabaseIndex() {
  return (
    <div className="flex flex-col text-fp-p items-center justify-center h-full">
      <h2 className="text-34">Welcome to Fireproof</h2>
      <p className="max-w-[420px] text-16 text-center text-fp-s mt-[12px]">
        The left sidebar lists database you have created before. To get started
        writing apps, try{" "}
        <a
          href="https://use-fireproof.com/docs/react-tutorial/"
          className="text-fp-a-03 underline hover:text-fp-p"
        >
          the React tutorial
        </a>
        .
      </p>
    </div>
  );
}
