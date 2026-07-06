import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORIES = [
  "Music",
  "Technology",
  "Business",
  "Sports",
  "Arts & Culture",
  "Community",
  "Education",
  "Food & Drink",
  "Health & Wellness",
  "Religion",
  "Networking",
  "Startups & Entrepreneurship",
  "Film & Media",
  "Gaming",
  "Fashion",
  "Environment",
  "Comedy",
  "Science & Research",
  "Literature & Writing",
];

// [name, username, email, location]
const USERS: [string, string, string, string][] = [
  ["Demo Host", "demohost", "host@dunda.dev", "Nairobi"],
  ["Demo Attendee", "demoattendee", "attendee@dunda.dev", "Nairobi"],
  ["Amina Yusuf", "aminay", "amina@example.com", "Mombasa"],
  ["Brian Otieno", "briano", "brian@example.com", "Kisumu"],
  ["Cynthia Wangari", "cynthiaw", "cynthia@example.com", "Nairobi"],
  ["David Kiprop", "davidk", "david@example.com", "Eldoret"],
  ["Esther Njeri", "esthern", "esther@example.com", "Nairobi"],
  ["Faisal Ahmed", "faisala", "faisal@example.com", "Mombasa"],
  ["Grace Achieng", "gracea", "grace@example.com", "Kisumu"],
  ["Henry Mwangi", "henrym", "henry@example.com", "Nakuru"],
  ["Irene Chebet", "irenec", "irene@example.com", "Eldoret"],
  ["James Mutua", "jamesm", "james@example.com", "Nairobi"],
  ["Khadija Ali", "khadijaa", "khadija@example.com", "Mombasa"],
  ["Leon Kamau", "leonk", "leon@example.com", "Thika"],
  ["Mary Wanjiku", "marywanjiku", "mary@example.com", "Nyeri"],
  ["Nelson Barasa", "nelsonb", "nelson@example.com", "Kakamega"],
  ["Olivia Auma", "oliviaa", "olivia@example.com", "Kisumu"],
  ["Peter Njoroge", "petern", "peter@example.com", "Nairobi"],
  ["Queenter Moraa", "queenterm", "queenter@example.com", "Kisii"],
  ["Robert Kiptoo", "robertk", "robert@example.com", "Kericho"],
  ["Sarah Wafula", "sarahw", "sarah@example.com", "Bungoma"],
  ["Tabitha Muthoni", "tabitham", "tabitha@example.com", "Meru"],
  ["Umar Farah", "umarf", "umar@example.com", "Garissa"],
];

type OrgSeed = {
  name: string;
  owner: string;
  admins: string[];
  followers: string[];
  description: string;
};

const ORGS: OrgSeed[] = [
  { name: "Nairobi Tech Community", owner: "host@dunda.dev", admins: ["cynthia@example.com"], followers: ["attendee@dunda.dev", "brian@example.com", "esther@example.com", "james@example.com", "peter@example.com"], description: "A community hub for tech meetups, workshops, and hackathons across Nairobi." },
  { name: "UoN Student Union", owner: "cynthia@example.com", admins: ["esther@example.com"], followers: ["attendee@dunda.dev", "brian@example.com", "david@example.com", "olivia@example.com"], description: "Events, career fairs, and student life at the University of Nairobi." },
  { name: "Coast Runners Club", owner: "amina@example.com", admins: ["faisal@example.com"], followers: ["david@example.com", "grace@example.com", "henry@example.com", "khadija@example.com"], description: "Running, fitness, and beach cleanups along the Kenyan coast." },
  { name: "Kenya Startup Hub", owner: "david@example.com", admins: ["leon@example.com"], followers: ["james@example.com", "henry@example.com", "cynthia@example.com", "robert@example.com"], description: "Connecting founders, investors, and builders across Kenya." },
  { name: "Nairobi Creatives", owner: "esther@example.com", admins: ["grace@example.com"], followers: ["attendee@dunda.dev", "irene@example.com", "faisal@example.com", "mary@example.com"], description: "Music, film, art, and photography events for Nairobi creatives." },
  { name: "Kisumu Music Collective", owner: "brian@example.com", admins: ["olivia@example.com"], followers: ["grace@example.com", "attendee@dunda.dev", "queenter@example.com"], description: "Celebrating the sounds and artists of the lake region." },
  { name: "Green Kenya Initiative", owner: "grace@example.com", admins: ["henry@example.com"], followers: ["amina@example.com", "david@example.com", "sarah@example.com"], description: "Tree planting, clean-ups, and climate action across the country." },
  { name: "Rift Valley Runners", owner: "robert@example.com", admins: ["david@example.com"], followers: ["henry@example.com", "irene@example.com", "umar@example.com"], description: "Training runs and marathon meetups in the Rift Valley." },
  { name: "Mombasa Foodies", owner: "faisal@example.com", admins: ["amina@example.com"], followers: ["khadija@example.com", "umar@example.com", "attendee@dunda.dev"], description: "Food festivals and tasting events along the coast." },
  { name: "Nairobi Gamers League", owner: "james@example.com", admins: ["peter@example.com"], followers: ["leon@example.com", "nelson@example.com", "attendee@dunda.dev"], description: "Esports tournaments and casual gaming nights in Nairobi." },
  { name: "Women in Tech Kenya", owner: "khadija@example.com", admins: ["cynthia@example.com"], followers: ["esther@example.com", "mary@example.com", "tabitha@example.com", "attendee@dunda.dev"], description: "Empowering women in technology through events and mentorship." },
  { name: "Eldoret Business Network", owner: "leon@example.com", admins: ["robert@example.com"], followers: ["david@example.com", "sarah@example.com", "nelson@example.com"], description: "Networking and growth for entrepreneurs in the North Rift." },
];

