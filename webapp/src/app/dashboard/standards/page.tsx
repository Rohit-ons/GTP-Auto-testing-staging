import { getStandardsOverview } from "@/app/actions/standards";
import StandardsClient from "./StandardsClient";

export default async function StandardsPage() {
  const data = await getStandardsOverview();

  return (
    <div className="animate-fade-in">
      <StandardsClient data={data} />
    </div>
  );
}
