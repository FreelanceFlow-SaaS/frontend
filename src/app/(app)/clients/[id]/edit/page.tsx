import { ClientForm } from "@/modules/clients/components/client-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  return <ClientForm mode="edit" clientId={id} />;
}
