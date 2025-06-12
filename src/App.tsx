import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Newsletter from "./pages/Newsletter";
import StudentNews from "./pages/StudentNews";
import ArchiveQA from "./pages/ArchiveQA";
import InteractiveDatabase from "./pages/InteractiveDatabase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/student-news" element={<StudentNews />} />
          <Route path="/archive-qa" element={<ArchiveQA />} />
          <Route path="/interactive-database" element={<InteractiveDatabase />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
