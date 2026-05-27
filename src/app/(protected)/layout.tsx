import { TooltipProvider } from "@/components/ui/tooltip";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}
