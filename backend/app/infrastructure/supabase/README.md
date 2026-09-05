# Supabase Repository Boundary (Phase 8)

## Overview

This module defines the architectural boundary for future relational database migration.

Currently, DentalFlow persists all operational state in a structured 12-sheet Excel pilot store (`clinic_data.xlsx`).

Because all storage calls are routed through the abstract `BaseClinicRepository` interface, migrating to Supabase in Phase 8 will require:
1. Creating PostgreSQL relational tables matching the 12-sheet schemas (foreign keys, UUID/sequence columns).
2. Implementing `SupabaseClinicRepository` satisfying `BaseClinicRepository`.
3. Updating the dependency provider in `app/repositories/__init__.py` to return the Supabase repository instance.
4. Controllers, services, and routes will require **zero changes**.
