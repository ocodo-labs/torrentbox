import type { SVGProps } from "react";

export function LineMdDownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/master/license.txt */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path fill="currentColor" fillOpacity="0" strokeDasharray="20" strokeDashoffset="20" d="M12 4h2v6h2.5l-4.5 4.5M12 4h-2v6h-2.5l4.5 4.5">
          <animate fill="freeze" attributeName="fill-opacity" begin="0.7s" dur="0.5s" values="0;1" />
          <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="20;0" /></path>
        <path strokeDasharray="14" strokeDashoffset="14" d="M6 19h12">
          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="14;0" />
        </path>
      </g>
    </svg>
  )
}
