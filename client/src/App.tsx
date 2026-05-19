import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import YearlyReport from "./pages/YearlyReport";


function Router() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);

  return (
    <Switch>
      <Route path={"/"}>
        {(props) => <Home {...props} onDataChange={(exp, rec) => { setExpenses(exp); setRecurringExpenses(rec); }} />}
      </Route>
      <Route path={"/yearly"}>
        {(props) => <YearlyReport {...props} expenses={expenses} recurringExpenses={recurringExpenses} />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
