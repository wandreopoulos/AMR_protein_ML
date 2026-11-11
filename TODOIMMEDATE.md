# Immediate TODO — AI Chatbot with JSON/TOON Context

## Goal

Add an AI chatbot to AMPstruct so a researcher or student can ask plain-language questions about uploaded sequences, predictions, features, and model behavior.

The chatbot should answer from the current AMPstruct session rather than inventing details. It should be able to explain results, discuss feature patterns, and support experimentation with prompts without changing the classifier automatically.

## Core data flow

```text
Uploaded FASTA + prediction results + feature data
  -> canonical JSON session object
  -> compact TOON representation for the chatbot context
  -> AI chatbot
  -> answer with references to the selected sequence and result fields
```

## Immediate tasks

1. Confirm the exact JSON/TOON format we discussed and document it with one real AMPstruct example.
2. Define a canonical session schema containing:
   - session and model version
   - selected sequence ID and original record position
   - raw sequence and validation status
   - prediction label, score, and confidence warnings
   - residue-level feature summaries
   - structure availability and status
   - experimental prompt or model settings, when present
3. Build a serializer that converts the canonical JSON object into the agreed TOON format.
4. Keep JSON as the source of truth; TOON is only a compact transport/context format.
5. Add a chatbot panel to the frontend with:
   - conversation history
   - selected-sequence context indicator
   - loading and error states
   - clear-session control
   - suggested questions such as “Why was this sequence classified this way?”
6. Add a backend chat endpoint that receives the current session context and user question.
7. Prevent unsupported claims:
   - distinguish model output from biological certainty
   - say when data is missing or outside the model’s scope
   - do not claim that colored residues are model attribution unless attribution is actually implemented
8. Add tests for JSON serialization, TOON conversion, context size limits, invalid input, and chatbot failure states.
9. Add a small mock chatbot mode so the UI can be developed without an API key.
10. Record the AI provider, model, timestamp, and context/session ID with each conversation.

## First vertical slice

Complete this smallest useful version first:

1. Select one valid sequence.
2. Build its canonical JSON context.
3. Convert that context to TOON.
4. Send one question to the backend.
5. Return an answer grounded in the selected sequence’s actual prediction data.
6. Display the answer beside the result card.

## Important boundaries

- The chatbot explains and explores results; it does not silently retrain or replace the classifier.
- Prompt experimentation should be an explicit separate workflow.
- Do not send the full dataset when the selected sequence and relevant summaries are sufficient.
- Do not expose API keys in the frontend.
- Preserve raw FASTA data and original record positions so duplicate sequence IDs remain distinguishable.

## Open decisions

- Confirm what “TOON” specifically means in our agreed design and which library or encoder to use.
- Choose the AI provider and deployment method.
- Decide whether conversations are temporary or saved to user accounts.
- Decide whether prompt experiments run synchronously or as background jobs.
- Decide whether the chatbot can compare multiple sequences in one conversation.
