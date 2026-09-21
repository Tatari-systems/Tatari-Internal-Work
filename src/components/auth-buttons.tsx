import { GoogleMark } from "@/components/google-mark";
import { signOutToHome } from "@/lib/auth/actions";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form action="/auth/google" method="get">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-control border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-white/12"
      >
        <GoogleMark />
        Continue with Google
      </button>
    </form>
  );
}

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <form action={signOutToHome}>
      <button
        type="submit"
        className="text-sm text-accent transition-colors hover:text-text"
      >
        {label}
      </button>
    </form>
  );
}
