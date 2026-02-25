# Changelog

## [Unreleased] — 2025-02-24

### Added
- **Tasks/Milestones**: Create, reorder, and track tasks per project. Clients see read-only task lists in the portal.
- **Invoicing**: Full invoice lifecycle — create invoices with line items, transition through draft/sent/paid/overdue statuses, and track outstanding amounts on the dashboard. Clients can view their invoices in the portal.
- **Internal Notes**: Team-only notes on projects (hidden from client portal) with author attribution.
- **Client Profiles**: Rich client details (company, phone, address, website, description) editable by admins and by clients themselves in portal settings.
- **Dashboard invoice stats**: Outstanding amount card on the main dashboard.
- **Invoices sidebar nav**: New "Invoices" section in dashboard sidebar.
- **Portal invoices nav**: Invoices link in portal header navigation.

### Database
- New models: `Task`, `Invoice`, `InvoiceLineItem`, `ProjectNote`, `ClientProfile`.
- New relations on `Project`: `tasks`, `invoices`, `notes`.
