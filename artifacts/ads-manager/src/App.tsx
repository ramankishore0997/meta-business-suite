import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessGate } from "@/components/access-gate";
import NotFound from "@/pages/not-found";

import DashboardPage from "@/pages/dashboard";
import CampaignsPage from "@/pages/campaigns";
import AdSetsPage from "@/pages/adsets";
import AdsPage from "@/pages/ads";
import CreativeGalleryPage from "@/pages/creative-gallery";
import PortalPage from "@/pages/portal";
import ClientsPage from "@/pages/clients";
import AnalyticsPage from "@/pages/analytics";
import ReportsPage from "@/pages/reports";
import InvoicesPage from "@/pages/invoices";
import BillingPage from "@/pages/billing";
import IntegrationsPage from "@/pages/integrations";
import TeamPage from "@/pages/team";
import SettingsPage from "@/pages/settings";
import PaymentsPage from "@/pages/payments";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/campaigns" component={CampaignsPage} />
      <Route path="/adsets" component={AdSetsPage} />
      <Route path="/ads" component={AdsPage} />
      <Route path="/creatives" component={CreativeGalleryPage} />
      <Route path="/portal" component={PortalPage} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/payments" component={PaymentsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccessGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AccessGate>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
