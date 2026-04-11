import { ServiceForm } from "@/modules/services/components/service-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: PageProps) {
  const { id } = await params;
  return <ServiceForm mode="edit" serviceId={id} />;
}
