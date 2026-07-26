import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const buttonVariantsList = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;

const buttonSizes = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="space-y-2">
          <p className="font-mono text-sm text-muted-foreground">/dev/ui</p>
          <h1 className="text-3xl font-semibold tracking-tight">UI foundation</h1>
          <p className="max-w-2xl text-muted-foreground">
            A reference page for the Storporate design primitives and their available
            variants.
          </p>
        </header>

        <section className="space-y-6" aria-labelledby="buttons-heading">
          <div>
            <p className="font-mono text-sm text-muted-foreground">button</p>
            <h2 id="buttons-heading" className="text-2xl font-semibold">
              Buttons
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <div className="min-w-[720px] divide-y">
              <div className="grid grid-cols-[7rem_repeat(8,minmax(5rem,1fr))] items-center gap-3 bg-muted/50 p-4 text-sm font-medium">
                <span>Variant</span>
                {buttonSizes.map((size) => (
                  <span key={size} className="text-center font-mono text-xs">
                    {size}
                  </span>
                ))}
              </div>
              {buttonVariantsList.map((variant) => (
                <div
                  key={variant}
                  className="grid grid-cols-[7rem_repeat(8,minmax(5rem,1fr))] items-center gap-3 p-4"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {variant}
                  </span>
                  {buttonSizes.map((size) => (
                    <div key={`${variant}-${size}`} className="flex justify-center">
                      <Button
                        variant={variant}
                        size={size}
                        aria-label={`${variant} ${size} button`}
                      >
                        {size.startsWith("icon") || size === "icon" ? (
                          <span aria-hidden="true">•</span>
                        ) : (
                          "Action"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="cards-heading">
          <div>
            <p className="font-mono text-sm text-muted-foreground">card</p>
            <h2 id="cards-heading" className="text-2xl font-semibold">
              Cards
            </h2>
          </div>
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Build with confidence</CardTitle>
              <CardDescription>
                Compose product surfaces from a consistent set of accessible primitives.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This content area demonstrates the standard spacing and surface tokens.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-sm text-muted-foreground">Reference component</span>
            </CardFooter>
          </Card>
        </section>

        <section className="space-y-6" aria-labelledby="inputs-heading">
          <div>
            <p className="font-mono text-sm text-muted-foreground">input</p>
            <h2 id="inputs-heading" className="text-2xl font-semibold">
              Inputs
            </h2>
          </div>
          <div className="grid max-w-3xl gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="default-input" className="text-sm font-medium">
                Default
              </label>
              <Input id="default-input" placeholder="Enter a value" />
            </div>
            <div className="space-y-2">
              <label htmlFor="search-input" className="text-sm font-medium">
                With leading icon
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input id="search-input" className="pl-9" placeholder="Search" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="disabled-input" className="text-sm font-medium">
                Disabled
              </label>
              <Input id="disabled-input" placeholder="Unavailable" disabled />
            </div>
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="badges-heading">
          <div>
            <p className="font-mono text-sm text-muted-foreground">badge</p>
            <h2 id="badges-heading" className="text-2xl font-semibold">
              Badges
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2
            className="motion-safe:animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>Loading…</span>
        </div>
      </div>
    </main>
  );
}
