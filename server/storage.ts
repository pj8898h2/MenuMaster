import {
  type Recipe,
  type InsertRecipe,
  type MealPlan,
  type InsertMealPlan,
  type ShoppingListItem,
  type InsertShoppingListItem,
} from "@shared/schema";

export interface IStorage {
  // Recipe methods
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  searchRecipes(query: string, category?: string, cookTime?: number): Promise<Recipe[]>;

  // Meal plan methods
  getMealPlans(): Promise<MealPlan[]>;
  getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: number): Promise<boolean>;

  // Shopping list methods
  getShoppingListItems(): Promise<ShoppingListItem[]>;
  getShoppingListItem(id: number): Promise<ShoppingListItem | undefined>;
  createShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(id: number, item: Partial<InsertShoppingListItem>): Promise<ShoppingListItem | undefined>;
  deleteShoppingListItem(id: number): Promise<boolean>;
  generateShoppingList(mealPlanIds: number[]): Promise<ShoppingListItem[]>;
}

export class MemStorage implements IStorage {
  private recipes: Map<number, Recipe>;
  private mealPlans: Map<number, MealPlan>;
  private shoppingListItems: Map<number, ShoppingListItem>;
  private recipeIdCounter: number;
  private mealPlanIdCounter: number;
  private shoppingListItemIdCounter: number;

  constructor() {
    this.recipes = new Map();
    this.mealPlans = new Map();
    this.shoppingListItems = new Map();
    this.recipeIdCounter = 1;
    this.mealPlanIdCounter = 1;
    this.shoppingListItemIdCounter = 1;

    // Initialize with sample recipes
    this.initializeRecipes();
  }

