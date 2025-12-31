import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ShieldCheck,
  BarChart3,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary rounded-lg p-1">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Borderless</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="/auth/login"
          >
            Login
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-linear-to-b from-primary/5 to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-balance">
                  Tax Compliance Without{" "}
                  <span className="text-primary">Boundaries</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl text-pretty">
                  The all-in-one platform for SMEs to manage VAT, corporate tax,
                  and regulatory filings with ease.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg" className="h-12 px-8 text-lg">
                  <Link href="/auth/sign-up">
                    Start Your Onboarding{" "}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Automated VAT</h3>
                <p className="text-muted-foreground">
                  Automatically compute VAT from your invoices and generate
                  ready-to-file reports.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Building2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Entity Classification</h3>
                <p className="text-muted-foreground">
                  Properly classify your business entities according to the
                  latest tax regulations.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Global Ready</h3>
                <p className="text-muted-foreground">
                  Built for modern businesses operating across jurisdictions
                  with local compliance focus.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-12 border-t">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground">
            © 2025 Borderless Compliance. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              className="text-xs hover:underline underline-offset-4"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-xs hover:underline underline-offset-4"
              href="#"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
