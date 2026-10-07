import { AdView } from "@/components/ad-view";
import { pickAd } from "@/lib/ads";
import type { AdPlacement } from "@/lib/media";

type Props = { placement: AdPlacement; target?: { department: string; level: string }; className?: string };

export async function AdSlot({ placement, target, className }: Props) {
  const ad = await pickAd(placement, target);
  return ad ? <AdView key={ad.id} ad={ad} className={className} /> : null;
}
