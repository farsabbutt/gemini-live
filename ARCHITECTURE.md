# Pizza Ordering System Architecture

## System Overview
Voice-based pizza ordering system that uses Twilio for phone calls, Vosk for speech-to-text, and OpenAI GPT-3.5-turbo for conversational AI.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIGH-LEVEL SYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────────┘

    [User]                    [Server]              [Pizza Place]
         │                        │                       │
         │  Initiate Call         │                       │
         ├───────────────────────►│                       │
         │                        │                       │
         │                        │  Twilio Makes Call    │
         │                        ├──────────────────────►│
         │                        │                       │
         │                        │◄─── Audio Stream ────│
         │                        │   (WebSocket)        │
         │                        │                       │
         │                        │  Convert Audio        │
         │                        │  to Text (Vosk)      │
         │                        │                       │
         │                        │  Generate Response    │
         │                        │  (OpenAI GPT-3.5)    │
         │                        │                       │
         │                        │  Send TTS Response    │
         │                        ├──────────────────────►│
         │                        │                       │
         │                        │◄─── Continue ────────│
         │                        │   Conversation       │
         │                        │                       │
         └────────────────────────┴───────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    MAIN COMPONENTS                                │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Twilio  │◄──── Phone Network
    └────┬─────┘
         │
         │ Audio Stream (WebSocket)
         │
    ┌────▼─────┐
    │  Server  │
    │ (Fastify)│
    └────┬─────┘
         │
         ├──────────────┐
         │              │
    ┌────▼─────┐  ┌─────▼─────┐
    │   Vosk   │  │  OpenAI   │
    │ (Speech  │  │  GPT-3.5  │
    │  to Text)│  │  (AI Chat) │
    └──────────┘  └───────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSING PIPELINE                            │
└─────────────────────────────────────────────────────────────────┘

    Phone Audio
         │
         ▼
    [Twilio WebSocket Stream]
         │
         ▼
    [Audio Decoding]
         │  (μ-law → PCM)
         ▼
    [Vosk Speech Recognition]
         │  (Audio → Text)
         ▼
    [Text Accumulation]
         │  (Every 3+ seconds)
         ▼
    [OpenAI GPT-3.5]
         │  (Generate Response)
         ▼
    [Twilio TTS]
         │  (Text → Speech)
         ▼
    Phone Audio Output


┌─────────────────────────────────────────────────────────────────┐
│                    KEY TECHNOLOGIES                               │
└─────────────────────────────────────────────────────────────────┘

    • Twilio: Phone calls, audio streaming, text-to-speech
    • Vosk: Speech-to-text recognition
    • OpenAI GPT-3.5-turbo: Conversational AI
    • Fastify: Web server with WebSocket support
