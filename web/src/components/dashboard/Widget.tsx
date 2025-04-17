import { cn } from "@/lib/utils";

interface WidgetProps {
  title: string;
  icon: React.ElementType;
  description?: string;
  children: React.ReactNode;
  className?: string;
  width?: string;
  height?: string;
}

export function Widget(props: WidgetProps) {
  return (
    <div
      className={cn("", props.className)}
      style={{ width: props.width, height: props.height }}
    >
      {props.children}
    </div>
  );
}
