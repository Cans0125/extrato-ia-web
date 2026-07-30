{
  "name": "teste-extrato-ia",
  "version": "1.0.0",
  "type": "module", 
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs"
}
"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/processar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao processar o arquivo.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "extrato_processado.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <h1 className="text-3xl font-bold mb-2 text-indigo-400">Extrator Contabil IA</h1>
        <p className="text-slate-400 mb-8">
          Converta extratos bancarios em PDF para planilhas Excel (.xlsx) prontas para seu sistema contabil.
        </p>

        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 mb-6 bg-slate-800/50 hover:border-indigo-500 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
          />
        </div>

        {file && (
          <p className="text-sm text-indigo-300 mb-6">
            Arquivo selecionado: <strong>{file.name}</strong>
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-6 bg-red-950/50 border border-red-800 p-3 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30"
        >
          {loading ? "Aguarde, a IA esta extraindo as transacoes..." : "Converter para Excel"}
        </button>
      </div>
    </main>
  );
}