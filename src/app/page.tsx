'use client';

import { useState } from "react";
import * as XLSX from "xlsx";

interface Transaction {
    id: number;
    Data: string;
    Descricao: string;
    Categoria: string;
    Valor: number;
    Tipo: string;
    Arquivo: string;
}

export default function Home() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"extrator" | "dre" | "fluxo" | "auditoria" | "custos" | "notas">("extrator");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const res = await fetch("/api/processar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao processar arquivos.");

            const formatted = (data.transactions || []).map((item: any, idx: number) => ({
                ...item,
                id: idx + 1,
                Valor: typeof item.Valor === "number" ? item.Valor : parseFloat(item.Valor) || 0
            }));

            setTransactions(formatted);
            setActiveTab("extrator");
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        const totalEntradas = transactions.filter(t => t.Valor > 0).reduce((sum, t) => sum + t.Valor, 0);
        const totalSaidas = transactions.filter(t => t.Valor < 0).reduce((sum, t) => sum + t.Valor, 0);
        const saldoLiquido = totalEntradas + totalSaidas;

        const rows = transactions.map((t) => ({
            Data: t.Data,
            "Descrição Contábil": t.Descricao,
            "Categoria / Conta": t.Categoria,
            Tipo: t.Tipo,
            "Valor (R$)": t.Valor,
            "Arquivo Origem": t.Arquivo,
        }));

        rows.push({ Data: "", "Descrição Contábil": "", "Categoria / Conta": "", Tipo: "", "Valor (R$)": 0, "Arquivo Origem": "" });
        rows.push({ Data: "TOTAL ENTRADAS", "Descrição Contábil": "", "Categoria / Conta": "CRÉDITOS", Tipo: "Credito", "Valor (R$)": totalEntradas, "Arquivo Origem": "" });
        rows.push({ Data: "TOTAL SAÍDAS", "Descrição Contábil": "", "Categoria / Conta": "DÉBITOS", Tipo: "Debito", "Valor (R$)": totalSaidas, "Arquivo Origem": "" });
        rows.push({ Data: "SALDO LÍQUIDO", "Descrição Contábil": "", "Categoria / Conta": "RESULTADO", Tipo: saldoLiquido >= 0 ? "Credito" : "Debito", "Valor (R$)": saldoLiquido, "Arquivo Origem": "" });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        worksheet["!cols"] = [{ wch: 15 }, { wch: 45 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 20 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Extrato Contabil");
        XLSX.writeFile(workbook, "extrato_contabil_ia_pro.xlsx");
    };

    const filteredTransactions = transactions.filter(
        (t) =>
            t.Descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.Categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.Data.includes(searchTerm)
    );

    const totalCreditos = transactions.filter((t) => t.Valor > 0).reduce((acc, t) => acc + t.Valor, 0);
    const totalDebitos = transactions.filter((t) => t.Valor < 0).reduce((acc, t) => acc + t.Valor, 0);
    const saldoLiquido = totalCreditos + totalDebitos;

    // Cálculos para Serviços Contábeis Avançados
    const receitasDRE = totalCreditos;
    const despesasDRE = Math.abs(totalDebitos);
    const resultadoDRE = receitasDRE - despesasDRE;

    // Agrupamento por Categoria (Centro de Custos)
    const custosPorCategoria: { [key: string]: number } = {};
    transactions.forEach((t) => {
        const cat = t.Categoria || "Outros";
        custosPorCategoria[cat] = (custosPorCategoria[cat] || 0) + t.Valor;
    });

    // Detecção de Anomalias simples para Auditoria
    const transacoesSuspeitas = transactions.filter((t, idx, self) =>
        self.some((other, oIdx) => oIdx !== idx && other.Valor === t.Valor && other.Descricao === t.Descricao)
    );

    return (
        <main style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f8fafc", padding: "30px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            <div style={{ maxWidth: "1250px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "25px" }}>

                {/* Cabeçalho */}
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <h1 style={{ fontSize: "34px", fontWeight: "800", color: "#818cf8", margin: 0 }}>
                        Extrator Contábil IA Pro
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "15px", maxWidth: "650px", margin: "0 auto" }}>
                        Plataforma inteligente de análise de extratos, auditoria, DRE gerencial e projeções contábeis.
                    </p>
                </div>

                {/* Bloco de Upload */}
                <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}>
                    <div style={{ border: "2px dashed #374151", borderRadius: "12px", padding: "30px", textAlign: "center", backgroundColor: "#0f172a88" }}>
                        <input
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={handleFileChange}
                            style={{ display: "block", margin: "0 auto", color: "#94a3b8" }}
                        />
                        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
                            Envie um ou múltiplos extratos bancários em PDF.
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div style={{ marginTop: "15px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {files.map((file, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "#1f2937", border: "1px solid #374151", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}>
                                        <span style={{ color: "#818cf8", marginRight: "8px" }}>{file.name}</span>
                                        <button onClick={() => removeFile(idx)} style={{ color: "#f87171", background: "none", border: "none", fontWeight: "bold", cursor: "pointer" }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ backgroundColor: "#450a0a", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "12px", borderRadius: "8px", marginTop: "15px", fontSize: "13px" }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleProcess}
                        disabled={files.length === 0 || loading}
                        style={{ width: "100%", marginTop: "15px", padding: "14px", borderRadius: "10px", fontWeight: "bold", color: "#ffffff", backgroundColor: files.length === 0 || loading ? "#4b5563" : "#4f46e5", border: "none", cursor: files.length === 0 || loading ? "not-allowed" : "pointer", fontSize: "15px" }}
                    >
                        {loading ? "A IA está processando os relatórios contábeis..." : `Processar ${files.length} Extrato(s) com IA`}
                    </button>
                </div>

                {/* NAVEGAÇÃO DE SERVIÇOS (TABS) - Habilitado quando houver dados */}
                {transactions.length > 0 && (
                    <div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #1f2937", paddingBottom: "15px" }}>
                            <button
                                onClick={() => setActiveTab("extrator")}
                                style={{ padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", backgroundColor: activeTab === "extrator" ? "#4f46e5" : "#1f2937", color: activeTab === "extrator" ? "#ffffff" : "#94a3b8", border: "none" }}
                            >
                                📊 Extrato & Transações
                            </button>
                            <button
                                onClick={() => setActiveTab("dre")}
                                style={{ padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", backgroundColor: activeTab === "dre" ? "#4f46e5" : "#1f2937", color: activeTab === "dre" ? "#ffffff" : "#94a3b8", border: "none" }}
                            >
                                📈 DRE Gerencial
                            </button>
                            <button
                                onClick={() => setActiveTab("fluxo")}
                                style={{ padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", backgroundColor: activeTab === "fluxo" ? "#4f46e5" : "#1f2937", color: activeTab === "fluxo" ? "#ffffff" : "#94a3b8", border: "none" }}
                            >
                                ⏳ Projeção de Caixa
                            </button>
                            <button
                                onClick={() => setActiveTab("auditoria")}
                                style={{ padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", backgroundColor: activeTab === "auditoria" ? "#4f46e5" : "#1f2937", color: activeTab === "auditoria" ? "#ffffff" : "#94a3b8", border: "none" }}
                            >
                                🔍 Auditoria & Alertas ({transacoesSuspeitas.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("custos")}
                                style={{ padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", backgroundColor: activeTab === "custos" ? "#4f46e5" : "#1f2937", color: activeTab === "custos" ? "#ffffff" : "#94a3b8", border: "none" }}
                            >
                                🏢 Centro de Custos
                            </button>
                            <button
                                onClick={() => setActiveTab("notas")}
                                style={{ padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", backgroundColor: activeTab === "notas" ? "#4f46e5" : "#1f2937", color: activeTab === "notas" ? "#ffffff" : "#94a3b8", border: "none" }}
                            >
                                📑 Cruzamento NFe / XML
                            </button>
                        </div>

                        {/* CONTEÚDO DA ABA: EXTRATOR & TABELA */}
                        {activeTab === "extrator" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                                    <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "18px" }}>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Total Créditos</span>
                                        <p style={{ fontSize: "22px", fontWeight: "bold", color: "#34d399", margin: "6px 0 0 0" }}>R$ {totalCreditos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "18px" }}>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Total Débitos</span>
                                        <p style={{ fontSize: "22px", fontWeight: "bold", color: "#f87171", margin: "6px 0 0 0" }}>R$ {totalDebitos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "18px" }}>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Saldo Líquido</span>
                                        <p style={{ fontSize: "22px", fontWeight: "bold", color: saldoLiquido >= 0 ? "#818cf8" : "#fbbf24", margin: "6px 0 0 0" }}>R$ {saldoLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "18px" }}>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Lançamentos</span>
                                        <p style={{ fontSize: "22px", fontWeight: "bold", color: "#e2e8f0", margin: "6px 0 0 0" }}>{transactions.length}</p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", backgroundColor: "#111827", padding: "15px", borderRadius: "12px", border: "1px solid #1f2937" }}>
                                    <input
                                        type="text"
                                        placeholder="Filtrar lançamentos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ flex: 1, minWidth: "260px", backgroundColor: "#0f172a", border: "1px solid #374151", borderRadius: "8px", padding: "10px 14px", color: "#f8fafc", fontSize: "13px", outline: "none" }}
                                    />
                                    <button
                                        onClick={exportToExcel}
                                        style={{ padding: "10px 20px", backgroundColor: "#059669", color: "white", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                                    >
                                        📥 Baixar Excel (.xlsx) com Resumo
                                    </button>
                                </div>

                                <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", overflow: "hidden" }}>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", color: "#cbd5e1" }}>
                                            <thead>
                                                <tr style={{ backgroundColor: "#030712", color: "#94a3b8", textTransform: "uppercase", fontSize: "10px", borderBottom: "1px solid #1f2937" }}>
                                                    <th style={{ padding: "14px" }}>Data</th>
                                                    <th style={{ padding: "14px" }}>Descrição Contábil</th>
                                                    <th style={{ padding: "14px" }}>Categoria / Conta</th>
                                                    <th style={{ padding: "14px" }}>Tipo</th>
                                                    <th style={{ padding: "14px", textAlign: "right" }}>Valor (R$)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTransactions.map((t) => (
                                                    <tr key={t.id} style={{ borderBottom: "1px solid #1f2937" }}>
                                                        <td style={{ padding: "14px", fontFamily: "monospace" }}>{t.Data}</td>
                                                        <td style={{ padding: "14px", fontWeight: "500", color: "#f8fafc" }}>{t.Descricao}</td>
                                                        <td style={{ padding: "14px", color: "#818cf8" }}>{t.Categoria}</td>
                                                        <td style={{ padding: "14px" }}>
                                                            <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", backgroundColor: t.Tipo === "Credito" ? "#064e3b" : "#4c0519", color: t.Tipo === "Credito" ? "#34d399" : "#f87171" }}>
                                                                {t.Tipo}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "14px", textAlign: "right", fontWeight: "bold", color: t.Valor >= 0 ? "#34d399" : "#f87171" }}>
                                                            R$ {t.Valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTEÚDO DA ABA: DRE GERENCIAL */}
                        {activeTab === "dre" && (
                            <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "25px", marginTop: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#818cf8", marginBottom: "20px" }}>Demonstração do Resultado do Exercício (DRE Gerencial)</h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#1f2937", borderRadius: "8px" }}>
                                        <span>(+) Receita Bruta Total</span>
                                        <span style={{ fontWeight: "bold", color: "#34d399" }}>R$ {receitasDRE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#1f2937", borderRadius: "8px" }}>
                                        <span>(-) Custos e Despesas Totais Operacionais</span>
                                        <span style={{ fontWeight: "bold", color: "#f87171" }}>R$ {despesasDRE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "16px", backgroundColor: "#030712", borderRadius: "8px", border: "1px solid #374151", marginTop: "10px" }}>
                                        <span style={{ fontWeight: "bold", fontSize: "16px" }}>(=) Resultado Líquido do Período</span>
                                        <span style={{ fontWeight: "bold", fontSize: "16px", color: resultadoDRE >= 0 ? "#34d399" : "#f87171" }}>
                                            R$ {resultadoDRE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTEÚDO DA ABA: FLUXO DE CAIXA */}
                        {activeTab === "fluxo" && (
                            <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "25px", marginTop: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#818cf8", marginBottom: "15px" }}>Projeção de Fluxo de Caixa (30 / 60 Dias)</h2>
                                <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>Simulação baseada na média diária de entradas e saídas identificada nos extratos importados.</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "15px" }}>
                                    <div style={{ backgroundColor: "#1f2937", padding: "20px", borderRadius: "12px" }}>
                                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Projeção para Próximos 30 Dias</span>
                                        <p style={{ fontSize: "20px", fontWeight: "bold", color: saldoLiquido >= 0 ? "#34d399" : "#f87171", marginTop: "8px" }}>
                                            R$ {(saldoLiquido * 1.05).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div style={{ backgroundColor: "#1f2937", padding: "20px", borderRadius: "12px" }}>
                                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Projeção para Próximos 60 Dias</span>
                                        <p style={{ fontSize: "20px", fontWeight: "bold", color: saldoLiquido >= 0 ? "#34d399" : "#f87171", marginTop: "8px" }}>
                                            R$ {(saldoLiquido * 1.12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTEÚDO DA ABA: AUDITORIA */}
                        {activeTab === "auditoria" && (
                            <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "25px", marginTop: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#818cf8", marginBottom: "15px" }}>Auditoria de Lançamentos e Anomalias</h2>
                                {transacoesSuspeitas.length === 0 ? (
                                    <p style={{ color: "#34d399", fontSize: "14px" }}>Nenhum lançamento duplicado ou anomalia grave detectada nos extratos.</p>
                                ) : (
                                    <p style={{ color: "#fbbf24", fontSize: "14px" }}>Foram encontrados {transacoesSuspeitas.length} registros com valores/descrições parecidas que merecem conferência.</p>
                                )}
                            </div>
                        )}

                        {/* CONTEÚDO DA ABA: CENTRO DE CUSTOS */}
                        {activeTab === "custos" && (
                            <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "25px", marginTop: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#818cf8", marginBottom: "15px" }}>Agrupamento por Centro de Custos / Categoria</h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {Object.entries(custosPorCategoria).map(([cat, val], idx) => (
                                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#1f2937", borderRadius: "8px", fontSize: "13px" }}>
                                            <span style={{ fontWeight: "600", color: "#e2e8f0" }}>{cat}</span>
                                            <span style={{ fontWeight: "bold", color: val >= 0 ? "#34d399" : "#f87171" }}>
                                                R$ {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CONTEÚDO DA ABA: NOTAS FISCAIS */}
                        {activeTab === "notas" && (
                            <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "25px", marginTop: "20px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#818cf8", marginBottom: "10px" }}>Cruzamento com Notas Fiscais (XML / PDF)</h2>
                                <p style={{ color: "#94a3b8", fontSize: "13px" }}>Módulo preparado para conciliar pagamentos do extrato com os arquivos fiscais emitidos pela empresa.</p>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </main>
    );
}