import type { SVGProps } from "react";

export function FinRouteLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M12 22V12" />
      <path d="M2 9h20" />
    </svg>
  );
}

export function FaceIdIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M5 9V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 5v4"/>
        <path d="M21 9V5a2 2 0 0 0-2-2h-2"/>
        <path d="M5 15v4a2 2 0 0 0 2 2h2"/>
        <path d="M17 15v2a2 2 0 0 1-2 2h-2"/>
        <path d="M12 15a3 3 0 0 0-3 3"/>
        <path d="M9 12a3 3 0 0 1 6 0"/>
    </svg>
  )
}
