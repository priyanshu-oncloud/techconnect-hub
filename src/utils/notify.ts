import axios from "axios";

/**
 * Firebase Cloud Functions base URL.
 * Deploy an HTTPS function named `sendNotificationEmail` that accepts:
 * { to, subject, heading, body, ctaLabel?, ctaUrl?, template? }
 */
export const FUNCTIONS_BASE =
  "https://us-central1-nestgen-solutions.cloudfunctions.net";

export interface EmailPayload {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  template?: string;
}

/** Fire-and-forget email — never blocks or breaks the UI flow. */
export const sendEmail = async (payload: EmailPayload) => {
  try {
    await axios.post(`${FUNCTIONS_BASE}/sendNotificationEmail`, payload, {
      timeout: 15000,
    });
    return true;
  } catch (err) {
    console.warn("Email notification failed:", err);
    return false;
  }
};

/* ---------------- READY-MADE NOTIFICATIONS ---------------- */

export const notifyAmbassadorDecision = (
  to: string,
  name: string,
  status: "approved" | "rejected",
  referralCode?: string
) =>
  sendEmail({
    to,
    subject:
      status === "approved"
        ? "You're now a Nestgen Student Ambassador 🎉"
        : "Update on your Student Ambassador application",
    heading:
      status === "approved"
        ? `Congratulations, ${name}!`
        : `Hi ${name}`,
    body:
      status === "approved"
        ? `Your Student Ambassador application has been approved.${
            referralCode ? ` Your referral code is ${referralCode}.` : ""
          } Log in to your ambassador portal to access your dashboard, referral link and share templates.`
        : `Thank you for applying to the Nestgen Student Ambassador Program. After review, we are unable to move forward with your application at this time. You're welcome to apply again in the next cycle.`,
    ctaLabel: status === "approved" ? "Open Ambassador Portal" : undefined,
    ctaUrl:
      status === "approved"
        ? `${window.location.origin}/ambassador/login`
        : undefined,
    template: "ambassador_decision",
  });

export const notifyCandidateStatus = (
  to: string,
  name: string,
  position: string,
  status: string,
  note?: string
) =>
  sendEmail({
    to,
    subject: `Your application for ${position} — ${status}`,
    heading: `Hi ${name}`,
    body: `Your application for the ${position} role has been moved to "${status}".${
      note ? ` Note from our team: ${note}` : ""
    }`,
    template: "candidate_status",
  });
