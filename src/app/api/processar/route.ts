import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    let files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      const singleFile = formData.get("file") as File;
      if (singleFile) files = [singleFile];
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave GEMINI_API_KEY nao configurada no .env.local" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const allTransactions: any[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

      const prompt = 'Analise este extrato bancario em PDF e extraia todas as transacoes financeiras. Retorne APENAS um array JSON valido. Cada objeto no array deve conter as chaves: Data (string DD/MM/AAAA), Descricao (string limpa), Categoria (classificacao contabil resumida, ex: Salarios/Pessoal, Impostos e Taxas, Fornecedores, Tarifas Bancario, Receitas/Vendas, Transferencias, Emprestimos/Financiamentos, Outros), Valor (numero positivo para entrada/credito e negativo para saida/debito), Tipo (Credito ou Debito). Exemplo: [{"Data":"01/05/2026","Descricao":"PIX RECEBIDO","Categoria":"Receitas/Vendas","Valor":150.00,"Tipo":"Credito"}]';

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Pdf,
            mimeType: "application/pdf",
          },
        },
      ]);

      const responseText = result.response.text().trim();

      if (responseText) {
        const cleanJson = responseText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((t) => {
              allTransactions.push({
                Data: t.Data || "",
                Descricao: t.Descricao || "",
                Categoria: t.Categoria || "Outros",
                Valor: typeof t.Valor === "number" ? t.Valor : parseFloat(t.Valor) || 0,
                Tipo: t.Tipo || (t.Valor >= 0 ? "Credito" : "Debito"),
                Arquivo: file.name,
              });
            });
          }
        } catch (e) {
          console.error("Erro ao converter JSON do arquivo:", file.name, e);
        }
      }
    }

    return NextResponse.json({ success: true, transactions: allTransactions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao processar com IA." },
      { status: 500 }
    );
  }
}