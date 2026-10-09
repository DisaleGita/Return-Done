import { addDays } from "../dates";

export interface AssistantSample {
  id: string;
  label: string;
  text: string;
}

const long = (date: Date) => date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
const short = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/**
 * Made-up example texts written in the style of common retailer emails, with
 * dates relative to today. They aren't real retailer communications.
 */
export function buildSamples(now: Date): AssistantSample[] {
  return [
    {
      id: "qr-email",
      label: "Sneaker return email",
      text: `Hi there,

We've received your return request for order C01234567890.

Item: Air Zoom running shoes, size 9
Refund amount: $139.99

Your Nike return is eligible until ${long(addDays(now, 16))}. No printer needed. Just show the QR code below at any UPS Store or UPS Access Point. Items must be unworn with original tags attached.

Thanks for shopping with us.`,
    },
    {
      id: "label-email",
      label: "Marketplace return",
      text: `Your return is confirmed

Order #114-3920571-2284465
Returning: Wireless noise-cancelling headphones
Refund: $129.99 (issued once we receive the item)

Print your prepaid return label and attach it to the package. Pack the item securely in a box, then drop it off at a UPS location by ${short(addDays(now, 2))}.

Amazon.com`,
    },
    {
      id: "policy",
      label: "Store return policy",
      text: `RETURNS POLICY

You have 30 days from the shipping date to return your purchase. Your Zara order shipped on ${long(addDays(now, -9))}.

Returns are free in any Zara store. You can also return by mail: drop it off at a USPS location. No box needed; we'll send a QR code to your email.

Order number: 60219384751`,
    },
  ];
}
