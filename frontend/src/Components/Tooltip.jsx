import React from "react";
import { Info } from "lucide-react";

export default function Tooltip({ content, children, iconOnly = false }) {
  if (!content) return children || null;

  return (
    <span className={`tooltip ${iconOnly ? "tooltip--icon-only" : ""}`} tabIndex={0}>
      {children || <Info className="tooltip-trigger-icon" />}
      <span className="tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}
