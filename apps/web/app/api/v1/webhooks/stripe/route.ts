import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory processed event set for webhook idempotency
const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // Graceful development mode handling: expose billing as unconfigured without breaking route
    return NextResponse.json(
      {
        received: true,
        mode: "development_unconfigured",
        message:
          "STRIPE_WEBHOOK_SECRET not configured. Event acknowledged in dev mode.",
      },
      { status: 200 },
    );
  }

  const sigHeader = request.headers.get("stripe-signature");
  if (!sigHeader) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  try {
    const rawBody = await request.text();

    // Verify signature using crypto HMAC
    const elements = sigHeader.split(",");
    let timestamp = "";
    let signature = "";

    for (const elem of elements) {
      const [key, value] = elem.trim().split("=");
      if (key === "t") timestamp = value || "";
      if (key === "v1") signature = value || "";
    }

    if (!timestamp || !signature) {
      return NextResponse.json(
        { error: "Malformed stripe-signature header" },
        { status: 400 },
      );
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload, "utf8")
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 403 },
      );
    }

    const event = JSON.parse(rawBody);

    // Idempotency check: prevent duplicate event execution
    if (processedEvents.has(event.id)) {
      return NextResponse.json(
        { received: true, note: "Event already processed" },
        { status: 200 },
      );
    }
    processedEvents.add(event.id);

    // Process subscription events
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // Synchronize entitlement tier in database
        break;
      default:
        break;
    }

    return NextResponse.json(
      { received: true, event_id: event.id },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Webhook processing error", message: err.message },
      { status: 500 },
    );
  }
}
