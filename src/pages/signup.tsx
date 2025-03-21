import React, { useContext, useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { dark } from '@clerk/themes';
import { FireproofWordmark } from "../components/FireproofWordmark";
import { ExtraArrowCTA } from "../components/ExtraArrowCTA";
import { DarkModeContext, useDarkMode } from "../contexts/DarkModeContext";

const slides = [
  { text: "This is going to be the way to\u00A0make apps.", author: "Boorad / Brad Anderson", role: "startup founder" },
  { text: "Fastest I've ever developed any app of any kind.", author: "Mykle Hansen", role: "developer" },
];

export async function signupLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const nextUrl = url.searchParams.get("next_url") || "/";
  return nextUrl;
}

export function SignUpPage() {
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const isDarkMode = useContext(DarkModeContext)?.isDarkMode || false;

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
          <FireproofWordmark isDarkMode={isDarkMode} />
          <h1 className="text-[6.5vw] font-bold xs:text-34 mb-[30px] sm:mb-[46px] mt-[16px] tracking-[0.02em] leading-[1.3]">
            Create your account
          </h1>
          <h2 className="text-11 text-fp-dec-02 mb-4">Email preferences</h2>
          <p className="text-14 sm:text-16 max-w-[90%] mb-4 text-balance">
            <b>Would you like to receive emails from us?</b>
          </p>
          <div className="flex items-start gap-2 mb-[48px] sm:mb-[68px]">
            <input
              type="checkbox"
              id="emailOptIn"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer mt-[3px] accent-fp-a-02"
            />
            <label htmlFor="emailOptIn" className="text-14 sm:text-16 text-fp-s cursor-pointer hover:text-fp-p">
              Yes, I'd like to receive (occasional, genuinely informative) emails from Fireproof.
            </label>
          </div>
          <SignUp
            appearance={{
              baseTheme: isDarkMode ? dark : undefined,
              elements: {
                headerSubtitle: { display: "none" },
                footer: { display: "none" },
              },
            }}
            unsafeMetadata={{
              gclid: new URLSearchParams(window.location.search).get("gclid"),
              emailOptIn: emailOptIn,
            }}
          />
          <ExtraArrowCTA />
        </div>
      </div>
    </div>
  );
}


function Slide({ data, isDarkMode }: { data: { text: string; author: string; role: string }; isDarkMode: boolean }) {
  return (
    <div className="flex flex-col text-white">
      <p className="text-[20px] sm:text-[34px] lg:text-[2vw] text-main font-bold text-balance mb-4 leading-[1.3]">"{data.text}"</p>
      <div className="">
        <p className="text-14-bold sm:text-16">
          <b>– {data.author}</b>
        </p>
        <p className={`text-14 ${isDarkMode ? "text-fp-dec-02" : "text-fp-dec-01"}`}>{data.role}</p>
      </div>
    </div>
  );
}
