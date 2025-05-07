import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  className?: string;
  headerTitle?: string;
  style?: React.CSSProperties;
  scroll: number;
}

const Header = (props: HeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <nav
      className={`duration-50 fixed top-0 z-20 w-full items-center justify-start transition-all ${props.scroll > 24 ? "bg-background shadow-lg" : "bg-background"} ${props.className}`}
      style={{ ...props.style }}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center p-4">
          <h1 className="text-2xl font-bold">{props.headerTitle}</h1>
        </div>
        <div className="mr-4 flex flex-row items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
      {props.scroll > 24 ? <Separator /> : null}
    </nav>
  );
};

export default Header;