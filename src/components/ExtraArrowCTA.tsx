import React from "react"

export function ExtraArrowCTA() {
  return (<div className="hidden md:block"> <svg className="absolute scale-[0.7] sm:scale-100 right-[-68px] bottom-[60px] sm:right-[-60px] sm:bottom-[95px] text-fp-a-02 pointer-events-none" width="187" height="186" viewBox="0 0 187 186" fill="none" xmlns="http://www.w3.org/2000/svg" > <path className="animate-stroke-dash-500" d="M44.0833 175.38C119.188 155.145 160.007 78.4817 142.027 1.9999" stroke="currentColor" strokeWidth="4" strokeDasharray="500" strokeDashoffset="-500" strokeLinecap="round" strokeLinejoin="round"
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
    <div className="absolute scale-[0.85] sm:scale-100 right-[-75px] bottom-[210px] sm:right-[-86px] sm:bottom-[285px]">
      <p className="animate-show absolute max-w-[120px] top-[16px] left-[18px] text-center text-[14px] font-bold text-fp-a-02 leading-[1.3] tracking-[-0.04em] rotate-[-11deg]">
        Sign in to see your data live!
      </p>
      <svg
        className="text-fp-a-02"
        width="161"
        height="67"
        viewBox="0 0 161 67"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="animate-stroke-dash-2000"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2000"
          strokeDashoffset="-2000"
          vectorEffect="non-scaling-stroke"
          d="M73.7212 1C36.2218 13 4.22102 24.001 1.2211 44.501C-3.29427 75.3568 62.2205 69.2017 118.221 50.0015C169.722 32.3441 167.379 13.6053 146.721 7.50098C124.721 1 97.2212 4.00098 62.2205 13.0015"
        />
      </svg>
    </div>
  </div>
  )
}