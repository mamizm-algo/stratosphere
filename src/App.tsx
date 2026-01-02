import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { AccessGate } from "@/components/AccessGate";
import Index from "./pages/Index";
import Chart from "./pages/Chart";
import Library from "./pages/Library";
import AssetBrowser from "./pages/AssetBrowser";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessGranted = localStorage.getItem("stratosphere_access");
    setHasAccess(accessGranted === "granted");
    setIsLoading(false);
  }, []);

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  if (isLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AccessGate onAccessGranted={handleAccessGranted} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const router = createBrowserRouter([
  { path: "/", element:<Index /> },
  { path: "/chart", element:<Chart /> },
  { path: "/library", element:<Library /> },
  { path: "/browse-assets", element:<AssetBrowser /> },
  { path: "/results", element:<Results /> },
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

//  {/* <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
//           <Routes>
//             <Route path="/" element={<Index />} />
//             <Route path="/chart" element={<Chart />} />
//             <Route path="/library" element={<Library />} />
//             <Route path="/browse-assets" element={<AssetBrowser />} />
//             <Route path="/results" element={<Results />} />
//             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter> */}
