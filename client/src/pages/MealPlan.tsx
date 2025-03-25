import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Recipe, MealPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getWeekDays, formatShortDate } from "@/lib/utils";

type MealSlotProps = {
  date: Date;
  mealType: string;
  mealPlans: MealPlan[];
  recipes: Recipe[];
  onAddMeal: (date: Date, mealType: string) => void;
};

function MealSlot({ date, mealType, mealPlans, recipes, onAddMeal }: MealSlotProps) {
  // Find meal plan for this date and meal type
  const mealPlan = mealPlans.find(
    mp => 
      format(parseISO(mp.date.toString()), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
      mp.mealType === mealType
  );
  
  // Find the recipe if we have a meal plan
  const recipe = mealPlan ? recipes.find(r => r.id === mealPlan.recipeId) : undefined;
  
  return (
    <div 
      className="meal-slot p-2 rounded-lg cursor-pointer mb-2 hover:bg-primary/10 transition duration-200"
      onClick={() => onAddMeal(date, mealType)}
    >
      <div className="text-xs text-neutral-800 font-medium mb-1">
        {mealType === "breakfast" ? "朝食" : mealType === "lunch" ? "昼食" : "夕食"}
      </div>
      {recipe ? (
        <div className="bg-neutral-100 p-2 rounded-lg">
          <span className="text-sm text-neutral-800">{recipe.name}</span>
        </div>
      ) : (
        <div className="h-6 flex items-center justify-center text-xs text-neutral-400">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3 w-3 mr-1"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          追加
        </div>
      )}
    </div>
  );
}

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectingDate, setSelectingDate] = useState<Date | null>(null);
  const [selectingMealType, setSelectingMealType] = useState<string>("");
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Calculate start and end dates for the current week
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Generate weekdays
  const weekdays = getWeekDays();
  
  // Generate dates for the current week
  const dates = Array(7).fill(null).map((_, i) => addDays(startDate, i));
  
  // Fetch recipes
  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
  });
  
  // Fetch meal plans for the current week
  const { 
    data: mealPlans = [], 
    isLoading: isLoadingMealPlans,
    isError 
  } = useQuery<MealPlan[]>({
    queryKey: ['/api/meal-plans', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch meal plans');
      return res.json();
    }
  });
  
  const addMealPlanMutation = useMutation({
    mutationFn: async (data: { date: Date; mealType: string; recipeId: number }) => {
      // Check if there's already a meal plan for this date and meal type
      const existingMealPlan = mealPlans.find(
        mp => 
          format(parseISO(mp.date.toString()), 'yyyy-MM-dd') === format(data.date, 'yyyy-MM-dd') && 
          mp.mealType === data.mealType
      );
      
      if (existingMealPlan) {
        // Update existing meal plan
        return apiRequest('PUT', `/api/meal-plans/${existingMealPlan.id}`, {
          recipeId: data.recipeId
        });
      } else {
        // Create new meal plan
        return apiRequest('POST', '/api/meal-plans', {
          date: data.date.toISOString(),
          mealType: data.mealType,
          recipeId: data.recipeId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      toast({ 
        title: "献立を更新しました",
        description: "献立カレンダーが更新されました。",
      });
      setIsAddMealDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: "エラー",
        description: "献立の更新に失敗しました。",
        variant: "destructive"
      });
    }
  });
  
  // Generate nutrition summary for the current week
  const totalCalories = mealPlans.reduce((sum, mealPlan) => {
    const recipe = recipes.find(r => r.id === mealPlan.recipeId);
    return sum + (recipe?.calories || 0);
  }, 0);
  
  const totalProtein = mealPlans.reduce((sum, mealPlan) => {
    const recipe = recipes.find(r => r.id === mealPlan.recipeId);
    return sum + (recipe?.protein || 0);
  }, 0);
  
  const totalCarbs = mealPlans.reduce((sum, mealPlan) => {
    const recipe = recipes.find(r => r.id === mealPlan.recipeId);
    return sum + (recipe?.carbs || 0);
  }, 0);
  
  const totalFat = mealPlans.reduce((sum, mealPlan) => {
    const recipe = recipes.find(r => r.id === mealPlan.recipeId);
    return sum + (recipe?.fat || 0);
  }, 0);
  
  const handleAddMeal = (date: Date, mealType: string) => {
    setSelectingDate(date);
    setSelectingMealType(mealType);
    setIsAddMealDialogOpen(true);
  };
  
  const handleAddRecipeToMealPlan = (recipeId: number) => {
    if (selectingDate && selectingMealType) {
      addMealPlanMutation.mutate({
        date: selectingDate,
        mealType: selectingMealType,
        recipeId
      });
    }
  };
  
  if (isError) {
    toast({
      title: "エラー",
      description: "献立の読み込みに失敗しました。",
      variant: "destructive",
    });
  }

  return (
    <section>
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="font-heading font-bold text-2xl text-neutral-800 mb-4 md:mb-0">献立カレンダー</h2>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <span className="flex items-center font-medium">
              {format(startDate, 'yyyy年MM月dd日', { locale: ja })} - {format(endDate, 'MM月dd日', { locale: ja })}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button 
              variant="outline" 
              className="border-primary text-primary ml-2"
              onClick={() => setCurrentDate(new Date())}
            >
              今日
            </Button>
          </div>
        </div>
      </header>
      
      {isLoadingMealPlans || isLoadingRecipes ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {weekdays.map((day, index) => (
                <div 
                  key={day} 
                  className={`p-4 border-r last:border-r-0 text-center font-medium ${index >= 5 ? 'text-secondary' : ''}`}
                >
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7">
              {dates.map((date, index) => {
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isWeekend = index >= 5;
                
                return (
                  <div 
                    key={date.toString()} 
                    className={`border-r last:border-r-0 border-b ${isToday ? 'bg-primary bg-opacity-5' : ''}`}
                  >
                    <div className={`p-2 text-right text-sm ${isToday ? 'font-medium' : ''} ${isWeekend ? 'text-secondary' : ''}`}>
                      {format(date, 'd')}
                    </div>
                    <div className="p-2">
                      <MealSlot 
                        date={date} 
                        mealType="breakfast"
                        mealPlans={mealPlans}
                        recipes={recipes}
                        onAddMeal={handleAddMeal}
                      />
                      <MealSlot 
                        date={date} 
                        mealType="lunch"
                        mealPlans={mealPlans}
                        recipes={recipes}
                        onAddMeal={handleAddMeal}
                      />
                      <MealSlot 
                        date={date} 
                        mealType="dinner"
                        mealPlans={mealPlans}
                        recipes={recipes}
                        onAddMeal={handleAddMeal}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-heading font-semibold text-lg text-neutral-800 mb-4">今週の栄養摂取状況</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">総カロリー</h4>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold text-primary">{totalCalories}</span>
                      <span className="text-sm text-neutral-800 ml-1 mb-1">kcal</span>
                    </div>
                    <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(totalCalories / 15000 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">タンパク質</h4>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold text-primary">{totalProtein}</span>
                      <span className="text-sm text-neutral-800 ml-1 mb-1">g</span>
                    </div>
                    <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(totalProtein / 350 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">炭水化物</h4>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold text-accent">{totalCarbs}</span>
                      <span className="text-sm text-neutral-800 ml-1 mb-1">g</span>
                    </div>
                    <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${Math.min(totalCarbs / 700 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">脂質</h4>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold text-secondary">{totalFat}</span>
                      <span className="text-sm text-neutral-800 ml-1 mb-1">g</span>
                    </div>
                    <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary" 
                        style={{ width: `${Math.min(totalFat / 350 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectingDate && (
                <>
                  {formatShortDate(selectingDate)}の
                  {selectingMealType === "breakfast" ? "朝食" : selectingMealType === "lunch" ? "昼食" : "夕食"}を選択
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {recipes.map(recipe => (
              <Card 
                key={recipe.id} 
                className="cursor-pointer hover:shadow-md transition"
                onClick={() => handleAddRecipeToMealPlan(recipe.id)}
              >
                <div className="h-32 overflow-hidden">
                  {recipe.imageUrl && (
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-medium text-neutral-800">{recipe.name}</h3>
                  <div className="flex items-center text-sm mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{recipe.cookTime}分</span>
                    <span className="mx-2">•</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{recipe.servings}人前</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMealDialogOpen(false)}>
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
