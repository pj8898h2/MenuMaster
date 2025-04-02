import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema, insertMealPlanSchema, insertShoppingListItemSchema } from "@shared/schema";
import { z } from "zod";
import { scrapeRecipe } from "./scraper";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - All routes are prefixed with /api
  
  // Recipe routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const { query, category, cookTime } = req.query;
      let recipes;
      
      if (query || category || cookTime) {
        recipes = await storage.searchRecipes(
          query as string || "",
          category as string,
          cookTime ? parseInt(cookTime as string) : undefined
        );
      } else {
        recipes = await storage.getRecipes();
      }
      
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const validatedData = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(validatedData);
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRecipeSchema.partial().parse(req.body);
      const recipe = await storage.updateRecipe(id, validatedData);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRecipe(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Meal plan routes
  app.get("/api/meal-plans", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let mealPlans;
      
      if (startDate && endDate) {
        mealPlans = await storage.getMealPlansByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        mealPlans = await storage.getMealPlans();
      }
      
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.get("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id);
      
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.post("/api/meal-plans", async (req, res) => {
    try {
      // 日付文字列を処理
      const { date, ...rest } = req.body;
      const parsedData = {
        ...rest,
        date: date ? new Date(date) : undefined,
      };

      const validatedData = insertMealPlanSchema.parse(parsedData);
      const mealPlan = await storage.createMealPlan(validatedData);
      res.status(201).json(mealPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create meal plan" });
    }
  });

  app.put("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 日付文字列を処理
      const { date, ...rest } = req.body;
      const parsedData = {
        ...rest,
        date: date ? new Date(date) : undefined,
      };
      
      const validatedData = insertMealPlanSchema.partial().parse(parsedData);
      const mealPlan = await storage.updateMealPlan(id, validatedData);
      
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update meal plan" });
    }
  });

  app.delete("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMealPlan(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal plan" });
    }
  });

  // Shopping list routes
  app.get("/api/shopping-list", async (req, res) => {
    try {
      const items = await storage.getShoppingListItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shopping list items" });
    }
  });

  app.post("/api/shopping-list", async (req, res) => {
    try {
      const validatedData = insertShoppingListItemSchema.parse(req.body);
      const item = await storage.createShoppingListItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shopping list item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shopping list item" });
    }
  });

  app.put("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertShoppingListItemSchema.partial().parse(req.body);
      const item = await storage.updateShoppingListItem(id, validatedData);
      
      if (!item) {
        return res.status(404).json({ message: "Shopping list item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shopping list item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update shopping list item" });
    }
  });

  app.delete("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteShoppingListItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Shopping list item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shopping list item" });
    }
  });

  // Generate shopping list from meal plans
  app.post("/api/shopping-list/generate", async (req, res) => {
    try {
      const schema = z.object({
        mealPlanIds: z.array(z.number()),
      });
      
      const { mealPlanIds } = schema.parse(req.body);
      const shoppingList = await storage.generateShoppingList(mealPlanIds);
      
      res.json(shoppingList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal plan IDs", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate shopping list" });
    }
  });
  
  // Import recipe from URL
  app.post("/api/recipes/import", async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url(),
      });
      
      const { url } = schema.parse(req.body);
      
      try {
        // URLからレシピデータをスクレイプ
        const recipeData = await scrapeRecipe(url);
        
        // 必須フィールドを確認（レシピ作成に必要な最低限のデータ）
        if (!recipeData.name) {
          return res.status(400).json({ message: "レシピの取得に失敗しました。正しいレシピページのURLか確認してください。" });
        }
        
        // 一時的にデータをクライアントに返す（まだストレージには保存せず）
        res.status(200).json({ 
          status: "success", 
          data: recipeData,
          message: "レシピが正常に取得されました。データを確認してレシピを保存してください。"
        });
      } catch (error) {
        console.error("Recipe import error:", error);
        res.status(400).json({ 
          status: "error", 
          message: error instanceof Error ? error.message : "URLからのレシピ取得に失敗しました。"
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "有効なURLを入力してください", errors: error.errors });
      }
      res.status(500).json({ message: "レシピのインポート処理に失敗しました" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
