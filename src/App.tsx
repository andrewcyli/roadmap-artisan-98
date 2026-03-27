import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MinimalistTimeline, DenseTimeline, VisualTimeline } from "./prototypes";

const queryClient = new QueryClient();

// Prototype Selector Page
const PrototypeSelector = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
    <div className="max-w-4xl w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Roadmap Artisan 98</h1>
        <p className="text-slate-400 text-lg">Choose your prototype experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Minimalist */}
        <Link to="/prototype/minimalist" className="group">
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
            <div className="w-12 h-12 bg-stone-200 rounded-xl mb-4 flex items-center justify-center text-2xl">
              🧘
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Minimalist Zen</h2>
            <p className="text-slate-400 text-sm mb-4">Apple-like aesthetic with generous whitespace and calm interactions.</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded">Clean</span>
              <span className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded">Breathing room</span>
              <span className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded">Subtle</span>
            </div>
          </div>
        </Link>
        
        {/* Dense */}
        <Link to="/prototype/dense" className="group">
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
            <div className="w-12 h-12 bg-slate-800 rounded-xl mb-4 flex items-center justify-center text-2xl border border-slate-600">
              📊
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Information Dense</h2>
            <p className="text-slate-400 text-sm mb-4">Bloomberg/Notion-like with maximum data visibility and efficiency.</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Data-rich</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Grid-based</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Power user</span>
            </div>
          </div>
        </Link>
        
        {/* Visual */}
        <Link to="/prototype/visual" className="group">
          <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-violet-500 rounded-xl mb-4 flex items-center justify-center text-2xl">
              🎨
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Visual Creative</h2>
            <p className="text-slate-400 text-sm mb-4">Figma-like with bold colors, cards, and playful interactions.</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Bold</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Card-based</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Playful</span>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="text-center mt-12">
        <Link to="/" className="text-slate-500 hover:text-white transition-colors">
          ← Back to original app
        </Link>
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/prototypes" element={<PrototypeSelector />} />
          <Route path="/prototype/minimalist" element={<MinimalistTimeline />} />
          <Route path="/prototype/dense" element={<DenseTimeline />} />
          <Route path="/prototype/visual" element={<VisualTimeline />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;