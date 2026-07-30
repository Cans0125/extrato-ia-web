import "./globals.css";

export const metadata = {
    title: "Extrator Contabil IA",
    description: "Conversor de extratos bancarios em PDF para Excel",
    verification: {
        google: "vWijEHMJCwytd0S62ghqArfYi-Hnixw9qUVPISIczYE",
    },
};

export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <body>{props.children}</body>
        </html>
    );
}