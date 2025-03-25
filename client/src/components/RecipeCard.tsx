import { Button } from "@/components/ui/button";
import { Recipe } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type RecipeCardProps = {
  recipe: Recipe;
  onClick: () => void;
};

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const { toast } = useToast();
  
  const addToMealPlanMutation = useMutation({
    mutationFn: async () => {
      const date = new Date();
      
      // Default to dinner for simplicity
      return apiRequest('POST', '/api/meal-plans', {
        date: date.toISOString(),
        mealType: 'dinner',
        recipeId: recipe.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      toast({ 
        title: "献立に追加しました",
        description: `${recipe.name}を献立に追加しました。`,
      });
    },
    onError: () => {
      toast({ 
        title: "エラー",
        description: "献立への追加に失敗しました。",
        variant: "destructive"
      });
    }
  });
  
  const handleAddToMealPlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToMealPlanMutation.mutate();
  };
  
  return (
    <div 
      className="recipe-card bg-white rounded-xl shadow-sm overflow-hidden transition duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48">
        {recipe.imageUrl && (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 right-3 bg-secondary text-white text-xs font-medium px-2 py-1 rounded-full">
          {recipe.cookTime}分
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-accent font-medium text-lg text-neutral-800">{recipe.name}</h3>
        <div className="flex items-center text-sm mt-2 text-neutral-800">
          <span className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1 text-secondary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {recipe.calories || "---"}kcal
          </span>
          <span className="mx-2">•</span>
          <span className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1 text-primary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {recipe.category}
          </span>
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-3 flex gap-1 flex-wrap">
            {recipe.tags.map((tag, index) => (
              <span key={index} className="bg-neutral-100 text-neutral-800 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 h-auto text-primary flex items-center"
            onClick={handleAddToMealPlan}
            disabled={addToMealPlanMutation.isPending}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            献立に追加
          </Button>
          <button className="text-sm text-neutral-800">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
