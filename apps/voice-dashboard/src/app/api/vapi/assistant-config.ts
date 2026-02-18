/**
 * Vapi.ai Assistant Configuration
 * 2026 Best Practices - Italian Automotive Receptionist
 */

export const assistantConfig = {
  name: "Sofia - Receptionist AI Officina",
  
  // Voice Configuration (ElevenLabs Turbo v3)
  voice: {
    provider: "elevenlabs",
    voiceId: "pNInz6obpgDQGcFmaJgB", // Charlotte - professional female Italian
    model: "eleven_turbo_v3",
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.5,
    useSpeakerBoost: true,
  },

  // Speech-to-Text (Deepgram Nova-3)
  transcriber: {
    provider: "deepgram",
    model: "nova-3",
    language: "it",
    smartFormat: true,
    keywords: ["officina", "tagliando", "freni", "olio", "prenotazione", "appuntamento"],
  },

  // LLM Configuration (GPT-4o-mini per latenza)
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 150,
    systemPrompt: `Sei Sofia, l'assistente virtuale di un'officina meccanica italiana. Il tuo compito è gestire le chiamate in entrata, prendere appuntamenti e fornire informazioni di base.

REGOLE FONDAMENTALI:
1. SEMPRE inizia presentandoti: "Buongiorno, sono Sofia, l'assistente virtuale dell'officina. Come posso aiutarla?"
2. Parla in italiano naturale, cordiale ma professionale
3. Sei un'AI - NON fingere di essere umana. Se chiesto, conferma che sei un assistente virtuale
4. Risposte BREVISSE (max 2 frasi) per mantenere latenza bassa
5. Non promettere preventivi precisi - raccogli info e passa al meccanico

GESTIONE APPUNTAMENTI:
- Chiedi: tipo di servizio, giorno preferito, fascia oraria (mattina/pomeriggio)
- Verifica disponibilità chiamando tool check_availability
- Conferma appuntamento con tool book_appointment
- Chiedi nome, cognome, telefono, targa veicolo

SERVIZI COMUNI:
- Tagliando: ogni 15.000km o 1 anno
- Cambio olio: 30-60 minuti
- Freni: ispezione gratuita
- Diagnosi: richiede appuntamento

ESCALATION (trasferisci a umano se):
- Cliente arrabbiato o insoddisfatto
- Richiesta complessa non gestibile
- Richiesta esplicita "parla con un operatore"
- Problema di sicurezza (freni, airbag, sterzo)

DATI DA RACCOGLIERE SEMPRE:
- Nome e cognome
- Numero di telefono
- Targa veicolo (se possibile)
- Tipo di servizio richiesto
- Urgenza (bassa/media/alta)`,
  },

  // Function Calling (Tools)
  functions: [
    {
      name: "check_availability",
      description: "Verifica disponibilità appuntamenti in una data/fascia oraria",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Data richiesta (YYYY-MM-DD)",
          },
          timePreference: {
            type: "string",
            enum: ["morning", "afternoon", "any"],
            description: "Preferenza fascia oraria",
          },
          duration: {
            type: "number",
            description: "Durata stimata in minuti",
            default: 60,
          },
        },
        required: ["date"],
      },
    },
    {
      name: "book_appointment",
      description: "Prenota un appuntamento nel sistema",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "Nome e cognome cliente",
          },
          phone: {
            type: "string",
            description: "Numero di telefono",
          },
          licensePlate: {
            type: "string",
            description: "Targa veicolo (opzionale)",
          },
          serviceType: {
            type: "string",
            description: "Tipo di servizio richiesto",
          },
          scheduledAt: {
            type: "string",
            description: "Data e ora appuntamento (ISO 8601)",
          },
          notes: {
            type: "string",
            description: "Note aggiuntive",
          },
        },
        required: ["customerName", "phone", "serviceType", "scheduledAt"],
      },
    },
    {
      name: "lookup_customer",
      description: "Cerca cliente nel database per numero di telefono",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "Numero di telefono",
          },
        },
        required: ["phone"],
      },
    },
    {
      name: "lookup_vehicle",
      description: "Cerca veicolo per targa",
      parameters: {
        type: "object",
        properties: {
          licensePlate: {
            type: "string",
            description: "Targa veicolo",
          },
        },
        required: ["licensePlate"],
      },
    },
    {
      name: "transfer_to_human",
      description: "Trasferisci chiamata a operatore umano",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Motivo del trasferimento",
          },
        },
        required: ["reason"],
      },
    },
  ],

  // Call End Configuration
  endCallFunction: {
    name: "end_call",
    description: "Termina la chiamata quando l'obiettivo è raggiunto",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Riassunto della conversazione",
        },
        outcome: {
          type: "string",
          enum: ["appointment_booked", "info_provided", "transferred", "no_action"],
          description: "Esito della chiamata",
        },
      },
      required: ["outcome"],
    },
  },

  // Recording & Monitoring
  recordingEnabled: true,
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600, // 10 min max
  backgroundSound: "office", // Sottofondo ufficio per realismo

  // Fallback
  fallbackModels: ["gpt-4o", "claude-3-haiku-20240307"],
};

export default assistantConfig;
