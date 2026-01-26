import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
            <SignIn routing="path" path="/sign-in" />
        </div>
    );
}
