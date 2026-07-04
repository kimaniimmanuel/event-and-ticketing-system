import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · Tikiti" };

export default function SignupPage() {
  return (
    <Card>
      <CardBody className="p-6">
        <h1 className="text-xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Discover events and start hosting your own.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
