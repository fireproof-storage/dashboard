import { useDarkMode } from '../layouts/app'

type ButtonProps<T extends ElementType> = {
  children: ReactNode;
  tag?: T; // "button" | "a" | any other valid HTML tag
  variation?: "primary" | "secondary" | "tertiary" | "destructive";
  style?: string; // additional custom styles
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
} & React.ComponentPropsWithoutRef<T>; 

const baseStyles = "inline-flex items-center justify-center shrink-0 whitespace-nowrap gap-[5px] py-[11px] px-[14px] h-[38px] leading-[16px] font-medium rounded-fp-s cursor-pointer";

const buttonStyles = {
  primary: {
    light: "text-fp-bg-00 bg-fp-p hover:bg-fp-a-01 hover:text-fp-p",
    dark: "text-fp-p bg-fp-dec-01 hover:bg-fp-a-01 hover:text-fp-bg-00"
  },
  secondary: {
    light: "bg-fp-bg-00 text-fp-p border border-fp-dec-01 hover:border-fp-dec-02",
    dark: "bg-fp-bg-00 text-fp-p border border-fp-dec-01 hover:border-fp-dec-02"
  },
  tertiary: {
    light: "bg-fp-bg-00 text-fp-p border border-fp-dec-00 hover:border-fp-dec-02",
    dark: "bg-fp-bg-00 text-fp-p border border-fp-dec-00 hover:border-fp-dec-02"
  },
  destructive: {
    light: "bg-fp-bg-00 text-fp-red border border-fp-red hover:bg-fp-red hover:text-fp-bg-00",
    dark: "bg-fp-bg-00 text-fp-red border border-fp-red hover:bg-fp-red hover:text-fp-p "
  },
}

export default function Button<T extends ElementType = "button">({
  children,
  tag = "button",
  variation = "primary",
  style = "",
  disabled = false,
  onClick,
  ...rest
}: ButtonProps<T>) {
  const isDarkMode = useDarkMode()
  const Component = tag;

  const typeStyles = isDarkMode ? buttonStyles[variation].dark : buttonStyles[variation].light;
  const disabledStyles = disabled ? "opacity-50 pointer-events-none" : ""
  const combinedStyles = baseStyles + " " + typeStyles + " " + disabledStyles + " " + style;

  return (
    <Component
      className={combinedStyles}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
     {children}
   </Component >
  );
}