type EventSeed = {
  title: string;
  description: string;
  category: string;
  format: "IN_PERSON" | "VIRTUAL";
  venue?: string;
  virtualLink?: string;
  daysFromNow: number;
  hour: number;
  capacity: number | null;
  visibility: "PUBLIC" | "PRIVATE";
  host: string;
  org?: string;
};

const EVENTS: EventSeed[] = [
  // ---- Past events ----
  { title: "Community Launch Night", description: "Our very first meetup — lightning talks, demos, and networking.", category: "Technology", format: "IN_PERSON", venue: "iHub, Nairobi", daysFromNow: -60, hour: 18, capacity: 120, visibility: "PUBLIC", host: "host@dunda.dev", org: "Nairobi Tech Community" },
  { title: "Intro to TypeScript Workshop", description: "A hands-on evening covering TypeScript fundamentals for JavaScript developers.", category: "Technology", format: "IN_PERSON", venue: "iHub, Nairobi", daysFromNow: -50, hour: 17, capacity: 60, visibility: "PUBLIC", host: "host@dunda.dev", org: "Nairobi Tech Community" },
  { title: "Mombasa Beach Cleanup", description: "Join neighbours to protect our shoreline. Gloves and bags provided.", category: "Environment", format: "IN_PERSON", venue: "Nyali Beach, Mombasa", daysFromNow: -45, hour: 8, capacity: null, visibility: "PUBLIC", host: "amina@example.com", org: "Coast Runners Club" },
  { title: "Startup Pitch Night Vol. 1", description: "Early-stage founders pitch to a friendly crowd of builders and investors.", category: "Startups & Entrepreneurship", format: "IN_PERSON", venue: "Nairobi Garage, Kilimani", daysFromNow: -40, hour: 18, capacity: 80, visibility: "PUBLIC", host: "david@example.com", org: "Kenya Startup Hub" },
  { title: "Acoustic Evening", description: "An intimate evening of live acoustic music by local artists.", category: "Music", format: "IN_PERSON", venue: "Arboretum Grounds, Nairobi", daysFromNow: -35, hour: 17, capacity: 150, visibility: "PUBLIC", host: "esther@example.com", org: "Nairobi Creatives" },
  { title: "UoN Career Fair 2026", description: "Meet employers, polish your CV, and explore internships and graduate roles.", category: "Education", format: "IN_PERSON", venue: "University of Nairobi, Main Campus", daysFromNow: -30, hour: 9, capacity: 500, visibility: "PUBLIC", host: "cynthia@example.com", org: "UoN Student Union" },
  { title: "Nairobi 10K Fun Run", description: "A community fun run for all fitness levels. Water stations along the route.", category: "Sports", format: "IN_PERSON", venue: "Karura Forest, Nairobi", daysFromNow: -28, hour: 7, capacity: 300, visibility: "PUBLIC", host: "amina@example.com", org: "Coast Runners Club" },
  { title: "Film Screening: Local Shorts", description: "A curated evening of short films by emerging Kenyan filmmakers.", category: "Film & Media", format: "IN_PERSON", venue: "Alliance Française, Nairobi", daysFromNow: -25, hour: 18, capacity: 100, visibility: "PUBLIC", host: "esther@example.com", org: "Nairobi Creatives" },
  { title: "Data Science Bootcamp (Online)", description: "A one-day virtual intro to data analysis with Python and pandas.", category: "Education", format: "VIRTUAL", virtualLink: "https://meet.example.com/data-bootcamp", daysFromNow: -20, hour: 10, capacity: 200, visibility: "PUBLIC", host: "host@dunda.dev" },
  { title: "Nairobi Foodie Festival", description: "Taste dishes from dozens of local vendors and food trucks.", category: "Food & Drink", format: "IN_PERSON", venue: "Two Rivers Mall, Nairobi", daysFromNow: -18, hour: 12, capacity: 400, visibility: "PUBLIC", host: "james@example.com" },
  { title: "Kisumu Jazz Night", description: "Smooth jazz by the lake with regional performers.", category: "Music", format: "IN_PERSON", venue: "Dunga Beach, Kisumu", daysFromNow: -15, hour: 18, capacity: 200, visibility: "PUBLIC", host: "brian@example.com", org: "Kisumu Music Collective" },
  { title: "Tree Planting Day", description: "Help us plant 1,000 indigenous trees. Bring water and a hat.", category: "Environment", format: "IN_PERSON", venue: "Menengai Crater, Nakuru", daysFromNow: -12, hour: 9, capacity: null, visibility: "PUBLIC", host: "grace@example.com", org: "Green Kenya Initiative" },
  { title: "Comedy Night Live", description: "An evening of stand-up from Kenya's funniest up-and-coming comedians.", category: "Comedy", format: "IN_PERSON", venue: "The Alchemist, Westlands", daysFromNow: -9, hour: 19, capacity: 120, visibility: "PUBLIC", host: "peter@example.com" },
  { title: "Women in Tech Breakfast", description: "Networking and mentorship over breakfast for women in technology.", category: "Technology", format: "IN_PERSON", venue: "Sarova Panafric, Nairobi", daysFromNow: -6, hour: 8, capacity: 90, visibility: "PUBLIC", host: "khadija@example.com", org: "Women in Tech Kenya" },

  // ---- Upcoming events ----
  { title: "Hack Night: Build with AI", description: "An evening of hacking on AI-powered apps. Bring a laptop and an idea.", category: "Technology", format: "IN_PERSON", venue: "iHub, Nairobi", daysFromNow: 4, hour: 18, capacity: 60, visibility: "PUBLIC", host: "host@dunda.dev", org: "Nairobi Tech Community" },
  { title: "Yoga in the Park", description: "Start your Saturday with a calming outdoor yoga session. All levels welcome.", category: "Health & Wellness", format: "IN_PERSON", venue: "Uhuru Park, Nairobi", daysFromNow: 5, hour: 8, capacity: 40, visibility: "PUBLIC", host: "tabitha@example.com" },
  { title: "Business Networking Breakfast", description: "Grow your network over breakfast with founders and professionals.", category: "Networking", format: "IN_PERSON", venue: "Sarova Stanley, Nairobi", daysFromNow: 6, hour: 8, capacity: 70, visibility: "PUBLIC", host: "david@example.com", org: "Kenya Startup Hub" },
  { title: "Kisumu Music Fest", description: "A day of live performances celebrating the sounds of the lake region.", category: "Music", format: "IN_PERSON", venue: "Jomo Kenyatta Grounds, Kisumu", daysFromNow: 8, hour: 14, capacity: 800, visibility: "PUBLIC", host: "brian@example.com", org: "Kisumu Music Collective" },
  { title: "Intro to Product Design (Online)", description: "Learn the basics of product design, from research to prototypes.", category: "Technology", format: "VIRTUAL", virtualLink: "https://meet.example.com/product-design", daysFromNow: 10, hour: 17, capacity: 150, visibility: "PUBLIC", host: "cynthia@example.com", org: "UoN Student Union" },
  { title: "Charity Gala Dinner", description: "An invite-only evening raising funds for local education programmes.", category: "Community", format: "IN_PERSON", venue: "Villa Rosa Kempinski, Nairobi", daysFromNow: 12, hour: 19, capacity: 120, visibility: "PRIVATE", host: "esther@example.com" },
  { title: "Startup Pitch Night Vol. 2", description: "The next cohort of founders pitch their startups. Networking after.", category: "Startups & Entrepreneurship", format: "IN_PERSON", venue: "Nairobi Garage, Kilimani", daysFromNow: 14, hour: 18, capacity: 80, visibility: "PUBLIC", host: "david@example.com", org: "Kenya Startup Hub" },
  { title: "Rift Valley Marathon Meetup", description: "A training meetup for runners preparing for the season's marathons.", category: "Sports", format: "IN_PERSON", venue: "Kericho Green Stadium", daysFromNow: 16, hour: 7, capacity: 200, visibility: "PUBLIC", host: "robert@example.com", org: "Rift Valley Runners" },
  { title: "Photography Walk", description: "A guided photo walk through the city. Bring any camera, including your phone.", category: "Arts & Culture", format: "IN_PERSON", venue: "Nairobi CBD", daysFromNow: 18, hour: 16, capacity: 30, visibility: "PUBLIC", host: "esther@example.com", org: "Nairobi Creatives" },
  { title: "Gaming Tournament: FIFA Night", description: "Compete in a friendly FIFA tournament. Prizes for the top three.", category: "Gaming", format: "IN_PERSON", venue: "The Alchemist, Westlands", daysFromNow: 20, hour: 17, capacity: 64, visibility: "PUBLIC", host: "james@example.com", org: "Nairobi Gamers League" },
  { title: "Women in Tech Panel", description: "Inspiring stories and practical advice from women leading in tech.", category: "Technology", format: "IN_PERSON", venue: "iHub, Nairobi", daysFromNow: 22, hour: 17, capacity: 100, visibility: "PUBLIC", host: "khadija@example.com", org: "Women in Tech Kenya" },
  { title: "Sunday Service & Community Lunch", description: "Worship followed by a shared community lunch. All are welcome.", category: "Religion", format: "IN_PERSON", venue: "Community Hall, Nakuru", daysFromNow: 24, hour: 10, capacity: null, visibility: "PUBLIC", host: "henry@example.com" },
  { title: "Mombasa Seafood Festival", description: "A celebration of coastal cuisine with tastings and cooking demos.", category: "Food & Drink", format: "IN_PERSON", venue: "Fort Jesus Grounds, Mombasa", daysFromNow: 26, hour: 12, capacity: 350, visibility: "PUBLIC", host: "faisal@example.com", org: "Mombasa Foodies" },
  { title: "Book Club: Kenyan Authors (Online)", description: "A friendly discussion of contemporary Kenyan literature.", category: "Literature & Writing", format: "VIRTUAL", virtualLink: "https://meet.example.com/book-club", daysFromNow: 28, hour: 19, capacity: 50, visibility: "PUBLIC", host: "mary@example.com" },
  { title: "Science Fair & Expo", description: "Student projects, demos, and talks across the sciences.", category: "Science & Research", format: "IN_PERSON", venue: "University of Nairobi, Chiromo Campus", daysFromNow: 30, hour: 9, capacity: 400, visibility: "PUBLIC", host: "cynthia@example.com", org: "UoN Student Union" },
  { title: "Fashion Runway Showcase", description: "Emerging designers present their latest collections on the runway.", category: "Fashion", format: "IN_PERSON", venue: "Sarit Centre, Nairobi", daysFromNow: 33, hour: 18, capacity: 250, visibility: "PUBLIC", host: "esther@example.com", org: "Nairobi Creatives" },
  { title: "Eldoret Entrepreneurs Mixer", description: "Meet fellow entrepreneurs and investors from the North Rift.", category: "Networking", format: "IN_PERSON", venue: "Poa Place, Eldoret", daysFromNow: 36, hour: 18, capacity: 90, visibility: "PUBLIC", host: "leon@example.com", org: "Eldoret Business Network" },
];

