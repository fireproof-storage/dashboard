const baseStyles = "inline-flex items-center justify-center gap-[5px] py-[11px] px-[14px] h-[38px] leading-[16px] font-medium rounded-fp-s";

const buttonStyles = {
  primary: {
    light: "text-fp-bg-00 bg-fp-p hover:bg-fp-a-01 hover:text-fp-p",
    dark: "text-fp-p bg-fp-dec-01 hover:bg-fp-a-01 hover:text-fp-bg-00"
  },
  secondary: {
    light: "bg-fp-bg-00 text-fp-p border border-fp-dec-01 hover:bg-fp-p hover:text-fp-bg-00 hover:border-fp-p",
    dark: "bg-fp-bg-00 text-fp-p border border-fp-dec-01 hover:bg-fp-p hover:text-fp-bg-00 hover:border-fp-p"
  },
  tertiary: {
    light: "bg-fp-bg-00 text-fp-p border border-fp-dec-00 hover:bg-fp-p hover:text-fp-bg-00 hover:border-fp-p",
    dark: "bg-fp-bg-00 text-fp-p border border-fp-dec-00 hover:bg-fp-p hover:text-fp-bg-00 hover:border-fp-p"
  },
  destructive: {
    light: "bg-fp-bg-00 text-fp-red border border-fp-red hover:bg-fp-red hover:text-fp-bg-00",
    dark: "bg-fp-bg-00 text-fp-red border border-fp-red hover:bg-fp-red hover:text-fp-p "
  },
}

type ButtonProps<T extends ElementType> = {
  children: ReactNode;
  tag?: T; // "button" | "a" | any other valid HTML tag
  type?: "primary" | "secondary" | "tertiary" | "destructive";
  style?: string; // additional custom styles
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
} & React.ComponentPropsWithoutRef<T>; 

export default function Button<T extends ElementType = "button">({
  children,
  tag = "button",
  type = "primary",
  style = "",
  disabled = false,
  onClick,
  ...rest
}: ButtonProps<T>) {
  const isDarkMode = true;
  const Component = tag;

  const typeStyles = isDarkMode ? buttonStyles[type].dark : buttonStyles[type].light;
  const combinedStyles = baseStyles + " " + typeStyles + " " + style;

  return (
    <Component
      class={combinedStyles}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
     {children}
   </Component >
  );
}
