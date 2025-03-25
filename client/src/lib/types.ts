import { Recipe as RecipeFromSchema, MealPlan as MealPlanFromSchema, ShoppingListItem as ShoppingListItemFromSchema } from "@shared/schema";

// Re-export types from schema
export type Recipe = RecipeFromSchema;
export type MealPlan = MealPlanFromSchema;
export type ShoppingListItem = ShoppingListItemFromSchema;
