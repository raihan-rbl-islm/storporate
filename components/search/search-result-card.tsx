import Link from "next/link";
import { GraduationCap, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchResultItem } from "@/lib/server/search/queries";

export function SearchResultCard({ result }: { result: SearchResultItem }) {
  if (result.type === "club") {
    const club = result.item;
    return (
      <Link href={`/profile/${club.id}`} className="group block relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-900 border-transparent">Club</Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5" /> {club.university}
            </div>
          </div>
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{club.clubName}</h3>
          {club.mission && <p className="text-sm text-muted-foreground line-clamp-2">{club.mission}</p>}
        </div>
      </Link>
    );
  }

  if (result.type === "corporate") {
    const corp = result.item;
    return (
      <Link href={`/profile/${corp.id}`} className="group block relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-transparent">Company</Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {corp.location}
            </div>
          </div>
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{corp.organizationName}</h3>
          <p className="text-sm text-muted-foreground font-medium">{corp.industry}</p>
          {corp.description && <p className="text-sm text-muted-foreground line-clamp-2">{corp.description}</p>}
        </div>
      </Link>
    );
  }

  return null;
}
