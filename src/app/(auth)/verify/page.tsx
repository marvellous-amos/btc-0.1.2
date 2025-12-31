"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

function VerifyForm() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const email = searchParams.get("email"); // Added email support for OTP if needed
  const supabase = createClient();

  useEffect(() => {
    if (!phone && !email) {
      router.replace("/auth/login");
    }
  }, [phone, email, router]);

  const handleVerify = async (value: string) => {
    setOtp(value);
    if (value.length !== 6) return;

    setIsLoading(true);
    try {
      const verifyData: any = {
        token: value,
        type: phone ? "sms" : "magiclink", // or 'email' depending on provider config
      };

      if (phone) {
        verifyData.phone = phone.startsWith("+") ? phone : `+${phone}`;
      } else if (email) {
        verifyData.email = email;
      }

      const { error } = await supabase.auth.verifyOtp(verifyData);

      if (error) throw error;

      toast.success("Authentication successful");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Verify Identity
            </h1>
          </div>
          <Card className="border-none shadow-xl shadow-primary/5">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Enter Code</CardTitle>
              <CardDescription>
                We&apos;ve sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">
                  {phone || email}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="space-y-2">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleVerify}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex flex-col w-full gap-2">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  asChild
                >
                  <Link href="/auth/login" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
