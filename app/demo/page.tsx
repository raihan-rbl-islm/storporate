import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HERO_PERSONAS } from "@/data/personas";
import { selectPersona } from "@/app/demo/actions";

export const metadata = { title: "Demo entry · Storporate" };

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Open the demo</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Choose a prepared persona to step into that role, or sign in with
          Google. Personas ship with prepared profiles and matches so the demo
          lands on real-feeling context, not empty screens.
        </p>

        <h2 className="mt-4 text-2xl font-semibold">Prepared personas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HERO_PERSONAS.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.institution}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{p.scenario}</p>
                <form action={selectPersona} className="mt-4">
                  <input type="hidden" name="personaId" value={p.id} />
                  <Button type="submit" className="w-full">
                    Continue as {p.name}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>

        <div role="separator" className="my-8 border-t" />

        <h2 className="text-2xl font-semibold">Or sign in with Google</h2>
        <form action="/demo/google" method="post">
          <Button variant="outline" type="submit">
            Continue with Google
          </Button>
        </form>

        <p className="text-muted-foreground mt-8 text-xs leading-relaxed">
          Prepared personas are fixtures for evaluation. Names and scenarios
          reference real organizations for scenario realism only — they do not
          imply partnership, endorsement, or audited employment data.
        </p>
      </div>
    </main>
  );
}