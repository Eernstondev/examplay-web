import type { Metadata } from "next";
import { CourseForm } from "@/components/contrib/course-form";

export const metadata: Metadata = { title: "Proposer un cours" };

export default function Page() {
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Proposer un cours</h1>
      <CourseForm />
    </>
  );
}
