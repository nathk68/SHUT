import AppRedirect from "@/components/AppRedirect";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [];
}

export default function ReplayRedirect() {
  return <AppRedirect type="replay" />;
}
