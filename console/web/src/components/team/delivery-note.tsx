import type { EmailDelivery } from "@/lib/api/types";

const WHY: Record<Exclude<EmailDelivery, "sent">, string> = {
  failed: "the email service refused it",
  not_configured: "email isn't set up on this console",
  rate_limited: "today's email limit is reached",
};

interface DeliveryNoteProps {
  delivery: EmailDelivery;
  email: string;
}

/** Says whether the console emailed an invite or reset link, or the admin has to send it. */
export function DeliveryNote({ delivery, email }: DeliveryNoteProps) {
  if (delivery === "sent") {
    return <span className="sc-help" role="status">Email sent to {email}. The link is below too, in case it doesn&apos;t arrive.</span>;
  }
  return (
    <span className="sc-help" role="status">
      Couldn&apos;t email {email} ({WHY[delivery]}); copy the link instead and send it yourself.
    </span>
  );
}
