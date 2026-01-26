import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
            <SignUp routing="path" path="/sign-up" />
        </div>
    );
}
