import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type GroupLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    groupSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: GroupLayoutProps): Promise<Metadata> {
  const { groupSlug } = await params;
  const group = await prisma.restaurantGroup.findUnique({
    where: {
      slug: groupSlug,
    },
    select: {
      name: true,
      description: true,
    },
  });

  if (!group) {
    return {};
  }

  return {
    title: `${group.name} | Menui`,
    description: group.description || `Grupo gastronomico ${group.name} en Menui.`,
    manifest: `/${groupSlug}/manifest.webmanifest`,
  };
}

export default function GroupLayout({ children }: GroupLayoutProps) {
  return children;
}
