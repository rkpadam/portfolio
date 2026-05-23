/**
 * Private Google Apps Script backend for the portfolio contact form.
 *
 * Keep recipient details out of the public website repository. Store the
 * recipient address in Apps Script project settings as a script property:
 *
 * CONTACT_TO_EMAIL = your-private-email@example.com
 */

// Do not replace this value with your email address. It must stay as the
// script-property name. Add your actual email in Project Settings instead.
const CONTACT_TO_EMAIL_PROPERTY = "CONTACT_TO_EMAIL";
const SUBJECT_PREFIX = "Portfolio Contact";

function doGet() {
  return jsonResponse({
    ok: true,
    message: "Portfolio contact endpoint is active.",
    recipientConfigured: Boolean(getRecipientEmail())
  });
}

function doPost(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const recipientEmail = getRecipientEmail();
    const name = clean(params.name);
    const email = clean(params.email);
    const company = clean(params.company);
    const message = clean(params.message);
    const website = clean(params.website);
    const source = clean(params.source);

    if (website) {
      return jsonResponse({ ok: true });
    }

    if (!recipientEmail) {
      return jsonResponse({ ok: false, error: "Missing CONTACT_TO_EMAIL script property." });
    }

    const validationError = validateInput(name, email, message);
    if (validationError) {
      return jsonResponse({ ok: false, error: validationError });
    }

    if (hasSpamSignals(name + " " + company + " " + message)) {
      return jsonResponse({ ok: false, error: "Message did not pass spam checks." });
    }

    const safeSubject = SUBJECT_PREFIX + ": " + truncate(name, 80);
    const body = [
      "New message from your portfolio site",
      "",
      "Name: " + name,
      "Email: " + email,
      "Company / role: " + (company || "Not provided"),
      "Source: " + (source || "Not provided"),
      "",
      "Message:",
      message
    ].join("\n");

    MailApp.sendEmail({
      to: recipientEmail,
      subject: safeSubject,
      body: body,
      replyTo: email,
      name: "Portfolio Contact Form"
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function validateInput(name, email, message) {
  if (name.length < 2 || name.length > 80) {
    return "Name length is invalid.";
  }

  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email is invalid.";
  }

  if (message.length < 2 || message.length > 3000) {
    return "Message length is invalid.";
  }

  return "";
}

function getRecipientEmail() {
  return clean(PropertiesService.getScriptProperties().getProperty(CONTACT_TO_EMAIL_PROPERTY));
}

function hasSpamSignals(value) {
  const lower = String(value || "").toLowerCase();
  const linkMatches = lower.match(/https?:\/\//g) || [];
  const blockedTerms = /\b(crypto|casino|loan|viagra|seo backlink)\b/;
  return linkMatches.length > 2 || blockedTerms.test(lower);
}

function clean(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function truncate(value, maxLength) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
