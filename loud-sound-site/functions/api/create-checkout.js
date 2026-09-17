const PACKAGES = {
  small: { name: "Small Party Package", rate: 75 },
  party: { name: "Party Sound Package", rate: 110 },
  pro: { name: "DJ Event Pro Package", rate: 140 },
  full: { name: "Full Event Experience", rate: 175 }
};

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const data = await request.json();

    const packageId = String(data.packageId || "");
    const hours = Number(data.hours);
    const dj = data.dj === true;
    const delivery = data.delivery === true;

    const selectedPackage = PACKAGES[packageId];

    if (!selectedPackage) {
      return Response.json(
        { error: "Invalid package." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(hours) || hours < 4 || hours > 24) {
      return Response.json(
        { error: "A minimum of 4 hours is required." },
        { status: 400 }
      );
    }

    // IMPORTANT:
    // Price is calculated here on the server.
    // The browser cannot choose its own payment amount.
    const packageTotal = selectedPackage.rate * hours;
    const djTotal = dj ? 50 * hours : 0;
    const deliveryTotal = delivery ? 75 : 0;

    const total = packageTotal + djTotal + deliveryTotal;
    const depositCents = Math.round(total * 0.5 * 100);

    const origin = new URL(request.url).origin;

    const params = new URLSearchParams();

    params.set("mode", "payment");
    params.set(
      "success_url",
      `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`
    );
    params.set(
      "cancel_url",
      `${origin}/?payment=cancelled`
    );

    params.set("line_items[0][price_data][currency]", "usd");
    params.set(
      "line_items[0][price_data][product_data][name]",
      "LOUD SOUND — 50% Event Deposit"
    );
    params.set(
      "line_items[0][price_data][product_data][description]",
      `${selectedPackage.name} • ${hours} hours`
    );
    params.set(
      "line_items[0][price_data][unit_amount]",
      String(depositCents)
    );
    params.set("line_items[0][quantity]", "1");

    params.set("name_collection[individual][enabled]", "true");
    params.set("phone_number_collection[enabled]", "true");

    params.set("metadata[package]", selectedPackage.name);
    params.set("metadata[hours]", String(hours));
    params.set("metadata[dj]", dj ? "Yes" : "No");
    params.set("metadata[delivery]", delivery ? "Yes" : "No");
    params.set("metadata[event_total]", `$${total.toFixed(2)}`);
    params.set("metadata[deposit]", `$${(depositCents / 100).toFixed(2)}`);

    if (data.eventDate) {
      params.set("metadata[event_date]", String(data.eventDate).slice(0, 100));
    }

    if (data.venue) {
      params.set("metadata[venue]", String(data.venue).slice(0, 500));
    }

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe error:", session);
      return Response.json(
        { error: "Unable to start checkout." },
        { status: 500 }
      );
    }

    return Response.json({
      url: session.url
    });

  } catch (error) {
    console.error("Checkout error:", error);

    return Response.json(
      { error: "Unable to start checkout." },
      { status: 500 }
    );
  }
}
