import React, { useState} from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { DarkModeContext } from "../contexts/DarkModeContext";
import { dark } from '@clerk/themes';
import { FireproofWordmark } from "../components/FireproofWordmark";

const slides = [
  { text: "This is going to be the way to\u00A0make apps.", author: "Boorad / Brad Anderson", role: "startup founder" },
  { text: "Fastest I’ve ever developed any app of any kind.", author: "Mykle Hansen", role: "developer" },
];

export async function loginLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const nextUrl = url.searchParams.get("next_url") || "/";
  return nextUrl;
}

export function Login() {
  const [emailPreference, setEmailPreference] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const isDarkMode = useContext(DarkModeContext)?.isDarkMode;

  function incSlide() {
    setActiveSlide((cur) => (cur === slides.length - 1 ? 0 : ++cur));
  }

  function decSlide() {
    setActiveSlide((cur) => (cur === 0 ? slides.length - 1 : --cur));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] min-h-screen overflow-hidden">
      <div className="relative lg:min-h-screen order-2 lg:order-1">
        <div className="relative flex justify-center flex-col p-10 sm:p-14 lg:p-20 z-10 h-full z-1">
          <div className="flex flex-col gap-10 sm:gap-16 mt-4 sm:mt-[30px]">
            {slides.map((slide, i) => (
              <Slide key={i} data={slide} isDarkMode={isDarkMode} />
            ))}
          </div>
        </div>
        <img
          className="absolute top-0 bottom-0 right-0 left-0 w-full h-full object-cover z-0"
          src={isDarkMode ? "/login-bg-dark.png" : "/login-bg-light.png"}
        />
      </div>

      <div className="flex items-center justify-center h-full order-1 lg:order-2">
        <div
          className="relative max-w-[445px] p-10 sm:px-[48px] sm:py-[60px] mx-10 my-20 sm:m-14 sm:ml-6 grow-0"
        >
          <div className="mb-5">
            <FireproofWordmark isDarkMode={isDarkMode}/>
          </div>
          <SignIn
            appearance={{
              baseTheme: isDarkMode ? dark : undefined,
              elements: {
                headerSubtitle: { display: "none" },
                footer: { display: "none" },
              },
            }}
          />
          <div className="my-10 text-center">
            <p className="text-14 sm:text-16 text-fp-s">
              Don't have an account?{" "}
              <Link to="/signup" className="text-fp-a-02 hover:text-fp-a-01">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide({ data, isDarkMode }: { data: { text: string; author: string; role: string }; isDarkMode: boolean }) {
  return (
    <div className="flex flex-col text-white">
      <p className="text-[20px] sm:text-[34px] lg:text-[2vw] text-main font-bold text-balance mb-4 leading-[1.3]">“{data.text}“</p>
      <div className="">
        <p className="text-14-bold sm:text-16">
          <b>– {data.author}</b>
        </p>
        <p className={`text-14 ${isDarkMode ? "text-fp-dec-02" : "text-fp-dec-01"}`}>{data.role}</p>
      </div>
    </div>
  );
}

function SlideButtonIcon({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <svg
      className={`${isDarkMode ? "text-fp-s hover:text-fp-p" : "text-fp-bg-00 hover:text-fp-dec-01"} active:scale-95 transition-transform`}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="23.5" stroke="currentColor" />
      <path
        d="M33.623 24.5H16.623M16.623 24.5L24.0004 17M16.623 24.5L24.0004 32"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
