import { Link, useLocation } from "wouter";

export default function MainNavigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    // Special case for root and /recipes
    if (path === "/recipes" && (location === "/" || location === "/recipes")) {
      return true;
    }
    return location === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto">
        <ul className="flex text-neutral-800 font-heading font-medium">
          <li className={`nav-item ${isActive("/recipes") ? "active" : ""}`}>
            <Link href="/recipes" className="block px-5 py-4">
              レシピ
            </Link>
          </li>
          <li className={`nav-item ${isActive("/meal-plan") ? "active" : ""}`}>
            <Link href="/meal-plan" className="block px-5 py-4">
              献立カレンダー
            </Link>
          </li>
          <li className={`nav-item ${isActive("/shopping-list") ? "active" : ""}`}>
            <Link href="/shopping-list" className="block px-5 py-4">
              買い物リスト
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
