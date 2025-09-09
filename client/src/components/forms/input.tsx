import { createElement, type ComponentProps } from "react";

// This component is styled using only Tailwind CSS classes.
// It can be rendered as either an <input> or a <textarea>.

type StyledInputProps = (
  | ComponentProps<"input">
  | ComponentProps<"textarea">
) & {
  as?: "input" | "textarea";
};

// Core styles shared between inputs and textareas.
const coreStyles =
  "w-full border border-gray-200 bg-bg focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder-gray-500 transition-all";

export default function StyledInput({
  as: Component = "input",
  className,
  ...props
}: StyledInputProps) {
  // Combine the core styles with any additional classes passed in.
  const combinedClassName = `${coreStyles} ${className}`;

  return createElement(Component, { ...props, className: combinedClassName });
}
