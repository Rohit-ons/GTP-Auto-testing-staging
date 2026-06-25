import { getDesignOptions } from "@/app/actions/gtp";
import DesignFormClient from "./DesignFormClient";

export default async function DesignPage() {
  const options = await getDesignOptions();
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">
            Cable Design <span className="text-gradient">Workbench</span>
          </h1>
          <p className="page-header-subtitle">
            Tweak the design inputs — dimensions, resistances and the full GTP are fetched live from the IS standards master.
          </p>
        </div>
      </div>
      <DesignFormClient options={options} />
    </div>
  );
}
