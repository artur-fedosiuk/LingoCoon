// src/app/test-ai/page.tsx
import { askAI } from '@/lib/actions/ai-actions';

export default async function TestAIPage() {
    let result = "In attesa dell'elaborazione dell'AI...";
    let error: string | null = null;

    try {
        // Invochiamo la nostra Server Action con un prompt di test isolato
        result = await askAI(
            "Sei un software engineer cinico. Rispondi sempre in italiano.",
            "Spiegami in una sola frase cosa pensi del linguaggio JavaScript."
        );
    } catch (e: unknown) {
        error = e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.";
    }

    return (
        <div className="p-10 font-mono min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl mb-4 font-bold border-b pb-2">Test Connessione API AI</h1>
            {error ? (
                <div className="text-red-700 bg-red-100 p-4 rounded border-l-4 border-red-500">
                    ❌ Errore Rilevato: {error}
                </div>
            ) : (
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-l-4 border-blue-500">
                    🤖 Risposta LLM: {result}
                </div>
            )}
        </div>
    );
}