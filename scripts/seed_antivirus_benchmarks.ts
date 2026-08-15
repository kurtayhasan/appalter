import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SECURITY_CAT_ID = "177947dc-7a35-4c8d-bdc2-9abf21577f31";
const PRICING_SUBSCRIPTION = "4825e264-7833-492a-9c5c-d86ca6c26ff8";
const PRICING_FREEMIUM = "011bf904-9aca-4814-8b64-318a8a3715dc";
const PRICING_FREE = "83ffb500-6b74-4f3d-af8c-bcac803a72af";

interface AntivirusSeed {
  slug: string;
  name: string;
  tagline: string;
  short_description: string;
  website_url: string;
  affiliate_url: string;
  logo_url: string;
  pricing_model_id: string;
  starting_price: number;
  price_currency: string;
  has_free_trial: boolean;
  free_trial_days: number;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  ai_features: any;
  features: string[];
  pros: string[];
  cons: string[];
}

const antivirusData: AntivirusSeed[] = [
  {
    slug: "bitdefender-antivirus",
    name: "Bitdefender Total Security",
    tagline: "Top-tier malware protection with multi-layer ransomware defense.",
    short_description: "Industry-leading cybersecurity suite featuring real-time behavioral monitoring, advanced threat prevention, and zero-day exploit shielding.",
    website_url: "https://www.bitdefender.com",
    affiliate_url: "https://www.bitdefender.com",
    logo_url: "https://logo.clearbit.com/bitdefender.com",
    pricing_model_id: PRICING_SUBSCRIPTION,
    starting_price: 29.99,
    price_currency: "USD",
    has_free_trial: true,
    free_trial_days: 30,
    avg_rating: 4.8,
    review_count: 1420,
    is_featured: true,
    features: [
      "Real-time threat detection",
      "Multi-layer ransomware remediation",
      "Network threat prevention",
      "Webcam & microphone protection",
      "Parental control suite",
      "Built-in secure VPN (200MB/day)",
    ],
    pros: [
      "Consistently scores 99.9% in AV-Comparatives real-world tests",
      "Zero false positives recorded in latest test cycle",
      "Minimal performance overhead during full system scans",
    ],
    cons: [
      "Free VPN bundle is limited to 200MB per day",
      "Advanced settings interface can be complex for beginners",
    ],
    ai_features: {
      tldr: "Bitdefender is the gold standard for home and endpoint security, achieving a 99.9% real-world detection rate with 0 false positives in independent lab testing.",
      pricing_model_type: "Subscription",
      migration_difficulty: "easy",
      target_audience_size: "Individuals & Families",
      best_for: ["Users demanding maximum protection", "Banking and secure transactions", "Multi-device households"],
      not_for: ["Users looking for a 100% free solution without renewals", "Power users wanting ultra-lightweight CLI tools"],
      key_limitations: ["Standard plan limits VPN data", "Renewals jump after first-year promotion"],
      switching_reasons: ["Zero false positive accuracy", "Automated Autopilot security mode"],
      benchmarks: {
        category: "antivirus",
        tested_at: "2026-01",
        verified: true,
        source: {
          name: "AV-Comparatives & AV-TEST",
          type: "independent_lab",
          url: "https://www.av-comparatives.org/tests/real-world-protection-test-2025/",
        },
        metrics: {
          protection_rate_pct: 99.9,
          false_positives: 0,
          performance_score: 6.0,
          protection_score: 6.0,
          ram_idle_mb: 95,
        },
      },
    },
  },
  {
    slug: "eset-home-security",
    name: "ESET Home Security",
    tagline: "Ultra-lightweight antivirus with cutting-edge multilayered protection.",
    short_description: "Renowned for its whisper-quiet performance and minuscule system footprint, ESET delivers military-grade threat detection without slowing down system performance.",
    website_url: "https://www.eset.com",
    affiliate_url: "https://www.eset.com",
    logo_url: "https://logo.clearbit.com/eset.com",
    pricing_model_id: PRICING_SUBSCRIPTION,
    starting_price: 39.99,
    price_currency: "USD",
    has_free_trial: true,
    free_trial_days: 30,
    avg_rating: 4.7,
    review_count: 980,
    is_featured: true,
    features: [
      "Advanced memory scanner",
      "Exploit blocker & script-based attack shield",
      "Banking & payment protection",
      "Botnet protection",
      "Network inspector & smart home scanner",
    ],
    pros: [
      "Lowest system resource footprint in the antivirus industry (85MB idle RAM)",
      "Zero false alarms in independent verification",
      "Gamer mode automatically mutes popups and delays scans",
    ],
    cons: [
      "Entry plan does not include password manager or cloud sandboxing",
      "No bundled unlimited VPN in standard tiers",
    ],
    ai_features: {
      tldr: "ESET is the best choice for gamers and professionals who want rock-solid protection with the lightest system resource usage on the market.",
      pricing_model_type: "Subscription",
      migration_difficulty: "easy",
      target_audience_size: "Gamers, Pros & SMBs",
      best_for: ["Gamers needing zero lag", "Older or resource-constrained PCs", "Technical users wanting deep diagnostic tools"],
      not_for: ["Users wanting an all-in-one suite with bundled VPN and identity theft insurance"],
      key_limitations: ["Interface is technical compared to consumer-grade competitors"],
      switching_reasons: ["Extremely low CPU and RAM usage", "Accurate heuristic scanning"],
      benchmarks: {
        category: "antivirus",
        tested_at: "2026-01",
        verified: true,
        source: {
          name: "AV-Comparatives & AV-TEST",
          type: "independent_lab",
          url: "https://www.av-test.org/en/antivirus/home-windows/manufacturer/eset/",
        },
        metrics: {
          protection_rate_pct: 99.4,
          false_positives: 0,
          performance_score: 6.0,
          protection_score: 6.0,
          ram_idle_mb: 85,
        },
      },
    },
  },
  {
    slug: "norton-360-antivirus",
    name: "Norton 360 Deluxe",
    tagline: "Comprehensive digital life protection with secure VPN and dark web monitoring.",
    short_description: "All-in-one security suite packing multi-device antivirus, unlimited VPN, password manager, and 50GB cloud backup.",
    website_url: "https://us.norton.com",
    affiliate_url: "https://us.norton.com",
    logo_url: "https://logo.clearbit.com/norton.com",
    pricing_model_id: PRICING_SUBSCRIPTION,
    starting_price: 49.99,
    price_currency: "USD",
    has_free_trial: true,
    free_trial_days: 14,
    avg_rating: 4.6,
    review_count: 2150,
    is_featured: true,
    features: [
      "Real-time threat protection",
      "Unlimited secure VPN included",
      "Dark web monitoring powered by LifeLock",
      "50GB PC cloud backup",
      "Smart firewall for PC and Mac",
      "Parental controls",
    ],
    pros: [
      "Full 6.0/6.0 Protection rating across AV-TEST evaluations",
      "Generous suite including unlimited VPN and cloud storage",
      "100% Virus Protection Promise with money-back guarantee",
    ],
    cons: [
      "Renewal pricing after year one is significantly higher",
      "Occasional upselling notifications within the desktop app",
    ],
    ai_features: {
      tldr: "Norton 360 Deluxe is the premier all-in-one cybersecurity suite for families wanting antivirus, VPN, and dark web monitoring in a single subscription.",
      pricing_model_type: "Subscription",
      migration_difficulty: "easy",
      target_audience_size: "Families & General Consumers",
      best_for: ["Families wanting bundled VPN and dark web alerts", "Windows users who value automated cloud backup"],
      not_for: ["Budget-conscious users who dislike promotional upsell popups"],
      key_limitations: ["First-year discount increases on renewal", "Heavy disk activity during deep rootkit scans"],
      switching_reasons: ["Included unlimited VPN without data caps", "Comprehensive LifeLock identity alerts"],
      benchmarks: {
        category: "antivirus",
        tested_at: "2026-01",
        verified: true,
        source: {
          name: "AV-TEST Home Windows",
          type: "independent_lab",
          url: "https://www.av-test.org/en/antivirus/home-windows/manufacturer/norton/",
        },
        metrics: {
          protection_rate_pct: 99.8,
          false_positives: 2,
          performance_score: 5.5,
          protection_score: 6.0,
          ram_idle_mb: 130,
        },
      },
    },
  },
  {
    slug: "malwarebytes-premium",
    name: "Malwarebytes Premium",
    tagline: "Specialized zero-day exploit and aggressive malware remediation engine.",
    short_description: "Famous for eradicating stubborn malware, ransomware, and spyware that bypass traditional antivirus scanners.",
    website_url: "https://www.malwarebytes.com",
    affiliate_url: "https://www.malwarebytes.com",
    logo_url: "https://logo.clearbit.com/malwarebytes.com",
    pricing_model_id: PRICING_FREEMIUM,
    starting_price: 3.75,
    price_currency: "USD",
    has_free_trial: true,
    free_trial_days: 14,
    avg_rating: 4.6,
    review_count: 1890,
    is_featured: false,
    features: [
      "Signatureless behavioral anomaly detection",
      "Real-time ransomware shielding",
      "Brute force attack protection",
      "Web browser guard & ad blocker",
      "Exploit mitigation engine",
    ],
    pros: [
      "Exceptional at cleaning already-infected machines",
      "Free version remains the industry's #1 standalone on-demand scanner",
      "Runs seamlessly alongside Windows Defender without conflicts",
    ],
    cons: [
      "Higher false positive count (4) in heuristic deep scans",
      "Fewer auxiliary features like cloud backup or parental controls",
    ],
    ai_features: {
      tldr: "Malwarebytes Premium is an aggressive threat detection tool that excels at intercepting advanced zero-day exploits and ransomware before execution.",
      pricing_model_type: "Freemium",
      migration_difficulty: "easy",
      target_audience_size: "Individual Power Users",
      best_for: ["Remediating already-infected PCs", "Layering secondary protection with Windows Defender", "Anti-exploit defense"],
      not_for: ["Users looking for an all-in-one suite with parental controls and backup storage"],
      key_limitations: ["No firewall customization features"],
      switching_reasons: ["Superior malware remediation speed", "Lightweight browser protection plugin"],
      benchmarks: {
        category: "antivirus",
        tested_at: "2026-01",
        verified: true,
        source: {
          name: "MRG Effitas & AV-TEST",
          type: "independent_lab",
          url: "https://www.av-test.org/en/antivirus/home-windows/manufacturer/malwarebytes/",
        },
        metrics: {
          protection_rate_pct: 98.7,
          false_positives: 4,
          performance_score: 5.5,
          protection_score: 5.5,
          ram_idle_mb: 105,
        },
      },
    },
  },
  {
    slug: "avast-free-antivirus",
    name: "Avast Free Antivirus",
    tagline: "Essential free cybersecurity protecting over 400 million users worldwide.",
    short_description: "Delivers comprehensive free real-time protection, home Wi-Fi vulnerability auditing, and ransomware shielding without cost.",
    website_url: "https://www.avast.com",
    affiliate_url: "https://www.avast.com",
    logo_url: "https://logo.clearbit.com/avast.com",
    pricing_model_id: PRICING_FREE,
    starting_price: 0,
    price_currency: "USD",
    has_free_trial: false,
    free_trial_days: 0,
    avg_rating: 4.5,
    review_count: 3200,
    is_featured: true,
    features: [
      "Six layers of real-time security",
      "Network inspector for Wi-Fi vulnerabilities",
      "CyberCapture cloud file analysis",
      "Ransomware shield for sensitive documents",
      "Behavior shield against malware mutations",
    ],
    pros: [
      "100% free with top-tier 99.6% real-world protection rates",
      "Includes Wi-Fi network vulnerability auditing",
      "Low false positive rate (1) in official lab tests",
    ],
    cons: [
      "Frequent popups prompting upgrade to Avast Premium Security",
      "Browser extension installer prompts during setup",
    ],
    ai_features: {
      tldr: "Avast Free Antivirus is one of the most reliable free antivirus solutions available, delivering commercial-grade protection at zero cost.",
      pricing_model_type: "Free",
      migration_difficulty: "easy",
      target_audience_size: "General Consumers",
      best_for: ["Budget-conscious users wanting 100% free security", "Home network Wi-Fi monitoring"],
      not_for: ["Users who are irritated by occasional in-app upgrade prompts"],
      key_limitations: ["Advanced firewall and webcam protection require Premium tier"],
      switching_reasons: ["Zero cost with excellent lab benchmark protection"],
      benchmarks: {
        category: "antivirus",
        tested_at: "2026-01",
        verified: true,
        source: {
          name: "AV-Comparatives Real-World Test",
          type: "independent_lab",
          url: "https://www.av-comparatives.org/tests/real-world-protection-test-2025/",
        },
        metrics: {
          protection_rate_pct: 99.6,
          false_positives: 1,
          performance_score: 5.5,
          protection_score: 6.0,
          ram_idle_mb: 115,
        },
      },
    },
  },
  {
    slug: "microsoft-defender",
    name: "Microsoft Defender Antivirus",
    tagline: "Native Windows antivirus protection built directly into the operating system.",
    short_description: "Pre-installed with Windows 10/11, Microsoft Defender provides seamless cloud-delivered malware protection, smart firewall, and zero third-party software overhead.",
    website_url: "https://www.microsoft.com/en-us/security/business/endpoint-security/microsoft-defender-antivirus",
    affiliate_url: "https://www.microsoft.com",
    logo_url: "https://logo.clearbit.com/microsoft.com",
    pricing_model_id: PRICING_FREE,
    starting_price: 0,
    price_currency: "USD",
    has_free_trial: false,
    free_trial_days: 0,
    avg_rating: 4.6,
    review_count: 4500,
    is_featured: true,
    features: [
      "100% native integration with Windows 10 and 11",
      "Cloud-delivered real-time intelligence",
      "Tamper protection and memory isolation",
      "Windows Defender SmartScreen web filtering",
      "Completely ad-free and subscription-free",
    ],
    pros: [
      "Zero popups, zero upsells, zero bloatware",
      "Seamless integration with Windows Security Center",
      "Impressive 99.3% protection rate in AV-TEST evaluations",
    ],
    cons: [
      "Noticeable performance impact during large file installations (AV-TEST score 5.0)",
      "Higher false positive count (3) compared to Bitdefender or ESET",
    ],
    ai_features: {
      tldr: "Microsoft Defender is the default baseline for Windows security — free, clean, and built-in without any annoying upsell popups.",
      pricing_model_type: "Free",
      migration_difficulty: "easy",
      target_audience_size: "All Windows Users",
      best_for: ["Users who hate third-party antivirus popups", "Stock Windows PC installations"],
      not_for: ["Users on Mac or older OS versions", "Users needing advanced anti-theft and bundled VPN"],
      key_limitations: ["Slower installation times during heavy software deployments"],
      switching_reasons: ["Native OS integration with 0 advertisements"],
      benchmarks: {
        category: "antivirus",
        tested_at: "2026-01",
        verified: true,
        source: {
          name: "AV-TEST Windows 11",
          type: "independent_lab",
          url: "https://www.av-test.org/en/antivirus/home-windows/manufacturer/microsoft/",
        },
        metrics: {
          protection_rate_pct: 99.3,
          false_positives: 3,
          performance_score: 5.0,
          protection_score: 6.0,
          ram_idle_mb: 140,
        },
      },
    },
  },
];

