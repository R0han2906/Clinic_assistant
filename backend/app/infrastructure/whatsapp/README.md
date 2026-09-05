# WhatsApp Adapter Boundary (Phase 9)

## Overview

This module defines the architectural boundary for future WhatsApp Business Platform integration.

During the early pilot (Phases 1–7), patient appointment requests are simulated via the **Patient Request Simulator** (`POST /api/v1/patient-requests`).

When live WhatsApp business credentials (WABA ID, phone number ID, Meta Cloud API access token) become active in Phase 9:
1. An incoming webhook endpoint `POST /api/v1/webhooks/whatsapp` will be added.
2. The webhook handler will invoke `WhatsAppAdapterInterface.parse_incoming_webhook()`.
3. The normalized payload will be routed directly to the existing `PatientRequestService.submit_request()`.
4. Zero changes will be required to the domain booking logic or Excel/Supabase storage layer.
