import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Vapi webhook payload schema
const vapiWebhookSchema = z.object({
  message: z.object({
    type: z.enum(['function-call', 'end-of-call-report', 'conversation-update']),
    call: z.object({
      id: z.string(),
      orgId: z.string().optional(),
      customerId: z.string().optional(),
    }),
    functionCall: z.object({
      name: z.string(),
      parameters: z.record(z.any()),
    }).optional(),
    results: z.array(z.any()).optional(),
    summary: z.string().optional(),
    transcript: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = vapiWebhookSchema.parse(body);
    const { message } = parsed;
    const supabase = createClient();

    const orgId = message.call.orgId;
    
    if (!orgId) {
      console.error('Missing orgId in call metadata');
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    switch (message.type) {
      case 'function-call':
        return handleFunctionCall(message, supabase, orgId);
      
      case 'end-of-call-report':
        return handleEndOfCall(message, supabase, orgId);
      
      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Vapi webhook error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

async function handleFunctionCall(message: any, supabase: any, orgId: string) {
  const { name, parameters } = message.functionCall;
  
  try {
    let result;
    
    switch (name) {
      case 'check_availability':
        result = await checkAvailability(supabase, orgId, parameters);
        break;
        
      case 'book_appointment':
        result = await bookAppointment(supabase, orgId, parameters);
        break;
        
      case 'lookup_customer':
        result = await lookupCustomer(supabase, orgId, parameters);
        break;
        
      case 'lookup_vehicle':
        result = await lookupVehicle(supabase, orgId, parameters);
        break;
        
      default:
        result = { error: 'Funzione non supportata' };
    }
    
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error(`Function ${name} error:`, error);
    return NextResponse.json({ 
      result: { error: error.message || 'Errore interno' } 
    });
  }
}

async function checkAvailability(supabase: any, orgId: string, params: any) {
  const { date, timePreference = 'any' } = params;
  
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('scheduled_at')
    .eq('org_id', orgId)
    .gte('scheduled_at', `${date}T00:00:00`)
    .lte('scheduled_at', `${date}T23:59:59`)
    .not('status', 'eq', 'cancelled');

  let timeSlots = timePreference === 'morning' 
    ? ['08:00', '09:00', '10:00', '11:00']
    : timePreference === 'afternoon'
    ? ['14:00', '15:00', '16:00', '17:00']
    : ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  const bookedTimes = new Set(
    existingAppointments?.map((apt: any) => apt.scheduled_at.substring(11, 16)) || []
  );
  
  const availableSlots = timeSlots.filter(slot => !bookedTimes.has(slot));

  if (availableSlots.length === 0) {
    return {
      available: false,
      message: 'Spiacenti, non ci sono slot disponibili per quel giorno.',
    };
  }

  return {
    available: true,
    slots: availableSlots.slice(0, 3),
    message: `Disponibilità: ${availableSlots.slice(0, 3).join(', ')}`,
  };
}

async function bookAppointment(supabase: any, orgId: string, params: any) {
  const { customerName, phone, serviceType, scheduledAt } = params;

  // Find or create customer
  let { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('org_id', orgId)
    .eq('phone', phone)
    .single();

  if (!customer) {
    const nameParts = customerName.split(' ');
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        org_id: orgId,
        phone,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' '),
      })
      .select('id')
      .single();
    customer = newCustomer;
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .insert({
      org_id: orgId,
      customer_id: customer.id,
      scheduled_at: scheduledAt,
      service_type: serviceType,
      status: 'confirmed',
      source: 'ai_voice',
    })
    .select()
    .single();

  return {
    success: true,
    appointmentId: appointment.id,
    message: `Appuntamento confermato per ${new Date(scheduledAt).toLocaleDateString('it-IT')}`,
  };
}

async function lookupCustomer(supabase: any, orgId: string, params: any) {
  const { phone } = params;

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('org_id', orgId)
    .eq('phone', phone)
    .single();

  return customer 
    ? { found: true, customer }
    : { found: false };
}

async function lookupVehicle(supabase: any, orgId: string, params: any) {
  const { licensePlate } = params;

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('org_id', orgId)
    .eq('license_plate', licensePlate.toUpperCase())
    .single();

  return vehicle 
    ? { found: true, vehicle }
    : { found: false };
}

async function handleEndOfCall(message: any, supabase: any, orgId: string) {
  const callId = message.call.id;
  
  await supabase
    .from('conversations')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      summary: message.summary,
    })
    .eq('external_id', callId)
    .eq('org_id', orgId);

  return NextResponse.json({ received: true });
}
