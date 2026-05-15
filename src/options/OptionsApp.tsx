import { useEffect } from 'react';

export function OptionsApp() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Paperlight Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          AI key and model configuration. Full options panel arrives in STEP 4.
        </p>
      </header>
      <div className="card p-5">
        <p className="text-sm text-fg-muted">
          The full options UI (provider selection, API keys, target language, model picker) is
          implemented in STEP 4 once the AI layer lands. For now this page exists so the Chrome
          extension manifest validates and the build pipeline is exercised end-to-end.
        </p>
      </div>
    </div>
  );
}
