import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartnerForm, type PartnerValues } from "@/components/admin/partner-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Partenaire" };

const empty: PartnerValues = {
  category: "sponsor",
  name: "",
  description: "",
  logo_url: "",
  website: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  order_index: 0,
  active: true,
};

export default async function Page({ params }: PageProps<"/admin/partenaires/[id]">) {
  const { id } = await params;
  let values = empty;

  if (id !== "nouveau") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("partners").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    values = {
      id: data.id,
      category: data.category,
      name: data.name,
      description: data.description ?? "",
      logo_url: data.logo_url ?? "",
      website: data.website ?? "",
      facebook: data.facebook ?? "",
      instagram: data.instagram ?? "",
      tiktok: data.tiktok ?? "",
      order_index: data.order_index,
      active: data.active,
    };
  }

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">
        {values.id ? "Modifier le partenaire" : "Nouveau partenaire"}
      </h1>
      <PartnerForm values={values} />
    </>
  );
}
