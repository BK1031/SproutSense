import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPinned,
  SatelliteDish,
  SearchCode,
  Settings,
} from "lucide-react";

interface SidebarProps {
  selectedPage?: string;
  className?: string;
  style?: React.CSSProperties;
  isSidebarExpanded: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
}

const Sidebar = (props: SidebarProps) => {
  const navigate = useNavigate();

  const Header = () => {
    return (
      <div className="flex items-center p-4 pl-2">
        <div className="flex min-w-[60px] items-center justify-center">
          <img src="/logo.png" className="h-10" />
        </div>
        <div className="whitespace-nowrap text-white">
          <h2>SproutSense</h2>
        </div>
      </div>
    );
  };

  const SidebarItem = (props: {
    icon: any;
    text: string;
    link: string;
    isSelected: boolean;
    isSidebarExpanded: boolean;
  }) => {
    return (
      <div
        className={`mx-2 my-2 flex items-center overflow-hidden transition-all duration-150 ${
          props.isSelected ? "bg-primary bg-[length:100%_100%] p-[2px]" : ""
        } cursor-pointer rounded-lg`}
        onClick={() => navigate(props.link)}
      >
        <div
          className={`flex w-full items-center rounded-lg ${
            props.isSelected ? "bg-green-800" : ""
          } h-10 p-1 hover:bg-primary/25`}
        >
          <div className="flex min-w-[60px] items-center justify-center">
            <props.icon
              className={`${props.isSelected ? "text-white" : "text-neutral-400"}`}
            />
          </div>
          <div
            className={`whitespace-nowrap font-semibold ${
              props.isSelected ? "text-white" : "text-neutral-400"
            } ${!props.isSidebarExpanded ? "hidden" : ""}`}
          >
            {props.text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav
      className={`fixed left-0 top-0 z-30 overflow-hidden border-r bg-slate-800 transition-all duration-300 ${props.className}`}
      style={{
        height: "100vh",
        width: props.sidebarWidth,
        ...props.style,
      }}
    >
      <div className="flex h-full flex-grow flex-col items-start justify-between">
        <div className="w-full">
          <Header />
          <SidebarItem
            icon={LayoutDashboard}
            text="Dashboard"
            link={`/dashboard`}
            isSelected={props.selectedPage === "dashboard"}
            isSidebarExpanded={props.isSidebarExpanded}
          />
          <SidebarItem
            icon={MapPinned}
            text="Map"
            link={`/map`}
            isSelected={props.selectedPage === "map"}
            isSidebarExpanded={props.isSidebarExpanded}
          />
          <SidebarItem
            icon={SatelliteDish}
            text="Modules"
            link={`/modules`}
            isSelected={props.selectedPage === "modules"}
            isSidebarExpanded={props.isSidebarExpanded}
          />
          <SidebarItem
            icon={SearchCode}
            text="Query"
            link={`/query`}
            isSelected={props.selectedPage === "query"}
            isSidebarExpanded={props.isSidebarExpanded}
          />
          <SidebarItem
            icon={Settings}
            text="Settings"
            link={`/settings`}
            isSelected={props.selectedPage === "settings"}
            isSidebarExpanded={props.isSidebarExpanded}
          />
        </div>
        <div>user</div>
      </div>
    </nav>
  );
};

export default Sidebar;
