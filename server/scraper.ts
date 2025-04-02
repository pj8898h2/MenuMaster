import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertRecipe } from '../shared/schema';

/**
 * レシピをURLからスクレイプする関数
 * @param url スクレイプするレシピのURL
 * @returns パース済みのレシピデータ
 */
export async function scrapeRecipe(url: string): Promise<Partial<InsertRecipe>> {
  try {
    // URLからHTMLを取得
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // 基本的なレシピ情報の抽出
    // 注: 実際のサイト構造に合わせて選択子を調整する必要があります
    let recipeName = $('h1').first().text().trim() || 'レシピ名取得できませんでした';
    let recipeDescription = $('meta[name="description"]').attr('content') || '';
    
    // カテゴリと調理時間の推定（一般的なレシピサイトからの抽出を試みる）
    let category = '';
    let cookTime = 0;
    
    // カテゴリの抽出を試みる（さまざまなパターンで検索）
    const categorySelectors = [
      '.recipe-category', 
      '[itemprop="recipeCategory"]',
      '.category',
      // 追加のセレクターを必要に応じて追加
    ];
    
    for (const selector of categorySelectors) {
      const categoryElem = $(selector);
      if (categoryElem.length > 0) {
        category = categoryElem.text().trim();
        break;
      }
    }
    
    // 調理時間の抽出を試みる
    const timeSelectors = [
      '[itemprop="totalTime"]',
      '.cook-time', 
      '.prep-time',
      // 追加のセレクターを必要に応じて追加
    ];
    
    for (const selector of timeSelectors) {
      const timeElem = $(selector);
      if (timeElem.length > 0) {
        const timeText = timeElem.text().trim();
        // 数字を抽出
        const timeMatch = timeText.match(/\d+/);
        if (timeMatch) {
          cookTime = parseInt(timeMatch[0], 10);
          break;
        }
      }
    }
    
    // 材料の抽出を試みる
    const ingredients: string[] = [];
    const ingredientSelectors = [
      '[itemprop="recipeIngredient"]',
      '.ingredient',
      '.ingredients li',
      // 追加のセレクターを必要に応じて追加
    ];
    
    for (const selector of ingredientSelectors) {
      const ingredientElems = $(selector);
      if (ingredientElems.length > 0) {
        ingredientElems.each((_, elem) => {
          const ingredient = $(elem).text().trim();
          if (ingredient) {
            ingredients.push(ingredient);
          }
        });
        break;
      }
    }
    
    // 手順の抽出を試みる
    const instructions: string[] = [];
    const instructionSelectors = [
      '[itemprop="recipeInstructions"]',
      '.instructions li',
      '.steps li',
      // 追加のセレクターを必要に応じて追加
    ];
    
    for (const selector of instructionSelectors) {
      const instructionElems = $(selector);
      if (instructionElems.length > 0) {
        instructionElems.each((_, elem) => {
          const instruction = $(elem).text().trim();
          if (instruction) {
            instructions.push(instruction);
          }
        });
        break;
      }
    }

    // 構造化データからの抽出も試みる
    const jsonLd = $('script[type="application/ld+json"]');
    if (jsonLd.length > 0) {
      try {
        let foundStructuredData = false;
        jsonLd.each((_, elem) => {
          if (foundStructuredData) return;
          
          try {
            const data = JSON.parse($(elem).html() || '{}');
            
            // Recipe型のデータを探す
            const recipeData = data['@type'] === 'Recipe' ? data : 
                               data['@graph']?.find((item: any) => item['@type'] === 'Recipe');
            
            if (recipeData) {
              foundStructuredData = true;
              
              // 基本情報の上書き（もし構造化データに存在すれば）
              if (recipeData.name) recipeName = recipeData.name;
              if (recipeData.description) recipeDescription = recipeData.description;
              if (recipeData.recipeCategory) category = recipeData.recipeCategory;
              
              // 調理時間
              if (recipeData.totalTime) {
                const timeMatch = recipeData.totalTime.match(/PT(\d+)M/);
                if (timeMatch) {
                  cookTime = parseInt(timeMatch[1], 10);
                }
              } else if (recipeData.cookTime) {
                const timeMatch = recipeData.cookTime.match(/PT(\d+)M/);
                if (timeMatch) {
                  cookTime = parseInt(timeMatch[1], 10);
                }
              }
              
              // 材料
              if (recipeData.recipeIngredient && Array.isArray(recipeData.recipeIngredient)) {
                ingredients.length = 0; // 既存の材料をクリア
                recipeData.recipeIngredient.forEach((ingredient: string) => {
                  ingredients.push(ingredient.trim());
                });
              }
              
              // 手順
              if (recipeData.recipeInstructions) {
                instructions.length = 0; // 既存の手順をクリア
                
                if (Array.isArray(recipeData.recipeInstructions)) {
                  recipeData.recipeInstructions.forEach((instruction: any) => {
                    const text = typeof instruction === 'string' ? instruction : instruction.text;
                    if (text) instructions.push(text.trim());
                  });
                } else if (typeof recipeData.recipeInstructions === 'string') {
                  instructions.push(recipeData.recipeInstructions.trim());
                }
              }
            }
          } catch (e) {
            // JSONの解析に失敗した場合は無視
            console.error('Failed to parse LD+JSON data:', e);
          }
        });
      } catch (e) {
        console.error('Error processing structured data:', e);
      }
    }

    // 材料のフォーマット変換（JSONオブジェクトの配列に）
    const formattedIngredients = ingredients.map(ing => ({
      name: ing,
      amount: '適量' // デフォルト値として「適量」を設定
    }));

    // 抽出したデータを返す
    return {
      name: recipeName,
      description: recipeDescription,
      category: category || 'その他',
      cookTime: cookTime || 30, // デフォルト30分
      servings: 2, // デフォルト値
      ingredients: formattedIngredients,
      instructions: instructions,
      tags: []
    };
  } catch (error) {
    console.error('Recipe scraping failed:', error);
    throw new Error('レシピの取得に失敗しました。URLを確認してください。');
  }
}