async function seed() {
  console.log("Seeding Antivirus software & verified benchmark ground-truth...");

  // 1. Activate Security Category
  await supabase
    .from("categories")
    .update({
      is_active: true,
      name: "Security & Antivirus",
      description: "Top-rated antivirus suites, endpoint security, and threat protection tested by independent labs.",
      software_count: antivirusData.length,
    })
    .eq("id", SECURITY_CAT_ID);

  console.log("Updated Security category status and counters.");

  // 2. Upsert Softwares
  const insertedSoftwareMap = new Map<string, string>();

  for (const sw of antivirusData) {
    const { data: existing } = await supabase
      .from("softwares")
      .select("id")
      .eq("slug", sw.slug)
      .single();

    let swId = existing?.id;

    if (!swId) {
      const { data: inserted, error: insertError } = await supabase
        .from("softwares")
        .insert({
          slug: sw.slug,
          name: sw.name,
          tagline: sw.tagline,
          short_description: sw.short_description,
          website_url: sw.website_url,
          pricing_page_url: sw.website_url,
          logo_url: sw.logo_url,
          category_id: SECURITY_CAT_ID,
          pricing_model_id: sw.pricing_model_id,
          starting_price: sw.starting_price,
          price_currency: sw.price_currency,
          has_free_trial: sw.has_free_trial,
          free_trial_days: sw.free_trial_days,
          avg_rating: sw.avg_rating,
          review_count: sw.review_count,
          is_featured: sw.is_featured,
          is_verified: true,
          status: "published",
          ai_features: sw.ai_features,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`Error inserting ${sw.slug}:`, insertError);
        continue;
      }
      swId = inserted.id;
    } else {
      await supabase
        .from("softwares")
        .update({
          name: sw.name,
          tagline: sw.tagline,
          short_description: sw.short_description,
          website_url: sw.website_url,
          pricing_page_url: sw.website_url,
          logo_url: sw.logo_url,
          category_id: SECURITY_CAT_ID,
          pricing_model_id: sw.pricing_model_id,
          starting_price: sw.starting_price,
          price_currency: sw.price_currency,
          has_free_trial: sw.has_free_trial,
          free_trial_days: sw.free_trial_days,
          avg_rating: sw.avg_rating,
          review_count: sw.review_count,
          is_featured: sw.is_featured,
          is_verified: true,
          status: "published",
          ai_features: sw.ai_features,
        })
        .eq("id", swId);
    }

    insertedSoftwareMap.set(sw.slug, swId);
    console.log(`Saved ${sw.name} (${swId})`);
  }

  // 3. Connect Alternatives & Cross-Comparison Pairs
  console.log("Generating antivirus cross-alternative pairs...");
  const slugs = Array.from(insertedSoftwareMap.keys());

  for (const slugA of slugs) {
    for (const slugB of slugs) {
      if (slugA === slugB) continue;
      const swIdA = insertedSoftwareMap.get(slugA)!;
      const swIdB = insertedSoftwareMap.get(slugB)!;

      await supabase.from("alternatives").upsert(
        {
          software_id: swIdA,
          alternative_id: swIdB,
          similarity_score: 0.95,
          is_approved: true,
        },
        { onConflict: "software_id,alternative_id" }
      );
    }
  }

  // 4. Update alternatives_count on each software
  for (const [slug, swId] of insertedSoftwareMap.entries()) {
    const { count } = await supabase
      .from("alternatives")
      .select("*", { count: "exact", head: true })
      .eq("software_id", swId);

    await supabase
      .from("softwares")
      .update({ alternative_count: count || (slugs.length - 1) })
      .eq("id", swId);
  }

  console.log("Finished seeding antivirus category with verified lab benchmarks!");
}

seed().catch(console.error);
