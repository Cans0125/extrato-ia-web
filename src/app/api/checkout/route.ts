import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Chave do Stripe não configurada no servidor" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });
    }

    // Busca o cliente no Stripe pelo e-mail
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (customers.data.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado no Stripe. Realize uma assinatura primeiro." }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // Cria a sessão do Portal do Cliente
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `http://localhost:3000`, // URL de retorno ao fechar o portal
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}