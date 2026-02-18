import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

// WhatsApp Cloud API Webhook Handler
// 2026 Implementation - Meta Hosted

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verification endpoint for Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Handle incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // Process each entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            await handleMessage(message, change.value.metadata, supabase);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleMessage(
  message: any, 
  metadata: any, 
  supabase: any
) {
  const phoneNumber = message.from;
  const businessPhone = metadata.display_phone_number;
  
  // Find organization by WhatsApp number
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('whatsapp_number', businessPhone)
    .single();

  if (!org) {
    console.error('Organization not found for WhatsApp number:', businessPhone);
    return;
  }

  // Find or create customer
  let { data: customer } = await supabase
    .from('customers')
    .select('id, first_name')
    .eq('org_id', org.id)
    .eq('phone', phoneNumber)
    .single();

  if (!customer) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        org_id: org.id,
        phone: phoneNumber,
        gdpr_consent: true,
        consent_date: new Date().toISOString(),
      })
      .select('id')
      .single();
    customer = newCustomer;
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('org_id', org.id)
    .eq('customer_id', customer.id)
    .eq('channel', 'whatsapp')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        org_id: org.id,
        customer_id: customer.id,
        channel: 'whatsapp',
        phone_number: phoneNumber,
        external_id: message.id,
      })
      .select('id')
      .single();
    conversation = newConv;
  }

  // Store user message
  const messageContent = message.text?.body || '';
  
  await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversation.id,
      role: 'user',
      content: messageContent,
      metadata: { whatsapp_msg_id: message.id },
    });

  // Get conversation history (last 10 messages)
  const { data: history } = await supabase
    .from('conversation_messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Generate AI response
  const aiResponse = await generateAIResponse(
    messageContent,
    history?.reverse() || [],
    org.name,
    customer?.first_name
  );

  // Store AI response
  await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse,
    });

  // Send WhatsApp reply
  await sendWhatsAppMessage(phoneNumber, aiResponse, businessPhone);
}

async function generateAIResponse(
  userMessage: string,
  history: any[],
  orgName: string,
  customerName?: string
) {
  const systemPrompt = `Sei l'assistente virtuale WhatsApp di ${orgName}, un'officina meccanica.

CONTEXTO:
- Cliente: ${customerName || 'nuovo cliente'}
- Canale: WhatsApp (risposte brevi e dirette)

COMPITO:
Gestisci richieste di:
1. PRENOTAZIONI - Chiedi data, ora, tipo di servizio
2. INFORMAZIONI - Orari, servizi offerti, prezzi indicativi
3. STATO RIPARAZIONI - Chiedi targa o numero ordine

REGOLE:
- Risposte MOLTO BREVISSE (max 2-3 righe)
- Usa emoji pertinenti 🚗 🔧 📅
- Sempre cordiale e professionale
- Se non sai qualcosa: "Le faccio sapere appena possibile"

Non usare markdown, solo testo semplice.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 150,
  });

  return completion.choices[0].message.content || 'Mi dispiace, non ho capito. Può ripetere?';
}

async function sendWhatsAppMessage(
  to: string, 
  message: string, 
  from: string
) {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!response.ok) {
    console.error('WhatsApp send error:', await response.text());
  }
}