async function main() {
  console.log("Seeding categories…");
  const categoriesByName = new Map<string, string>();
  for (const name of CATEGORIES) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categoriesByName.set(name, c.id);
  }

  console.log("Seeding users…");
  const passwordHash = await bcrypt.hash("password123", 10);
  const usersByEmail = new Map<string, { id: string; name: string; email: string }>();
  for (const [name, username, email, location] of USERS) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, username, email, location, passwordHash },
    });
    usersByEmail.set(email, { id: u.id, name: u.name, email: u.email });
  }

  console.log("Seeding organizations…");
  const orgsByName = new Map<string, string>();
  for (const o of ORGS) {
    const owner = usersByEmail.get(o.owner)!;
    const org = await prisma.organization.upsert({
      where: { slug: slugify(o.name) },
      update: {},
      create: {
        name: o.name,
        slug: slugify(o.name),
        description: o.description,
        ownerId: owner.id,
        members: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    orgsByName.set(o.name, org.id);

    for (const adminEmail of o.admins) {
      const admin = usersByEmail.get(adminEmail);
      if (admin) {
        await prisma.organizationMember.upsert({
          where: { organizationId_userId: { organizationId: org.id, userId: admin.id } },
          update: {},
          create: { organizationId: org.id, userId: admin.id, role: "ADMIN" },
        });
      }
    }
    for (const followerEmail of o.followers) {
      const follower = usersByEmail.get(followerEmail);
      if (follower) {
        await prisma.organizationFollow.upsert({
          where: { userId_organizationId: { userId: follower.id, organizationId: org.id } },
          update: {},
          create: { userId: follower.id, organizationId: org.id },
        });
      }
    }
  }

  console.log("Seeding events…");
  const now = new Date();
  const createdEvents: {
    id: string;
    startAt: Date;
    capacity: number | null;
    hostId: string;
  }[] = [];

  for (const e of EVENTS) {
    const host = usersByEmail.get(e.host)!;
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + e.daysFromNow);
    startAt.setHours(e.hour, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        title: e.title,
        description: e.description,
        categoryId: categoriesByName.get(e.category)!,
        format: e.format,
        venue: e.format === "IN_PERSON" ? e.venue : null,
        virtualLink: e.format === "VIRTUAL" ? e.virtualLink : null,
        startAt,
        capacity: e.capacity,
        visibility: e.visibility,
        accessCode:
          e.visibility === "PRIVATE" ? Math.random().toString(36).slice(2, 10).toUpperCase() : null,
        hostId: host.id,
        organizationId: e.org ? orgsByName.get(e.org) : null,
        roles: { create: { userId: host.id, role: "HOST" } },
      },
    });
    createdEvents.push({ id: event.id, startAt, capacity: e.capacity, hostId: host.id });
  }

  console.log("Seeding registrations, tickets, and check-ins…");
  const userList = [...usersByEmail.values()];
  let regCount = 0;
  for (let ei = 0; ei < createdEvents.length; ei++) {
    const ev = createdEvents[ei];
    const isPast = ev.startAt < now;
    let count = 0;
    for (let ui = 0; ui < userList.length; ui++) {
      const u = userList[ui];
      if (u.id === ev.hostId) continue;
      // Deterministic ~55% selection that varies per event.
      if ((ui * 7 + ei * 3) % 9 >= 5) continue;
      if (ev.capacity && count >= ev.capacity) break;

      const cancelled = isPast && (ui + ei) % 11 === 0;
      const reg = await prisma.registration.create({
        data: {
          eventId: ev.id,
          userId: u.id,
          name: u.name,
          email: u.email,
          status: cancelled ? "CANCELLED" : "CONFIRMED",
        },
      });
      const checkedIn = isPast && !cancelled && (ui + ei) % 3 !== 0;
      await prisma.ticket.create({
        data: {
          registrationId: reg.id,
          status: cancelled ? "INVALID" : checkedIn ? "USED" : "VALID",
          checkedInAt: checkedIn ? ev.startAt : null,
          checkedInById: checkedIn ? ev.hostId : null,
        },
      });
      count++;
      regCount++;
    }
  }

  console.log(
    `Seed complete: ${USERS.length} users, ${ORGS.length} orgs, ${CATEGORIES.length} categories, ${EVENTS.length} events, ${regCount} registrations.`,
  );
  console.log("Demo login: host@dunda.dev / password123 (or attendee@dunda.dev)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
