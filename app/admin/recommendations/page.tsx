import { getRecommendationCategories } from "@/lib/content";
import { RecommendationCategorySection } from "./RecommendationCategorySection";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminRecommendationsPage() {
  const categories = await getRecommendationCategories();

  return (
    <div>
      <h1 className={styles.heading}>Recomendaciones</h1>
      {categories.map((category) => (
        <RecommendationCategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}
