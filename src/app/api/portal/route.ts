import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    try {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: "Chave do Stripe não configurada" }, { status: 500 });
        }

        const stripe = new Stripe(secretKey);
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });
        }

        // Tenta buscar o cliente no Stripe pelo e-mail
        const customers = await stripe.customers.list({ email: email, limit: 1 });

        let customerId;
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            // Se não achar o cliente, cria um novo na hora para o portal abrir sem erro
            const customer = await stripe.customers.create({ email });
            customerId = customer.id;
        }

        // Pega a URL correta do site (local ou produção)
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        // Cria a sessão do Portal do Cliente
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}