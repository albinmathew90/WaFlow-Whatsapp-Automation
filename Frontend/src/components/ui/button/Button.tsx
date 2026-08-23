import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  type?: "button" | "submit" | "reset" | string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-600 text-white shadow-theme-xs hover:bg-brand-700 disabled:bg-brand-300 dark:bg-brand-500 dark:text-[#052014] dark:hover:bg-brand-400 dark:disabled:bg-brand-700",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:border-brand-600 hover:text-brand-600 hover:bg-brand-50 hover:ring-brand-600 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:border-brand-500 dark:hover:text-brand-500 dark:hover:bg-brand-500/15 dark:hover:ring-brand-500",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
