# Return Done — original 2023 codebase

This folder is the code that ran returndone.com in 2023, when we tested
doorstep return pickups with students around Illinois Tech in Chicago. It is
kept here as a historical reference. The modern rebuild at the repository root
supersedes it, and nothing in this folder is built or deployed.

## What it was

| Layer    | Stack                                                                   |
| -------- | ----------------------------------------------------------------------- |
| Frontend | Create React App, React 18, TypeScript, SCSS modules, Bootstrap         |
| Forms    | react-hook-form + yup, react-datepicker                                 |
| Backend  | ASP.NET Core 6 Web API (`server/`), MailKit over SMTP                   |
| Payments | Stripe Payment Link (redirect)                                          |
| Hosting  | Azure App Service (API) and Azure Static Web App / IIS (client)          |

### The 2023 return flow

1. A customer filled out the **Return Initiation Form** at `/submitReturn`:
   contact details, up to five stores (each with item count, store type,
   optional return deadline and receipt/label uploads), a pickup date and a
   two-hour time slot, and "how did you hear about us".
2. The form data was stashed in the browser's IndexedDB, and the customer was
   redirected to a Stripe Payment Link.
3. Stripe redirected back to `/success`. The page read the record from
   IndexedDB and posted it as `multipart/form-data` to
   `POST /api/Email/SendEmail`.
4. The API emailed the operations inbox (with receipts and labels attached) and
   sent the customer a confirmation. Pickups were then scheduled and run by
   hand.

### Business rules that carried into the rebuild

- Two-hour pickup windows from 8 AM to 8 PM, with windows that had already
  started greyed out for same-day pickups (`timeSlotForm.tsx`)
- One flat price per pickup ($9.99) covering up to five stores
- **Return Day**: $2 off for pickups on Saturday, when routes were batched
- The earliest deadline across all stores drives urgency (`MailService.cs`)
- No packing required: items were checked at the door, then packed and
  labelled for the customer

You can find these in `src/lib/pricing.ts`, `src/lib/scheduling.ts` and
`src/lib/returns.ts` in the rebuild.

## What was removed before publishing

The repository was cleaned before it was made public:

- **Credentials:** an SMTP mailbox password (`appsettings.json`), a Google
  OAuth client secret (`client_secret.json`) and Azure publish profiles. These
  were removed or redacted, and the credentials should be treated as revoked.
- **Personal data:** real customers' names, photos and testimonials, plus a
  phone number. The old support mailbox address, which no longer exists, is
  replaced with `support@example.com`. The testimonial component is kept as code with an empty list.
- **Third-party assets of unclear license:** a stock hero photo, retailer logo
  images and animated icons.
- **Build output:** compiled `bin/` and `obj/` folders, publish zips and CRA
  `build/` output.

Because of this, the archive does not build as-is: imports of the removed assets still point at their
original paths.
