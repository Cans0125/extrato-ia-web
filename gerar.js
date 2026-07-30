const fs = require('fs');

const code = `"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
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
    } catch (err) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    
      
        Extrator Contábil IA
        
          Converta extratos bancários em PDF para planilhas Excel (.xlsx) prontas para seu sistema contábil.
        

        
           setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
          />
        

        {file && (
          
            📄 Arquivo selecionado: {file.name}
          
        )}

        {error && (
          
            {error}
          
        )}

        
          {loading ? "Aguarde, a IA está extraindo as transações..." : "Converter para Excel"}
        
      
    
  );
}
`;

fs.writeFileSync('src/app/page.tsx', code, 'utf8');
console.log('✅ Arquivo src/app/page.tsx gerado com sucesso!');