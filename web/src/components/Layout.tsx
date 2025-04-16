import React, { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface LayoutProps {
  activeTab?: string;
  headerTitle?: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  activeTab,
  headerTitle,
  children,
}) => {
  const [isSidebarExpanded, setSidebarExpanded] = React.useState(true);
  const [sidebarWidth, setSidebarWidth] = React.useState(275);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [scrollY, setScrollY] = useState(0);

  const handleResize = () => {
    const width = window.innerWidth;

    if (width < 768) {
      collapseSidebar();
    } else {
      expandSidebar();
    }

    setWindowWidth(width);
  };

  const scrollHandler = () => {
    setScrollY(window.scrollY);
  };

  React.useEffect(() => {
    window.addEventListener("scroll", scrollHandler);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const expandSidebar = () => {
    if (windowWidth < 768) {
      return;
    }
    setSidebarExpanded(true);
    setSidebarWidth(275);
  };

  const collapseSidebar = () => {
    setSidebarExpanded(false);
    setSidebarWidth(0);
  };

  const toggleSidebar = () => {
    if (isSidebarExpanded) {
      collapseSidebar();
    } else {
      expandSidebar();
    }
  };

  return (
    <>
      <div className="flex">
        <Sidebar
          selectedPage={activeTab}
          isSidebarExpanded={isSidebarExpanded}
          sidebarWidth={sidebarWidth}
          toggleSidebar={toggleSidebar}
        />
        <div className="w-full">
          <Header
            scroll={scrollY}
            headerTitle={headerTitle}
            style={{
              left: sidebarWidth,
              width: windowWidth - sidebarWidth,
            }}
          />
          <div
            className="mt-14 p-8 transition-all duration-200"
            style={{ marginLeft: sidebarWidth }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
