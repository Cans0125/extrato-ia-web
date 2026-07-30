import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    try {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: "Chave do Stripe não configurada no servidor" }, { status: 500 });
        }

        const stripe = new Stripe(secretKey);
        const { email, userId } = await req.json();

        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            return NextResponse.json({ error: "ID do preço do Stripe não configurado" }, { status: 500 });
        }

        // Pega a URL atual do site para redirecionar após o pagamento
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        // Cria a Sessão de Checkout para nova assinatura
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            customer_email: email, // Preenche o e-mail automaticamente na Stripe
            success_url: `${origin}/?success=true`,
            cancel_url: `${origin}/?canceled=true`,
            metadata: {
                supabaseUserId: userId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}