  private initializeRecipes() {
    const sampleRecipes: InsertRecipe[] = [
      {
        name: "彩り野菜のグリルサラダ",
        description: "新鮮な季節の野菜をグリルした、栄養満点のサラダです。",
        cookTime: 20,
        servings: 2,
        calories: 320,
        protein: 8,
        carbs: 18,
        fat: 24,
        category: "副菜",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        tags: ["ベジタリアン", "低カロリー"],
        ingredients: [
          { name: "パプリカ（赤・黄）", amount: "各1/2個" },
          { name: "ズッキーニ", amount: "1本" },
          { name: "ナス", amount: "1/2本" },
          { name: "フェタチーズ", amount: "50g" },
          { name: "オリーブオイル", amount: "大さじ2" },
          { name: "バルサミコ酢", amount: "大さじ1" },
          { name: "蜂蜜", amount: "小さじ1" },
          { name: "塩・こしょう", amount: "適量" }
        ],
        instructions: [
          "野菜（パプリカ、ズッキーニ、ナス）を一口大に切る。",
          "オリーブオイル、塩、こしょうで下味をつける。",
          "オーブンを200度に予熱し、野菜を並べたトレイを15分間焼く。",
          "別のボウルで、オリーブオイル、バルサミコ酢、蜂蜜、塩、こしょうを混ぜてドレッシングを作る。",
          "焼きあがった野菜を皿に盛り、ドレッシングをかける。",
          "フェタチーズを砕いて散らし、必要に応じて新鮮なハーブを飾る。"
        ]
      },
      {
        name: "具沢山味噌汁",
        description: "栄養たっぷりの具材を使った、体が温まる味噌汁です。",
        cookTime: 15,
        servings: 4,
        calories: 120,
        protein: 6,
        carbs: 12,
        fat: 5,
        category: "スープ",
        imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554",
        tags: ["日本料理", "低カロリー"],
        ingredients: [
          { name: "豆腐", amount: "1/2丁" },
          { name: "わかめ", amount: "10g" },
          { name: "長ねぎ", amount: "1/2本" },
          { name: "にんじん", amount: "1/4本" },
          { name: "だし汁", amount: "800ml" },
          { name: "味噌", amount: "大さじ3" }
        ],
        instructions: [
          "だし汁を鍋に入れて火にかける。",
          "にんじんを小さく切って鍋に入れ、煮る。",
          "豆腐を一口大に切り、鍋に加える。",
          "わかめを水で戻し、鍋に加える。",
          "火を弱め、味噌を溶き入れる。",
          "刻んだ長ねぎを加えて火を止める。"
        ]
      },
      {
        name: "鮭の塩焼き",
        description: "シンプルながら美味しい、定番の和食料理です。",
        cookTime: 25,
        servings: 2,
        calories: 220,
        protein: 22,
        carbs: 2,
        fat: 14,
        category: "主菜",
        imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
        tags: ["高たんぱく", "魚料理"],
        ingredients: [
          { name: "生鮭", amount: "2切れ" },
          { name: "塩", amount: "小さじ1/2" },
          { name: "レモン", amount: "1/2個" }
        ],
        instructions: [
          "鮭に軽く塩をふり、10分ほど置く。",
          "フライパンを中火で熱し、鮭の皮目を下にして焼く。",
          "皮目がカリッとしたら裏返し、さらに3～4分焼く。",
          "火が通ったら皿に盛り、レモンを添える。"
        ]
      },
      {
        name: "牛肉の赤ワイン煮込み",
        description: "じっくり煮込んだ牛肉の旨みと赤ワインの風味が絶妙な一品です。",
        cookTime: 90,
        servings: 4,
        calories: 450,
        protein: 28,
        carbs: 20,
        fat: 25,
        category: "主菜",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        tags: ["肉料理", "洋食"],
        ingredients: [
          { name: "牛肉（煮込み用）", amount: "500g" },
          { name: "玉ねぎ", amount: "2個" },
          { name: "にんじん", amount: "2本" },
          { name: "セロリ", amount: "1本" },
          { name: "にんにく", amount: "2片" },
          { name: "赤ワイン", amount: "300ml" },
          { name: "トマト缶", amount: "1缶" },
          { name: "ローリエ", amount: "2枚" },
          { name: "小麦粉", amount: "大さじ2" },
          { name: "バター", amount: "30g" },
          { name: "オリーブオイル", amount: "大さじ2" },
          { name: "塩・こしょう", amount: "適量" }
        ],
        instructions: [
          "牛肉を一口大に切り、塩こしょうをして小麦粉をまぶす。",
          "鍋にオリーブオイルとバターを熱し、牛肉を表面が焼けるまで炒める。",
          "みじん切りにした玉ねぎ、にんじん、セロリ、にんにくを加えて炒める。",
          "赤ワインを加えてアルコールを飛ばし、トマト缶、ローリエを加える。",
          "弱火で約1時間煮込む。",
          "塩こしょうで味を調え、皿に盛る。"
        ]
      }
    ];

    sampleRecipes.forEach(recipe => this.createRecipe(recipe));
  }

  // Recipe methods
  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = this.recipeIdCounter++;
    const newRecipe: Recipe = { ...recipe, id };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async updateRecipe(
    id: number,
    recipe: Partial<InsertRecipe>
  ): Promise<Recipe | undefined> {
    const existingRecipe = this.recipes.get(id);
    if (!existingRecipe) return undefined;

    const updatedRecipe = { ...existingRecipe, ...recipe };
    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    return this.recipes.delete(id);
  }

  async searchRecipes(
    query: string,
    category?: string,
    cookTime?: number
  ): Promise<Recipe[]> {
    let recipes = Array.from(this.recipes.values());

    if (query) {
      const lowerQuery = query.toLowerCase();
      recipes = recipes.filter(
        recipe =>
          recipe.name.toLowerCase().includes(lowerQuery) ||
          (recipe.description && recipe.description.toLowerCase().includes(lowerQuery))
      );
    }

    if (category) {
      recipes = recipes.filter(recipe => recipe.category === category);
    }

    if (cookTime) {
      recipes = recipes.filter(recipe => recipe.cookTime <= cookTime);
    }

    return recipes;
  }

  // Meal plan methods
  async getMealPlans(): Promise<MealPlan[]> {
    return Array.from(this.mealPlans.values());
  }

