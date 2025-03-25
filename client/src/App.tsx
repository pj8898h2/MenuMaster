import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Recipes from "@/pages/Recipes";
import MealPlan from "@/pages/MealPlan";
import ShoppingList from "@/pages/ShoppingList";
import RecipeDetail from "@/pages/RecipeDetail";
import Header from "@/components/Header";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainNavigation />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Recipes} />
          <Route path="/recipes" component={Recipes} />
          <Route path="/recipe/:id" component={RecipeDetail} />
          <Route path="/meal-plan" component={MealPlan} />
          <Route path="/shopping-list" component={ShoppingList} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
