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
const RATE_LIMIT_SECONDS = 60;

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

    const validationError = validateInput(name, email, company, message, source);
    if (validationError) {
      return jsonResponse({ ok: false, error: validationError });
    }

    if (hasSpamSignals(name + " " + company + " " + message)) {
      return jsonResponse({ ok: false, error: "Message did not pass spam checks." });
    }

    if (isRateLimited(email)) {
      return jsonResponse({ ok: false, error: "Please wait before sending another message." });
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

function validateInput(name, email, company, message, source) {
  if (name.length < 2 || name.length > 80) {
    return "Name length is invalid.";
  }

  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email is invalid.";
  }

  if (company.length > 120) {
    return "Company length is invalid.";
  }

  if (message.length < 2 || message.length > 3000) {
    return "Message length is invalid.";
  }

  if (source.length > 500) {
    return "Source length is invalid.";
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

function isRateLimited(email) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    email.toLowerCase(),
    Utilities.Charset.UTF_8
  );
  const key = "contact:" + Utilities.base64EncodeWebSafe(digest).slice(0, 32);
  const cache = CacheService.getScriptCache();

  if (cache.get(key)) {
    return true;
  }

  cache.put(key, "1", RATE_LIMIT_SECONDS);
  return false;
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
