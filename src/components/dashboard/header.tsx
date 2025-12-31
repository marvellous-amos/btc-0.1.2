import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";

export function DashboardHeader({ user }: { user: User }) {
  const phone = user.phone || "User";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">Borderless Compliance</span>
          <span className="text-xs text-muted-foreground">
            Nigeria SME Tax Platform
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Authenticated
          </span>
          <span className="text-sm font-bold">{phone}</span>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary">
            {phone.slice(-2)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
