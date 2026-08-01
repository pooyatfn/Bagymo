export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  border?: boolean;
  p?: "sm" | "md" | "lg";
}

const paddingStyles = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card = ({
  className = "",
  children,
  hover = false,
  border = true,
  p = "md",
  ...props
}: CardProps) => {
  const hoverCls = hover
    ? "transition-shadow duration-200 hover:shadow-md"
    : "";
  const borderCls = border ? "border border-gray-200" : "";
  return (
    <div
      className={`rounded-xl bg-white shadow-sm ${borderCls} ${hoverCls} ${paddingStyles[p]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`.trim()} {...props} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`.trim()} {...props} />;
}

export function CardBody({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export function CardFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-4 flex items-center justify-end gap-2 ${className}`.trim()} {...props} />;
}