  async getMealPlansByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<MealPlan[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return Array.from(this.mealPlans.values()).filter(mealPlan => {
      const mealPlanDate = new Date(mealPlan.date).getTime();
      return mealPlanDate >= start && mealPlanDate <= end;
    });
  }

  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    return this.mealPlans.get(id);
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const id = this.mealPlanIdCounter++;
    const newMealPlan: MealPlan = { ...mealPlan, id };
    this.mealPlans.set(id, newMealPlan);
    return newMealPlan;
  }

  async updateMealPlan(
    id: number,
    mealPlan: Partial<InsertMealPlan>
  ): Promise<MealPlan | undefined> {
    const existingMealPlan = this.mealPlans.get(id);
    if (!existingMealPlan) return undefined;

    const updatedMealPlan = { ...existingMealPlan, ...mealPlan };
    this.mealPlans.set(id, updatedMealPlan);
    return updatedMealPlan;
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    return this.mealPlans.delete(id);
  }

  // Shopping list methods
  async getShoppingListItems(): Promise<ShoppingListItem[]> {
    return Array.from(this.shoppingListItems.values());
  }

  async getShoppingListItem(id: number): Promise<ShoppingListItem | undefined> {
    return this.shoppingListItems.get(id);
  }

  async createShoppingListItem(
    item: InsertShoppingListItem
  ): Promise<ShoppingListItem> {
    const id = this.shoppingListItemIdCounter++;
    const newItem: ShoppingListItem = { ...item, id };
    this.shoppingListItems.set(id, newItem);
    return newItem;
  }

  async updateShoppingListItem(
    id: number,
    item: Partial<InsertShoppingListItem>
  ): Promise<ShoppingListItem | undefined> {
    const existingItem = this.shoppingListItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem = { ...existingItem, ...item };
    this.shoppingListItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteShoppingListItem(id: number): Promise<boolean> {
    return this.shoppingListItems.delete(id);
  }

  async generateShoppingList(mealPlanIds: number[]): Promise<ShoppingListItem[]> {
    // Get all meal plans by ids
    const mealPlans = mealPlanIds.map(id => this.mealPlans.get(id)).filter(Boolean) as MealPlan[];
    
    // Get all recipes for these meal plans
    const recipePromises = mealPlans.map(mealPlan => this.getRecipe(mealPlan.recipeId));
    const recipes = (await Promise.all(recipePromises)).filter(Boolean) as Recipe[];
    
    // Create a map to consolidate ingredients
    const ingredientMap = new Map<string, { name: string; amount: string; category: string }>();
    
    // Process all ingredients from recipes
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        // Determine category based on ingredient name (simplified)
        let category = "other";
        const name = ingredient.name.toLowerCase();
        
        if (name.includes("肉") || name.includes("魚") || name.includes("鮭") || name.includes("豆腐")) {
          category = "protein";
        } else if (name.includes("野菜") || name.includes("人参") || name.includes("玉ねぎ") || 
                  name.includes("パプリカ") || name.includes("ズッキーニ") ||
                  name.includes("ナス") || name.includes("にんじん") || name.includes("セロリ")) {
          category = "vegetables";
        }
        
        // If ingredient already exists, we could combine amounts but for simplicity we'll just keep it
        if (!ingredientMap.has(ingredient.name)) {
          ingredientMap.set(ingredient.name, { 
            name: ingredient.name, 
            amount: ingredient.amount,
            category
          });
        }
      });
    });
    
    // Convert map to shopping list items
    this.shoppingListItems.clear();
    this.shoppingListItemIdCounter = 1;
    
    const shoppingList: ShoppingListItem[] = [];
    
    for (const [_, ingredient] of ingredientMap) {
      const item: InsertShoppingListItem = {
        name: ingredient.name,
        amount: ingredient.amount,
        category: ingredient.category,
        checked: false
      };
      
      const newItem = await this.createShoppingListItem(item);
      shoppingList.push(newItem);
    }
    
    return shoppingList;
  }
}

export const storage = new MemStorage();
