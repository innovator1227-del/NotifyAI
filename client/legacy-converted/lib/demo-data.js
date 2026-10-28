// Demo notification provider: realistic sample data, always flagged is_seed and platform-tagged.
const SAMPLES = {
  facebook: [
    {
      sender_name: "Mom",
      sender_username: "mary.k",
      message: "Call me when you can, it's about Sunday's family dinner.",
      hoursAgo: 2,
    },
    {
      sender_name: "Campus Events",
      sender_username: "uon.events",
      message: "Reminder: Career fair tomorrow at 10am in the main hall.",
      hoursAgo: 9,
    },
    {
      sender_name: "ShopNow",
      sender_username: "shopnow",
      message: "Flash sale! 60% off everything for the next 3 hours. Buy now!",
      hoursAgo: 5,
    },
  ],
  instagram: [
    {
      sender_name: "Amani W.",
      sender_username: "amani.w",
      message: "Amani commented on your post: 'This shot is incredible 🔥'",
      hoursAgo: 1,
    },
    {
      sender_name: "Instagram",
      sender_username: "instagram",
      message:
        "We noticed a login attempt from a new device in Lagos. Was this you? Secure your account.",
      hoursAgo: 0.5,
    },
    {
      sender_name: "Brian O.",
      sender_username: "brian.o",
      message: "Brian and 14 others liked your story.",
      hoursAgo: 7,
    },
  ],
  x: [
    {
      sender_name: "TechCrunch",
      sender_username: "techcrunch",
      message:
        "Breaking: Major AI lab announced a new open model family today.",
      hoursAgo: 3,
    },
    {
      sender_name: "Dev Kamau",
      sender_username: "devkamau",
      message:
        "@you mentioned you in a thread: can you review the API proposal before Friday's deadline?",
      hoursAgo: 4,
    },
  ],
  linkedin: [
    {
      sender_name: "Sarah Chen",
      sender_username: "sarah-chen",
      message:
        "Hi! I'm a recruiter at Fintech Co. Would you be open to a call about a senior engineer role this week?",
      hoursAgo: 6,
    },
    {
      sender_name: "Project Atlas Team",
      sender_username: "atlas",
      message:
        "Urgent: client meeting moved to 9am today. Please update the sprint report before then.",
      hoursAgo: 1.5,
    },
  ],
  youtube: [
    {
      sender_name: "Fireship",
      sender_username: "fireship",
      message: "New video: 'Every database explained in 100 seconds'",
      hoursAgo: 12,
    },
    {
      sender_name: "Prof. Otieno",
      sender_username: "otieno-lectures",
      message:
        "Lecture 8 recording is up. Assignment 3 is due next Monday — check the course page.",
      hoursAgo: 20,
    },
  ],
  telegram: [
    {
      sender_name: "Study Group",
      sender_username: "cs_study",
      message:
        "Exam prep session tonight at 8pm, bring your notes on graph algorithms.",
      hoursAgo: 3,
    },
    {
      sender_name: "CryptoDeals",
      sender_username: "cryptodeals",
      message:
        "Limited time offer!!! Free trial of our signal bot, 10x guaranteed.",
      hoursAgo: 8,
    },
  ],
  demo: [
    {
      sender_name: "Bank Alerts",
      sender_username: "kcb-alerts",
      message: "Your verification code is 482913. Do not share it with anyone.",
      hoursAgo: 0.2,
    },
    {
      sender_name: "Jane (Manager)",
      sender_username: "jane.m",
      message:
        "Can you send the Q3 invoice summary to the client today? It's a bit urgent.",
      hoursAgo: 2.5,
    },
  ],
};
export function demoBatch(provider) {
  const now = Date.now();
  return (SAMPLES[provider] ?? SAMPLES["demo"] ?? []).map((s, i) => ({
    platform: provider,
    external_notification_id: `demo-${provider}-${i}`,
    sender_name: s.sender_name,
    sender_username: s.sender_username,
    message: s.message,
    received_at: new Date(now - s.hoursAgo * 3600_000).toISOString(),
  }));
}
