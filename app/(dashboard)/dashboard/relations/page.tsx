import { PageHeader } from "@/components/crm/page-header"
import { RelationsDiagram } from "@/components/crm/relations-diagram"

export const dynamic = "force-static"

export default function RelationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Table relations"
        subtitle="How the data fits together. The CRM flow (Check-in → Student → Membership → Plan) is highlighted. Other domains are grouped by color."
      />
      <RelationsDiagram />
    </div>
  )
}
