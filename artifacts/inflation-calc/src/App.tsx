import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Home } from "./pages/home";
import { Compound } from "./pages/compound";
import { PurchasingPower } from "./pages/purchasing-power";
import { Fire } from "./pages/fire";
import { College } from "./pages/college";
import { RealEstate } from "./pages/real-estate";
import { RealReturn } from "./pages/real-return";
import { Legal } from "./pages/legal";
import { Blog } from "./pages/blog";
import { BlogPost } from "./pages/blog-post";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/compound" component={Compound} />
      <Route path="/purchasing-power" component={PurchasingPower} />
      <Route path="/fire" component={Fire} />
      <Route path="/college" component={College} />
      <Route path="/real-estate" component={RealEstate} />
      <Route path="/real-return" component={RealReturn} />
      <Route path="/legal" component={Legal} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;