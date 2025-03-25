import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Recipe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery<Recipe>({
    queryKey: [`/api/recipes/${id}`],
  });

  if (error) {
    toast({
      title: "エラー",
      description: "レシピの読み込みに失敗しました。",
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-80 w-full" />
        <div className="flex flex-wrap gap-4 mb-6">
          <Skeleton className="h-20 w-32" />
          <Skeleton className="h-20 w-32" />
          <Skeleton className="h-20 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2">レシピが見つかりません</h2>
          <p className="text-neutral-600 mb-4">指定されたレシピは存在しないか、削除された可能性があります。</p>
          <Button onClick={() => setLocation("/recipes")}>レシピ一覧に戻る</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-accent font-semibold text-2xl text-neutral-800">{recipe.name}</h1>
        <Button
          variant="outline"
          onClick={() => setLocation("/recipes")}
        >
          ← レシピ一覧に戻る
        </Button>
      </div>
      
      <div className="relative h-80 rounded-xl overflow-hidden mb-6">
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-neutral-100 px-3 py-2 rounded-lg flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-secondary mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-xs text-neutral-800">調理時間</div>
            <div className="font-medium">{recipe.cookTime}分</div>
          </div>
        </div>
        
        <div className="bg-neutral-100 px-3 py-2 rounded-lg flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-secondary mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div>
            <div className="text-xs text-neutral-800">分量</div>
            <div className="font-medium">{recipe.servings}人前</div>
          </div>
        </div>
        
        <div className="bg-neutral-100 px-3 py-2 rounded-lg flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-secondary mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <div className="text-xs text-neutral-800">カロリー</div>
            <div className="font-medium">{recipe.calories || "---"}kcal</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="font-heading font-semibold text-lg text-neutral-800 mb-4">調理手順</h2>
          <ol className="space-y-4 list-decimal list-outside pl-5">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="text-neutral-800">{step}</li>
            ))}
          </ol>
        </div>
        
        <div>
          <h2 className="font-heading font-semibold text-lg text-neutral-800 mb-4">材料</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex justify-between items-center border-b pb-2">
                <span className="text-neutral-800">{ingredient.name}</span>
                <span className="text-neutral-800">{ingredient.amount}</span>
              </li>
            ))}
          </ul>
          
          {(recipe.calories || recipe.protein || recipe.carbs || recipe.fat) && (
            <div className="mt-6">
              <h2 className="font-heading font-semibold text-lg text-neutral-800 mb-4">栄養情報</h2>
              <div className="space-y-3">
                {recipe.calories && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-800">カロリー</span>
                      <span className="text-sm font-medium text-neutral-800">{recipe.calories}kcal</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(recipe.calories / 1000 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                )}
                
                {recipe.protein && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-800">タンパク質</span>
                      <span className="text-sm font-medium text-neutral-800">{recipe.protein}g</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(recipe.protein / 50 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                )}
                
                {recipe.carbs && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-800">炭水化物</span>
                      <span className="text-sm font-medium text-neutral-800">{recipe.carbs}g</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(recipe.carbs / 100 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                )}
                
                {recipe.fat && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-800">脂質</span>
                      <span className="text-sm font-medium text-neutral-800">{recipe.fat}g</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${Math.min(recipe.fat / 50 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
