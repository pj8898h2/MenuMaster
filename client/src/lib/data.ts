import { Recipe, MealPlan, ShoppingListItem } from "./types";

// Category options for recipes
export const recipeCategories = [
  { value: "", label: "すべて" },
  { value: "主菜", label: "主菜" },
  { value: "副菜", label: "副菜" },
  { value: "スープ", label: "スープ" },
  { value: "デザート", label: "デザート" }
];

// Cook time options for recipe filtering
export const cookTimeOptions = [
  { value: "", label: "すべて" },
  { value: "15", label: "15分以内" },
  { value: "30", label: "30分以内" },
  { value: "60", label: "60分以内" }
];

// Meal types
export const mealTypes = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" }
];

// Shopping list categories
export const shoppingListCategories = [
  { value: "vegetables", label: "野菜" },
  { value: "protein", label: "肉・魚" },
  { value: "other", label: "その他" }
];
