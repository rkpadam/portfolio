(function () {
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  const linkedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!navLinks.length || !linkedSections.length || !("IntersectionObserver" in window)) {
    return;
  }

  const linkBySectionId = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );

  function markCurrent(sectionId) {
    navLinks.forEach((link) => link.removeAttribute("aria-current"));
    const currentLink = linkBySectionId.get(sectionId);
    if (currentLink) {
      currentLink.setAttribute("aria-current", "location");
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        markCurrent(visible[0].target.id);
      }
    },
    {
      rootMargin: "-28% 0px -58% 0px",
      threshold: [0.01, 0.2, 0.5]
    }
  );

  linkedSections.forEach((section) => observer.observe(section));
})();

(function () {
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  const endpoint = String(window.CONTACT_ENDPOINT_URL || "").trim();

  if (!form || !status) {
    return;
  }

  const fields = {
    name: form.elements.namedItem("name"),
    email: form.elements.namedItem("email"),
    company: form.elements.namedItem("company"),
    message: form.elements.namedItem("message"),
    website: form.elements.namedItem("website")
  };
  const submitButton = form.querySelector('button[type="submit"]');

  function setStatus(message, type = "") {
    status.textContent = message;
    status.className = type ? `form-status ${type}` : "form-status";
  }

  function clearInvalidState() {
    [fields.name, fields.email, fields.company, fields.message].forEach((field) => {
      if (field) {
        field.removeAttribute("aria-invalid");
      }
    });
  }

  function showFieldError(field, message) {
    clearInvalidState();
    field.setAttribute("aria-invalid", "true");
    setStatus(message, "is-error");
    field.focus();
  }

  function endpointReady(url) {
    return Boolean(url) && !/PASTE|YOUR_|example/i.test(url);
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function hasSpamSignals(value) {
    const lower = value.toLowerCase();
    const linkCount = (lower.match(/https?:\/\//g) || []).length;
    return linkCount > 2 || /\b(crypto|casino|loan|viagra|seo backlink)\b/.test(lower);
  }

  [fields.name, fields.email, fields.company, fields.message].forEach((field) => {
    if (!field) {
      return;
    }
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      if (status.classList.contains("is-error")) {
        setStatus("");
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearInvalidState();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (website) {
      form.reset();
      setStatus("Thank you.", "is-success");
      return;
    }

    if (name.length < 2 || name.length > 80) {
      showFieldError(fields.name, "Please enter your name.");
      return;
    }

    if (!validEmail(email) || email.length > 120) {
      showFieldError(fields.email, "Please enter a valid email address.");
      return;
    }

    if (company.length > 120) {
      showFieldError(fields.company, "Please shorten the company name.");
      return;
    }

    if (message.length < 2 || message.length > 3000) {
      showFieldError(fields.message, "Please add a message.");
      return;
    }

    if (hasSpamSignals(`${name} ${company} ${message}`)) {
      showFieldError(fields.message, "Please simplify the message and try again.");
      return;
    }

    if (!endpointReady(endpoint)) {
      setStatus("Please connect with me on LinkedIn for now.", "is-error");
      return;
    }

    formData.set("name", name);
    formData.set("email", email);
    formData.set("company", company);
    formData.set("message", message);
    formData.set("source", window.location.href.slice(0, 500));

    const originalLabel = submitButton.textContent;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      const result = await response.json();

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || "Submission failed.");
      }

      form.reset();
      setStatus("Thanks — your note has been submitted.", "is-success");
    } catch (error) {
      console.error(error);
      setStatus(
        "Your note could not be confirmed. Please try again or connect on LinkedIn.",
        "is-error"
      );
    } finally {
      window.clearTimeout(timeoutId);
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });
})();
