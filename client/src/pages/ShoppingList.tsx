import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { ja } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ShoppingListItem, MealPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ShoppingList() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<{ name: string; amount: string; category: string }>({
    name: "",
    amount: "",
    category: "other",
  });
  const { toast } = useToast();

  // Calculate start and end dates for the current week
  const startDate = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const endDate = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  
  // Format for display
  const dateRangeDisplay = `${format(startDate, 'MM/dd', { locale: ja })} - ${format(endDate, 'MM/dd', { locale: ja })}`;
  
  // Fetch shopping list items
  const { 
    data: shoppingItems = [],
    isLoading: isLoadingItems,
    isError: isErrorItems
  } = useQuery<ShoppingListItem[]>({
    queryKey: ['/api/shopping-list'],
  });
  
  // Fetch meal plans to generate shopping list
  const { 
    data: mealPlans = [],
    isLoading: isLoadingMealPlans
  } = useQuery<MealPlan[]>({
    queryKey: ['/api/meal-plans', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!res.ok) throw new Error('Failed to fetch meal plans');
      return res.json();
    }
  });
  
  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: { name: string; amount: string; category: string }) => {
      return apiRequest('POST', '/api/shopping-list', {
        ...item,
        checked: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
      toast({ 
        title: "アイテムを追加しました",
        description: "買い物リストにアイテムが追加されました。",
      });
      setNewItem({ name: "", amount: "", category: "other" });
      setIsAddItemDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: "エラー",
        description: "アイテムの追加に失敗しました。",
        variant: "destructive"
      });
    }
  });
  
  // Update item mutation (for checkbox)
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, checked }: { id: number; checked: boolean }) => {
      return apiRequest('PUT', `/api/shopping-list/${id}`, { checked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
    },
    onError: () => {
      toast({ 
        title: "エラー",
        description: "アイテムの更新に失敗しました。",
        variant: "destructive"
      });
    }
  });
  
  // Delete checked items mutation
  const deleteCheckedItemsMutation = useMutation({
    mutationFn: async () => {
      const checkedItems = shoppingItems.filter(item => item.checked);
      return Promise.all(
        checkedItems.map(item => apiRequest('DELETE', `/api/shopping-list/${item.id}`, null))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
      toast({ 
        title: "アイテムを削除しました",
        description: "選択したアイテムが削除されました。",
      });
    },
    onError: () => {
      toast({ 
        title: "エラー",
        description: "アイテムの削除に失敗しました。",
        variant: "destructive"
      });
    }
  });
  
  // Generate shopping list mutation
  const generateShoppingListMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/shopping-list/generate', {
        mealPlanIds: mealPlans.map(mp => mp.id)
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
      toast({ 
        title: "買い物リストを生成しました",
        description: `${data.length}個のアイテムを買い物リストに追加しました。`,
      });
    },
    onError: () => {
      toast({ 
        title: "エラー",
        description: "買い物リストの生成に失敗しました。",
        variant: "destructive"
      });
    }
  });
  
  const handleToggleItem = (id: number, checked: boolean) => {
    updateItemMutation.mutate({ id, checked });
  };
  
  const handleAddItem = () => {
    if (!newItem.name.trim() || !newItem.amount.trim()) {
      toast({
        title: "入力エラー",
        description: "名前と分量を入力してください。",
        variant: "destructive"
      });
      return;
    }
    
    addItemMutation.mutate(newItem);
  };
  
  const handleDeleteCheckedItems = () => {
    const checkedItems = shoppingItems.filter(item => item.checked);
    if (checkedItems.length === 0) {
      toast({
        title: "アイテムが選択されていません",
        description: "削除するアイテムを選択してください。",
      });
      return;
    }
    
    deleteCheckedItemsMutation.mutate();
  };
  
  const handleGenerateShoppingList = () => {
    if (mealPlans.length === 0) {
      toast({
        title: "献立が登録されていません",
        description: "まずは献立カレンダーで献立を登録してください。",
      });
      return;
    }
    
    generateShoppingListMutation.mutate();
  };
  
  // Group items by category
  const groupedItems = shoppingItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ShoppingListItem[]>);
  
  // Category translations
  const categoryTranslations: Record<string, string> = {
    vegetables: "野菜",
    protein: "肉・魚",
    other: "その他"
  };
  
  if (isErrorItems) {
    toast({
      title: "エラー",
      description: "買い物リストの読み込みに失敗しました。",
      variant: "destructive",
    });
  }

  const isLoading = isLoadingItems || isLoadingMealPlans;

  return (
    <section>
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="font-heading font-bold text-2xl text-neutral-800 mb-4 md:mb-0">買い物リスト</h2>
          
          <div className="flex gap-3">
            <Select value={weekOffset.toString()} onValueChange={(value) => setWeekOffset(parseInt(value))}>
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="今週" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">今週 ({format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MM/dd')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MM/dd')})</SelectItem>
                <SelectItem value="1">来週 ({format(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 'MM/dd')} - {format(endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 'MM/dd')})</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="default"
              className="flex items-center"
              onClick={handleGenerateShoppingList}
              disabled={generateShoppingListMutation.isPending}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              生成
            </Button>
            
            <Button 
              variant="outline"
              className="flex items-center"
              onClick={() => window.print()}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              印刷
            </Button>
          </div>
        </div>
      </header>
      
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              
              {[...Array(3)].map((_, categoryIndex) => (
                <div key={categoryIndex} className="border-b pb-4 space-y-2">
                  <Skeleton className="h-5 w-20 mb-3" />
                  {[...Array(4)].map((_, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 rounded-sm mr-2" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-semibold text-lg text-neutral-800">食材リスト ({dateRangeDisplay})</h3>
              <span className="text-sm text-neutral-800">{shoppingItems.length}アイテム</span>
            </div>
            
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {Object.entries(groupedItems).length > 0 ? (
                  Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="border-b pb-4">
                      <h4 className="font-medium text-neutral-800 mb-3">
                        {categoryTranslations[category] || category}
                      </h4>
                      <ul className="space-y-2">
                        {items.map(item => (
                          <li key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Checkbox 
                                id={`item-${item.id}`} 
                                checked={item.checked}
                                onCheckedChange={(checked) => 
                                  handleToggleItem(item.id, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={`item-${item.id}`} 
                                className={`ml-2 text-neutral-800 ${item.checked ? 'line-through text-neutral-400' : ''}`}
                              >
                                {item.name}
                              </Label>
                            </div>
                            <span className="text-sm text-neutral-800">{item.amount}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    買い物リストにアイテムがありません。「生成」ボタンをクリックするか、アイテムを追加してください。
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="mt-6 flex justify-between">
              <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-primary p-0 flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    アイテムを追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>買い物リストにアイテムを追加</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        名前
                      </Label>
                      <Input
                        id="name"
                        className="col-span-3"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">
                        分量
                      </Label>
                      <Input
                        id="amount"
                        className="col-span-3"
                        value={newItem.amount}
                        onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        カテゴリー
                      </Label>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="カテゴリーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vegetables">野菜</SelectItem>
                          <SelectItem value="protein">肉・魚</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">キャンセル</Button>
                    </DialogClose>
                    <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>追加</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="link" 
                className="text-accent p-0 flex items-center"
                onClick={handleDeleteCheckedItems}
                disabled={!shoppingItems.some(item => item.checked)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                選択したアイテムを削除
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
