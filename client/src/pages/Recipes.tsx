import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Recipe } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Recipes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cookTime, setCookTime] = useState("all");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append("query", searchQuery);
  if (category && category !== "all") queryParams.append("category", category);
  if (cookTime && cookTime !== "all") queryParams.append("cookTime", cookTime);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const { data: recipes, isLoading, error } = useQuery<Recipe[]>({
    queryKey: [`/api/recipes${queryString}`],
  });

  if (error) {
    toast({
      title: "エラー",
      description: "レシピの読み込みに失敗しました。",
      variant: "destructive",
    });
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will be automatically refetched when queryKey changes
  };

  return (
    <section>
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="font-heading font-bold text-2xl text-neutral-800 mb-4 md:mb-0">レシピ検索</h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="レシピを検索..."
                className="w-full md:w-64 pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-2.5 h-4 w-4 text-neutral-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>
            
            <div className="flex space-x-2">
              <div className="relative">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="カテゴリー" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="主菜">主菜</SelectItem>
                    <SelectItem value="副菜">副菜</SelectItem>
                    <SelectItem value="スープ">スープ</SelectItem>
                    <SelectItem value="デザート">デザート</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Select value={cookTime} onValueChange={setCookTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="調理時間" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="15">15分以内</SelectItem>
                    <SelectItem value="30">30分以内</SelectItem>
                    <SelectItem value="60">60分以内</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategory("all");
                  setCookTime("all");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-3 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes && recipes.length > 0 ? (
              recipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onClick={() => setLocation(`/recipe/${recipe.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-neutral-800">該当するレシピがありません。</p>
              </div>
            )}
          </div>
          
          {recipes && recipes.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white transition">
                もっと見る
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
