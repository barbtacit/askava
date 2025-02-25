"use client";
import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-10 bg-gray-100">
            <div className="bg-white shadow-lg rounded-xl p-10 text-center max-w-3xl">
                <h1 className="text-4xl font-extrabold text-blue-600">Welcome to AskTacit</h1>
                <p className="mt-4 text-lg text-gray-700">
                    Choose an Assistant to help with your project:
                </p>

                <ul className="mt-6 text-lg">
                    <li className="mt-3">
                        ➡ <Link href="/versionRFP" className="text-blue-500 hover:underline">Engineering RFP Assistant</Link>
                    </li>
                    <li className="mt-3">
                        ➡ <Link href="/versionCyber" className="text-blue-500 hover:underline">Cybersecurity Assistant</Link>
                    </li>
                    {/* Add more versions as needed */}
                </ul>
            </div>
        </main>
    );
}