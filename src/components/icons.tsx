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
