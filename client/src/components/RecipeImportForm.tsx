import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Recipe } from '@/lib/types';

const formSchema = z.object({
  url: z.string().url('有効なURLを入力してください')
});

type FormValues = z.infer<typeof formSchema>;

interface RecipeImportFormProps {
  onRecipeImported: (recipe: Partial<Recipe>) => void;
}

export default function RecipeImportForm({ onRecipeImported }: RecipeImportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: ''
    }
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: 'include',
      });
      
      // レスポンスをパース
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        toast({
          title: 'レシピを取得しました',
          description: result.message,
        });
        onRecipeImported(result.data);
      } else {
        throw new Error(result.message || 'レシピの取得に失敗しました');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラーが発生しました',
        description: error instanceof Error ? error.message : 'レシピのインポートに失敗しました',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>レシピをURLからインポート</CardTitle>
        <CardDescription>
          レシピサイトのURLを入力して、情報を自動的に取得します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>レシピURL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/recipe/12345" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  インポート中...
                </>
              ) : 'レシピを取得する'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>インポートサポート: クックパッド、楽天レシピ、その他一般的なレシピサイト</p>
      </CardFooter>
    </Card>
  );
}