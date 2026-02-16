import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createHashRouter ,
  RouterProvider,
} from "react-router-dom";
// import { AccessGate } from "@/components/AccessGate";
import Index from "./pages/Index";
import Chart from "./pages/Chart";
import Library from "./pages/Library";
import AssetBrowser from "./pages/AssetBrowser";
import Results from "./pages/Results";
import Sandbox from "./pages/Sandbox";
import LaunchingSoon from "./pages/LaunchingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const accessGranted = localStorage.getItem("stratosphere_access");
  //   setHasAccess(accessGranted === "granted");
  //   setIsLoading(false);
  // }, []);

  // useEffect(() => {
  //   try {
  //     const accessGranted = localStorage.getItem("stratosphere_access");
  //     setHasAccess(accessGranted === "granted");
  //   } catch {
  //     setHasAccess(false);
  //   }
  //   setIsLoading(false);
  // }, []);


  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  // if (isLoading) {
  //   return null;
  // }

  // if (!hasAccess) {
  //   return (
  //     <QueryClientProvider client={queryClient}>
  //       <TooltipProvider>
  //         <AccessGate onAccessGranted={handleAccessGranted} />
  //       </TooltipProvider>
  //     </QueryClientProvider>
  //   );
  // }

  const router = createHashRouter([
  { path: "/", element:<Index /> },
  { path: "/chart", element:<Chart /> },
  { path: "/library", element:<Library /> },
  { path: "/browse-assets", element:<AssetBrowser /> },
  { path: "/results", element:<Results /> },
  { path: "/sandbox", element:<Sandbox /> },
  { path: "/launching-soon", element:<LaunchingSoon /> },
  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */},
  { path: "*", element:<NotFound /> },
]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router}/>
       
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
