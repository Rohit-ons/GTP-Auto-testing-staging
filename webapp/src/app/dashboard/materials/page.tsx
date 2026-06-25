import { getMaterials } from "@/app/actions/materials";
import MaterialsClient from "./MaterialsClient";

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <div className="animate-fade-in">
      <MaterialsClient materials={materials} />
    </div>
  );
}
