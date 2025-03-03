import React, { useState } from "react";
import { Button } from "../components/Button";
import { useDarkMode } from "../contexts/DarkModeContext";
import { ClerkProvider, SignIn } from "@clerk/clerk-react";
import { useLoaderData, useNavigate } from "react-router-dom";

const slides = [
 { text: "This is going to be the way to\u00A0make apps.", author: "Boorad / Brad Anderson", role: "startup founder"},
 { text: "Fastest I’ve ever developed any app of any kind.", author: "Mykle Hansen", role: "developer"}
];

export async function loader({ request }) {
  const url = new URL(request.url);
  const nextUrl = url.searchParams.get("next_url") || "/";
  return nextUrl;
}

export default function Login() {
  const nextUrl = useLoaderData() as string;
  const navigate = useNavigate();
  const [emailPreference, setEmailPreference] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const isDarkMode = useDarkMode().isDarkMode;

  function incSlide() {
    setActiveSlide(cur => cur === slides.length - 1 ? 0 : ++cur);
  }

  function decSlide() {
    setActiveSlide(cur => cur === 0 ? slides.length - 1 : --cur);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] min-h-screen overflow-hidden">
      <div className="relative lg:min-h-screen order-2 lg:order-1">
        <div className="relative flex justify-center flex-col p-10 sm:p-14 lg:p-20 z-10 h-full z-1">
          <div className="flex flex-col gap-10 sm:gap-16 mt-4 sm:mt-[30px]">
          {slides.map(slide => <Slide data={slide} isDarkMode={isDarkMode} />)}
          </div>
        </div>
        <img
          className="absolute top-0 bottom-0 right-0 left-0 w-full h-full object-cover z-0"
          src={isDarkMode ? "/login-bg-dark.png" : "/login-bg-light.png"}
        />
      </div>

      <div className="flex items-center justify-center h-full order-1 lg:order-2">
        <div className={`relative max-w-[445px] p-10 sm:px-[48px] sm:py-[60px] mx-10 my-20 sm:m-14 sm:ml-6 grow-0 rounded-fp-l ${isDarkMode ? "bg-fp-bg-01" : ""}`}>
          <ClerkProvider
            routerPush={(to) => navigate(to)}
            routerReplace={(to) => navigate(to, { replace: true })}
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            signInFallbackRedirectUrl={nextUrl}>
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <SignIn
                    appearance={{
                      elements: {
                        headerSubtitle: { display: "none" },
                        footer: { display: "none" },
                      },
                    }}
                  />
              </div>
            </div>
          </ClerkProvider>
          <svg className="absolute scale-[0.7] sm:scale-100 right-[-68px] bottom-[60px] sm:right-[-60px] sm:bottom-[65px] text-fp-a-02 pointer-events-none" width="187" height="186" viewBox="0 0 187 186" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className="animate-stroke-dash-500" 
              d="M44.0833 175.38C119.188 155.145 160.007 78.4817 142.027 1.9999" 
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="500" 
              strokeDashoffset="-500"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="animate-stroke-dash-500" 
              d="M59.8737 159.466L44.0832 175.38L67.7991 178.707"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="500" 
              strokeDashoffset="-500"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute scale-[0.85] sm:scale-100 right-[-75px] bottom-[210px] sm:right-[-86px] sm:bottom-[255px]">
            <p className="animate-show absolute max-w-[120px] top-[16px] left-[18px] text-center text-[14px] font-bold text-fp-a-02 leading-[1.3] tracking-[-0.04em] rotate-[-11deg]">Sign in to see your data live!</p>
            <svg className="text-fp-a-02" width="161" height="67" viewBox="0 0 161 67" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                className="animate-stroke-dash-2000" 
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2000" 
                strokeDashoffset="-2000"
                vectorEffect="non-scaling-stroke"
                d="M73.7212 1C36.2218 13 4.22102 24.001 1.2211 44.501C-3.29427 75.3568 62.2205 69.2017 118.221 50.0015C169.722 32.3441 167.379 13.6053 146.721 7.50098C124.721 1 97.2212 4.00098 62.2205 13.0015"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide({ data, isDarkMode }) {
  return (
    <div className="flex flex-col text-white">
      <p className="text-[20px] sm:text-[34px] lg:text-[2vw] text-main font-bold text-balance mb-4 leading-[1.3]">“{data.text}“</p>
      <div className="">
        <p className="text-14-bold sm:text-16"><b>– {data.author}</b></p>
        <p className={`text-14 ${isDarkMode ? "text-fp-dec-02" : "text-fp-dec-01"}`}>{data.role}</p>
      </div>
    </div>
  );
}

function SlideButtonIcon({ isDarkMode }) {
  return (
    <svg className={`${isDarkMode ? "text-fp-s hover:text-fp-p" : "text-fp-bg-00 hover:text-fp-dec-01"} active:scale-95 transition-transform`} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23.5" stroke="currentColor" />
      <path d="M33.623 24.5H16.623M16.623 24.5L24.0004 17M16.623 24.5L24.0004 32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
