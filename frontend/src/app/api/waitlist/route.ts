import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export interface WaitlistSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  city: string;
  sellingDescription?: string;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), "waitlist_entries.json");

async function getStoredEntries(): Promise<WaitlistSubmission[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveEntries(entries: WaitlistSubmission[]) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write waitlist entries to file:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, businessName, businessType, city, sellingDescription } = body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !businessName?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const entries = await getStoredEntries();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = entries.find((e) => e.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        message: "You're already on the list. We'll let you know when early access opens.",
      });
    }

    const newEntry: WaitlistSubmission = {
      id: "wl_" + Math.random().toString(36).substring(2, 9),
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      businessName: businessName.trim(),
      businessType: businessType || "Retail",
      city: city?.trim() || "Lagos",
      sellingDescription: sellingDescription?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    entries.push(newEntry);
    await saveEntries(entries);

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      message: "You're on the list. We'll let you know when early access opens.",
    });
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const entries = await getStoredEntries();
  return NextResponse.json({ count: entries.length });
}
