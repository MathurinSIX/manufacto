import { LoginForm } from "@/components/login-form";

interface LoginPageProps {
  searchParams?: {
    next?: string;
  };
}

export default function Page({ searchParams }: LoginPageProps) {
  const redirectTo =
    typeof searchParams?.next === "string" && searchParams.next.length > 0
      ? searchParams.next
      : undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
