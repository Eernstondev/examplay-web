import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdForm, type AdValues } from "@/components/admin/ad-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Publicité" };

const empty: AdValues = {
  title: "",
  image_url: "",
  media_type: "image",
  link_url: "",
  placements: ["dashboard"],
  departments: [],
  audience: "all",
  starts_on: "",
  ends_on: "",
  active: true,
};

export default async function Page({ params }: PageProps<"/admin/publicites/[id]">) {
  const { id } = await params;
  let values = empty;

  if (id !== "nouveau") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("ads").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    values = {
      id: data.id,
      title: data.title,
      image_url: data.image_url,
      media_type: data.media_type,
      link_url: data.link_url ?? "",
      placements: data.placements,
      departments: data.departments,
      audience: data.audience,
      starts_on: data.starts_on ?? "",
      ends_on: data.ends_on ?? "",
      active: data.active,
    };
  }

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">
        {values.id ? "Modifier la publicité" : "Nouvelle publicité"}
      </h1>
      <AdForm values={values} />
    </>
  );
}
