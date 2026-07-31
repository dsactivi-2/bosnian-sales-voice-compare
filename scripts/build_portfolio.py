#!/usr/bin/env python3
"""Build portfolio v3: curated telesales voices + long eval script + agent profiles."""
import json
from pathlib import Path
from collections import Counter

# ── Full evaluation script (UI / scoring) — long, stress-rich ──────────────
FULL_SCRIPT_BS = """[friendly][confident] Dobar dan! Zovem se Ana Hadžić, viša prodajna savjetnica u Activi Soft d.o.o. sa sjedištem u Sarajevu, Zmaja od Bosne 7.
[pause] Zovem vas u vezi vašeg zahtjeva od petnaestog marta dvije hiljade dvadeset šeste godine, tačno u četrnaest sati i trideset minuta, referentni broj AS-2026-0847.
[soft] Moj kolega Marko Petrović vodi tehničku evaluaciju. On je dostupan od devet do sedamnaest sati svakog radnog dana. Ona — dakle ja, Ana — vodi onboarding i ugovore; on — Marko — vodi integracije i API.
[confident] Uz paket Enterprise Pro Plus možete uštedjeti trideset dva zarez pet posto na mjesečnim troškovima, što je približno stotinu osamdeset i pet KM, odnosno devedeset četiri eura i pedeset centi.
[pause] Pišite nam na ana.hadzic@activi-soft.ba ili marko.petrovic@activi-soft.ba. Demo rezervišete na https://activi.io/demo-bosna?ref=AS-2026-0847.
[soft][empathetic] Razumijem da sada niste slobodni — to je u redu. Recite mi samo preferirani termin: utorak u deset i petnaest, ili četvrtak u šesnaest sati?
[confident] Ako vam se cijena čini visokom: u prva tri mjeseca nema setup naknade, a podrška je uključena. Bez pritiska — odluka je vaša.
[friendly] Hvala na vremenu. Lijep pozdrav iz Activi Soft-a, Ana Hadžić."""

FULL_SCRIPT_EN = """[friendly][confident] Good afternoon! My name is Ana Hadzic, senior sales advisor at Activi Soft LLC, based in Sarajevo at Zmaja od Bosne 7.
[pause] I'm calling about your request from March fifteenth, twenty twenty-six, at exactly two thirty p.m., reference number AS-2026-0847.
[soft] My colleague Marko Petrovic leads technical evaluation. He is available from nine to five every business day. She — that is me, Ana — leads onboarding and contracts; he — Marko — leads integrations and the API.
[confident] With the Enterprise Pro Plus package you can save thirty-two point five percent on monthly costs, about one hundred eighty-five convertible marks, or ninety-four euros and fifty cents.
[pause] Email us at ana.hadzic@activi-soft.ba or marko.petrovic@activi-soft.ba. Book a demo at https://activi.io/demo-bosnia?ref=AS-2026-0847.
[soft][empathetic] I understand now is not a good time — that is fine. Just tell me a preferred slot: Tuesday at ten fifteen, or Thursday at four p.m.?
[confident] If the price feels high: the first three months have no setup fee, and support is included. No pressure — the decision is yours.
[friendly] Thank you for your time. Best regards from Activi Soft, Ana Hadzic."""

# Free plan ≤500 UTF-8 bytes — short stress sample for audio
TTS_BS = "[friendly][confident] Dobar dan! Ana iz Activi Soft. Marko i ja, 15.3. u 14:30, AS-2026. Ušteda 32%. ana@activi.io — imate li minut?"
TTS_EN = "[friendly][confident] Hello! Ana, Activi Soft. Marko and I, March 15 at 2:30, AS-2026. Save 32%. ana@activi.io — one minute?"


def VI(opening, pace, tone, avoid, brackets="[friendly][confident]", extra=""):
    agent = (
        f"You are a professional tele-sales / contact-center voice agent. "
        f"Tone: {tone}. Pace: {pace}. Opening: {opening}. Never: {avoid}. "
        f"Pronounce names Ana (she/ona) and Marko (he/on) naturally. "
        f"Speak numbers, dates, times, emails and URLs clearly for phone audio. "
        f"{extra}"
    ).strip()
    return {
        "opening": opening,
        "pace": pace,
        "tone": tone,
        "avoid": avoid,
        "bracket_defaults": brackets,
        "agent_system": agent,
    }


def v(id_, title, sex, lang, note, tags, age, role, vi, group, source="library"):
    return {
        "id": id_,
        "title": title,
        "sex": sex,
        "lang": lang,
        "note": note,
        "tags": tags,
        "age": age,
        "role": role,
        "group": group,
        "source": source,
        "voice_instructions": vi,
        "audio": "",
    }


voices = []

# ========== BS male 10 ==========
voices += [
    v("91526c9cbb5841858a34cb87ae739e89", "BS · Profesionalni Muški", "m", "bs",
      "Seriöser B2B-Outbound, klar und gemessen — Primärkandidat",
      "male,middle-aged,professional,telesales,outbound,call-center,conversational,confident,trustworthy,corporate,natural,clear,calm,persuasive".split(","),
      "middle-aged", "outbound",
      VI("Ruhiger Firmenname + Nutzen in einem Atemzug", "measured", "professional confident", "rush, shout, comedy, character"),
      "bs"),
    v("5d664201f86b4182bf758f6040c409fa", "BS · NAGLIC Clear Pro", "m", "bs",
      "Neutral-klar, Callcenter-Standard, hohe Verständlichkeit",
      "male,middle-aged,professional,telesales,call-center,inbound,clear,calm,measured,corporate,trustworthy,natural,smooth".split(","),
      "middle-aged", "call-center",
      VI("Neutral-klar wie erfahrener Agent", "measured", "calm clear professional", "drama, character, raspy chaos"),
      "bs"),
    v("020fa2f81d65408383cd6e21d6be2f2d", "BS · Samouvjeren Sales", "m", "bs",
      "Allround confident Sales mit Lächeln in der Stimme",
      "male,middle-aged,professional,telesales,outbound,conversational,confident,energetic,persuasive,natural,friendly".split(","),
      "middle-aged", "outbound",
      VI("Selbstsicher + Lächeln; sanfter Close", "natural", "confident friendly", "monotone, hard-close pressure"),
      "bs"),
    v("99a4e1cc695b49128a195f526152d699", "BS · Mekani Muški", "m", "bs",
      "Weicher, warmer Inbound-/Relationship-Ton",
      "male,middle-aged,professional,telesales,inbound,customer-service,warm,soft,friendly,trustworthy,calm,conversational,natural".split(","),
      "middle-aged", "inbound",
      VI("Weich einladend, kein Announcer", "relaxed", "warm soft professional", "loud, announcer boom"),
      "bs"),
    v("512d154db0ff458aac007c8ff2f1ebfd", "BS · Ramo Podcast Pro", "m", "bs",
      "Podcast-seriös, consultative B2B",
      "male,mature,professional,telesales,conversational,trustworthy,corporate,serious,natural,premium,consultative".split(","),
      "mature", "consultative",
      VI("Berater-Ton, ruhige Autorität", "conversational-measured", "serious warm", "hype, gaming, theatrics"),
      "bs"),
    v("fe492e6fc04148cf84716186c2be52c6", "BS · Narator Warm", "m", "bs",
      "Ruhiger Narrator, warm erklärend — Demo/Explain",
      "male,middle-aged,professional,customer-service,warm,calm,clear,trustworthy,expressive,natural,telesales".split(","),
      "middle-aged", "explain",
      VI("Erklärend warm, Zahlen klar", "measured", "warm professional", "flat robot, cold"),
      "bs"),
    v("f7058cf45a604ec59b43801ae26cb8a6", "BS · Jasni Measured", "m", "bs",
      "Klar und gemessen — Telefon-Verständlichkeit",
      "male,middle-aged,professional,telesales,clear,measured,confident,corporate,natural,outbound,call-center".split(","),
      "middle-aged", "outbound",
      VI("Jedes Wort klar am Telefon", "measured", "clear confident", "mumble, rush, breathy"),
      "bs"),
    v("c8c0d4318eec4e5d8f997bf098e8adeb", "BS · Sale Deep Calm", "m", "bs",
      "Deep calm premium — Enterprise / High-Ticket",
      "male,middle-aged,professional,telesales,deep,calm,smooth,trustworthy,conversational,premium,enterprise".split(","),
      "middle-aged", "premium",
      VI("Tief, ruhig, premium ohne Drama", "slow-calm", "deep calm premium", "raspy chaos, character"),
      "bs"),
    v("10344f42d6f342b683f9806c4594cedd", "BS · Narativni Calm", "m", "bs",
      "Ruhig-narrativ, freundlich-klar für längere Pitches",
      "male,middle-aged,professional,telesales,narration,calm,measured,friendly,clear,expressive,natural,conversational".split(","),
      "middle-aged", "consultative",
      VI("Narrativ ruhig, dann Nutzen", "measured", "calm friendly narrative", "entertainment hype"),
      "bs"),
    v("d5b9ed88d72b47519fc174d4cc9b2b1a", "BS · Alex Marco Pro", "m", "bs",
      "Klar-confident educational Pro-Ton",
      "male,middle-aged,professional,telesales,clear,crisp,confident,measured,calm,authoritative,friendly,natural,outbound".split(","),
      "middle-aged", "outbound",
      VI("Klar, confident, höflich", "measured", "clear confident professional", "shout, slang"),
      "bs"),
]

# ========== BS female 10 ==========
voices += [
    v("a45966a2eaad4fb8a64bc844869aabcc", "BS · Motivacioni Closing", "f", "bs",
      "Warm + Closing-Fit — Top-Kandidat Outbound Close",
      "female,middle-aged,professional,telesales,outbound,warm,confident,persuasive,friendly,premium,natural,expressive,closing".split(","),
      "middle-aged", "closing",
      VI("Warm zum Close führen; Ana", "natural", "warm confident persuasive", "cold flat, hard pressure"),
      "bs"),
    v("ff407d8678d940a584b614153c5f1a0f", "BS · Savremeni Outbound", "f", "bs",
      "Klassische professionelle Outbound-Stimme",
      "female,middle-aged,professional,telesales,outbound,call-center,clear,calm,friendly,corporate,natural,measured".split(","),
      "middle-aged", "outbound",
      VI("Klassisch professionell Outbound", "measured", "clear friendly pro", "breathy intimate, hype"),
      "bs"),
    v("e87d1b2fc7ed40d2940e69068b0ca726", "BS · Jasna Erklärend", "f", "bs",
      "Ruhig erklärend, vertrauensvoll — Inbound/Support",
      "female,middle-aged,professional,customer-service,inbound,calm,measured,trustworthy,clear,conversational,natural,telesales".split(","),
      "middle-aged", "inbound",
      VI("Ruhig erklären, dann soft upsell", "measured", "calm trustworthy", "fast sales pitch"),
      "bs"),
    v("03cfb7745c4a4200b55dd7baa09e3c59", "BS · Dinamična Young", "f", "bs",
      "Energie für jüngere Zielgruppe, kontrolliert",
      "female,young,professional,telesales,outbound,energetic,friendly,clear,young,persuasive,natural,bright".split(","),
      "young", "outbound-young",
      VI("Lebendig aber kontrolliert", "brisk", "energetic friendly pro", "screamy, playful chaos"),
      "bs"),
    v("e68e5082d6ec4124a65d2df25dbe1297", "BS · Melodični Warm", "f", "bs",
      "Melodisch warm expressiv — Relationship Sales",
      "female,middle-aged,professional,telesales,warm,expressive,friendly,persuasive,natural,soft,relationship".split(","),
      "middle-aged", "relationship",
      VI("Melodisch warm, nicht theatralisch", "natural", "warm expressive", "monotone, cartoon"),
      "bs"),
    v("5305f70004634f8da3836d5befaba3e0", "BA · Hrvatska Govornica Pro", "f", "bs",
      "Ruhige Pro-Sprecherin (BCMS, BA-tauglich)",
      "female,middle-aged,professional,telesales,call-center,calm,clear,smooth,corporate,trustworthy,natural,bcms".split(","),
      "middle-aged", "call-center",
      VI("Ruhig professionell BCMS", "measured", "calm clear pro", "announcer boom"),
      "bs"),
    v("c937a3fe42fd431f84228ce8d04fc69a", "BA · Ugodan Warm Pro", "f", "bs",
      "Angenehm friendly pro (BCMS)",
      "female,middle-aged,professional,telesales,customer-service,warm,friendly,professional,natural,trustworthy,bcms".split(","),
      "middle-aged", "service-sales",
      VI("Angenehm und sicher", "natural", "warm friendly pro", "cold script"),
      "bs"),
    v("408dadcbecaa42bca59946b2f77f9704", "BA · Vedra Clear Pro", "f", "bs",
      "Klar, warm, professional narrative (BCMS)",
      "female,middle-aged,professional,telesales,clear,crisp,warm,friendly,expressive,natural,premium,bcms".split(","),
      "middle-aged", "premium-female",
      VI("Klar wie Nachrichten, warm wie Service", "measured", "clear warm professional", "cartoon energy"),
      "bs"),
    v("7945a25f1df040f5897aedd0998402bc", "BA · Jasna Hrvatska Pro", "f", "bs",
      "Clear warm professional female BCMS",
      "female,middle-aged,professional,telesales,clear,warm,professional,trustworthy,natural,outbound,bcms".split(","),
      "middle-aged", "outbound",
      VI("Warm-professionell Outbound", "measured", "clear warm pro", "flat robot"),
      "bs"),
    v("f151b508e68d4af98251f3f41d65b4fd", "BS · Sk Warm Pro", "f", "bs",
      "Warm-friendly conversational Pro (kontrolliert)",
      "female,middle-aged,professional,telesales,warm,friendly,clear,expressive,smooth,natural,conversational,customer-service".split(","),
      "middle-aged", "relationship",
      VI("Warm conversational, telefongeeignet", "natural", "warm friendly professional", "angry edge, breathy ASMR"),
      "bs"),
]

# ========== HR male 5 ==========
voices += [
    v("af29d14bf4114c258e335370877ef67b", "HR · Mirni Muški", "m", "hr",
      "Calm conversational professional — HR Callcenter",
      "male,middle-aged,professional,telesales,call-center,calm,clear,conversational,trustworthy,natural,croatian".split(","),
      "middle-aged", "call-center",
      VI("Ruhig und klar HR", "measured", "calm professional", "angry edge"),
      "hr"),
    v("aabfa168f35645af9aaa3cdaa442a66c", "HR · Deep Conversational", "m", "hr",
      "Conversational deep male — consultative",
      "male,middle-aged,professional,telesales,conversational,confident,warm,deep,natural,premium,croatian".split(","),
      "middle-aged", "consultative",
      VI("Conversational deep, warm", "natural", "confident warm", "shout"),
      "hr"),
    v("82036e17ed4e4538b454c09d694c7286", "HR · Direktni Sales", "m", "hr",
      "Direct confident sales — Outbound",
      "male,middle-aged,professional,telesales,outbound,confident,energetic,persuasive,clear,natural,croatian".split(","),
      "middle-aged", "outbound",
      VI("Direkt aber höflich", "brisk", "direct confident", "aggressive close"),
      "hr"),
    v("d7dc6b903e89473b9000d06a872ca70c", "HR · Stariji Clear Pro", "m", "hr",
      "Mature clear professional narrator",
      "male,mature,professional,telesales,clear,crisp,calm,measured,corporate,authoritative,natural,croatian".split(","),
      "mature", "corporate",
      VI("Reif, klar, corporate", "measured", "clear mature pro", "character, raspy"),
      "hr"),
    v("f4a8102b8cfb42e9861bc653b358bd3d", "HR · Duboki Authority", "m", "hr",
      "Deep calm authority — Enterprise HR",
      "male,mature,professional,telesales,deep,authoritative,calm,corporate,trustworthy,clear,croatian".split(","),
      "mature", "enterprise",
      VI("Ruhige Autorität ohne Härte", "slow-measured", "deep calm authority", "drama, politician tone"),
      "hr"),
]

# ========== HR female 5 ==========
voices += [
    v("5c78ae5c74a24f87a9f232073641ab08", "HR · Topli Gentle", "f", "hr",
      "Warm gentle female — Inbound",
      "female,middle-aged,professional,customer-service,inbound,warm,calm,friendly,soft,trustworthy,natural,croatian".split(","),
      "middle-aged", "inbound",
      VI("Sanft und warm", "relaxed", "warm gentle", "loud pitch"),
      "hr"),
    v("d30566a322d04a838ca3426219b46c13", "HR · Topli Soft Pro", "f", "hr",
      "Warm soft professional — Relationship",
      "female,middle-aged,professional,customer-service,warm,soft,friendly,clear,natural,premium,croatian,telesales".split(","),
      "middle-aged", "relationship",
      VI("Weich professionell", "natural", "warm soft pro", "sexy intimate"),
      "hr"),
    v("f9ce273371064cff93081d046afebb86", "HR · Mirna Empathic", "f", "hr",
      "Calm empathetic — Objection handling",
      "female,mature,professional,customer-service,inbound,calm,warm,empathetic,trustworthy,gentle,natural,croatian".split(","),
      "mature", "empathy",
      VI("Empathisch ruhig bei Einwand", "slow-measured", "empathetic calm", "rushed pitch"),
      "hr"),
    v("da1f9cb818c0459aacfd36ad137053ef", "HR · Snažan Confident", "f", "hr",
      "Strong confident female Outbound",
      "female,middle-aged,professional,telesales,outbound,confident,professional,dynamic,persuasive,natural,croatian".split(","),
      "middle-aged", "outbound",
      VI("Stark und sicher, nie hart", "natural-brisk", "confident strong pro", "harsh"),
      "hr"),
    v("d418491e5ad14320aaf35ddf4168a4f0", "HR · Srdačan Friendly", "f", "hr",
      "Cordial friendly — Service + Soft Sales",
      "female,middle-aged,professional,telesales,customer-service,friendly,warm,relaxed,natural,outbound,croatian".split(","),
      "middle-aged", "friendly-sales",
      VI("Herzlich freundlich", "natural", "cordial friendly", "cold"),
      "hr"),
]

# ========== SR male 5 ==========
voices += [
    v("19468ccce84c4969b21ba097e849f228", "SR · Muški Calm Pro", "m", "sr",
      "Calm professional SR male — Callcenter",
      "male,middle-aged,professional,telesales,call-center,calm,clear,confident,trustworthy,natural,serbian".split(","),
      "middle-aged", "call-center",
      VI("Ruhig professionell SR", "measured", "calm confident pro", "announcer boom"),
      "sr"),
    v("a5afb69eab3b43c89ae01a98ab56d704", "SR · Duboki Authority", "m", "sr",
      "Deep authoritative SR — Enterprise",
      "male,middle-aged,professional,telesales,deep,authoritative,calm,corporate,premium,serbian".split(","),
      "middle-aged", "enterprise",
      VI("Tief autoritär warm", "slow-measured", "deep authority", "aggressive"),
      "sr"),
    v("29372270cf0a45a6886ca7dd7accce6a", "SR · Marat Clear Pro", "m", "sr",
      "Clear crisp professional narrator (sr-capable)",
      "male,middle-aged,professional,telesales,clear,crisp,calm,measured,corporate,announcer,natural,serbian".split(","),
      "middle-aged", "corporate",
      VI("Klar und gemessen", "measured", "clear corporate", "character"),
      "sr"),
    v("02184c53a9d84d938196aeeb60eef74c", "SR · Opytnyi Warm Deep", "m", "sr",
      "Experienced deep warm male — Premium",
      "male,mature,professional,telesales,deep,warm,calm,trustworthy,premium,natural,serbian".split(","),
      "mature", "premium",
      VI("Erfahren und warm", "slow-calm", "deep warm premium", "gaming character"),
      "sr"),
    v("796131c4f1c246568d6229191f5700af", "SR · Names Calm Pro", "m", "sr",
      "Calm measured deep — names/numbers stress fit",
      "male,mature,professional,telesales,calm,measured,deep,clear,trustworthy,natural,serbian,outbound".split(","),
      "mature", "outbound",
      VI("Ruhig gemessen, Namen/Zahlen klar", "measured", "calm deep professional", "Slavic caricature, politician"),
      "sr"),
]

# ========== SR female 5 ==========
voices += [
    v("2625ff9fcb274801b86e2cbb0bf0bd69", "SR · Rimma Clear Pro", "f", "sr",
      "High-use clear professional female",
      "female,young,professional,telesales,call-center,clear,crisp,calm,friendly,corporate,natural,premium,serbian".split(","),
      "young", "call-center",
      VI("Klar und freundlich pro", "measured", "clear friendly pro", "robot"),
      "sr"),
    v("f9bf1b947e384d3ea7e3975b38955b9e", "SR · Kutina Confident", "f", "sr",
      "Confident measured professional",
      "female,middle-aged,professional,telesales,clear,calm,measured,confident,corporate,natural,serbian,outbound".split(","),
      "middle-aged", "outbound",
      VI("Sicher gemessen", "measured", "confident measured", "breathy asmr"),
      "sr"),
    v("426236a8085c477fbbc8c3b5bd906443", "SR · Molodoy Clear", "f", "sr",
      "Young clear conversational pro",
      "female,young,professional,telesales,conversational,clear,calm,friendly,confident,natural,serbian".split(","),
      "young", "conversational",
      VI("Conversational klar", "natural", "clear conversational pro", "anime"),
      "sr"),
    v("7f54d1a573154e0ea470c621ab5845c5", "SR · Rimma Soft Pro", "f", "sr",
      "Soft professional narrative service",
      "female,young,professional,customer-service,clear,calm,friendly,smooth,natural,premium,serbian,inbound".split(","),
      "young", "service",
      VI("Weich professionell", "measured", "soft professional", "dramatic"),
      "sr"),
    v("532c1a46cadb4253a5aac85ac2de1067", "SR · Smiren Calm Pro", "f", "sr",
      "Calm clear measured SR female",
      "female,middle-aged,professional,telesales,calm,clear,measured,smooth,professional,natural,serbian,call-center".split(","),
      "middle-aged", "call-center",
      VI("Ruhig klar gemessen", "measured", "calm clear pro", "character entertainment"),
      "sr"),
]

# ========== EN 5 (accent-neutral professional) ==========
voices += [
    v("c5f56a6cc2ec4fa8920cb4c5889a3fb7", "EN · Slax Neutral Pro", "m", "en",
      "Clear calm professional (high usage) — neutral",
      "male,middle-aged,professional,telesales,call-center,clear,calm,measured,corporate,natural,premium,english,neutral-accent".split(","),
      "middle-aged", "call-center",
      VI("Neutral international pro; Ana/Marko clear", "measured", "clear calm professional", "gaming, accent caricature"),
      "en"),
    v("a1cacb329332495ea3a9f4511587f946", "EN · CS Assistant Pro", "f", "en",
      "Customer service assistant professional",
      "female,middle-aged,professional,customer-service,call-center,inbound,clear,calm,friendly,corporate,natural,english".split(","),
      "middle-aged", "inbound",
      VI("Service-pro friendly", "measured", "friendly calm CS", "sales hard close"),
      "en"),
    v("4b1df6a7bdea433e805924fefdda2f8b", "EN · Outbound Call Male", "m", "en",
      "Outbound call professional male",
      "male,young,professional,telesales,outbound,clear,calm,measured,corporate,natural,english".split(","),
      "young", "outbound",
      VI("Outbound calm, no hype", "measured", "clear outbound pro", "hype, military"),
      "en"),
    v("ca1aed3abe3a4a2493d89072355a7fcf", "EN · Contact Center Female", "f", "en",
      "Professional contact center standard",
      "female,middle-aged,professional,call-center,customer-service,clear,calm,friendly,corporate,natural,english".split(","),
      "middle-aged", "call-center",
      VI("Contact-center standard", "measured", "clear calm contact-center", "command-center robotic"),
      "en"),
    v("12dd91f58f55476da14d4f7a6e0e03db", "EN · Friendly Service Pro", "f", "en",
      "Friendly service voice — soft sales + support",
      "female,middle-aged,professional,customer-service,friendly,clear,expressive,confident,professional,natural,english,telesales".split(","),
      "middle-aged", "friendly-sales",
      VI("Friendly service with soft upsell", "natural", "friendly professional CS", "animated entertainment"),
      "en"),
]

# ========== Multilingual 5 ==========
voices += [
    v("1dc098568e624b92819ef8181aae959b", "ML · Atomic BS+EN", "m", "ml",
      "Multilingual bs+en — energy dialed down for phone",
      "male,mature,multilingual,professional,telesales,clear,confident,energetic,english,bs,natural,outbound".split(","),
      "mature", "multilingual-outbound",
      VI("EN or BS clean; dial energy down for phone", "measured-to-brisk", "multilingual confident", "game announcer max",
        extra="Prefer measured phone cadence over host energy."),
      "ml"),
    v("802e868478214360a0495ff1ea9e3334", "ML · Shishkov EN+SR Pro", "m", "ml",
      "Multilingual en/sr clear announcer pro",
      "male,middle-aged,multilingual,professional,clear,calm,measured,corporate,english,sr,natural,premium".split(","),
      "middle-aged", "multilingual-corp",
      VI("Clear multilingual corporate", "measured", "clear multilingual pro", "raspy character"),
      "ml"),
    v("f281f234a1d04a929ade9f676ed7c441", "ML · Calm Deep EN Premium", "m", "ml",
      "Deep calm premium EN base for multi-agent",
      "male,middle-aged,multilingual,professional,deep,warm,calm,premium,english,natural,trustworthy".split(","),
      "middle-aged", "multilingual-premium",
      VI("Premium calm deep", "slow-calm", "deep warm premium multi", "cinematic overacting"),
      "ml"),
    v("9ebe5838ec4443449bf37d83fffaebdf", "ML · Ritta Multi Clear", "f", "ml",
      "Clear multi-lang female (sr/ru/de/bg capable)",
      "female,young,multilingual,professional,clear,crisp,calm,measured,corporate,natural,sr,premium,call-center".split(","),
      "young", "multilingual-service",
      VI("Clear multi-lang service pro", "measured", "clear multi pro", "entertainment character"),
      "ml"),
    v("dabecb5a1f4d49349268bdf4fa2e5967", "ML · Rita Soft Multi", "f", "ml",
      "Soft multi-lang professional narrative",
      "female,middle-aged,multilingual,professional,clear,calm,measured,smooth,natural,sr,customer-service,premium".split(","),
      "middle-aged", "multilingual-inbound",
      VI("Soft multi-lang inbound", "measured", "calm multi pro", "monotone robot"),
      "ml"),
]

# ========== Agent profiles (6) — instruction-optimized, not consent clones ==========
voices += [
    v("a45966a2eaad4fb8a64bc844869aabcc", "Agent · Ana Closing (f)", "f", "bs",
      "Agent-Profil: Closing-Optimierung auf Motivacioni",
      "female,middle-aged,professional,telesales,outbound,warm,confident,persuasive,agent-profile,premium,natural,closing".split(","),
      "middle-aged", "agent-closing",
      VI("Always closing-warm; name Ana; refer to Marko as he/on", "natural", "warm confident closer",
        "hard pressure, cold script", extra="Optimize for objection → soft close."),
      "agent", source="agent-profile"),
    v("ff407d8678d940a584b614153c5f1a0f", "Agent · Ana Outbound (f)", "f", "bs",
      "Agent-Profil: Standard Outbound Script",
      "female,middle-aged,professional,telesales,outbound,call-center,clear,agent-profile,corporate,natural".split(","),
      "middle-aged", "agent-outbound",
      VI("Scripted outbound with warmth; Ana", "measured", "clear outbound agent", "robot cadence"),
      "agent", source="agent-profile"),
    v("e87d1b2fc7ed40d2940e69068b0ca726", "Agent · Ana Support (f)", "f", "bs",
      "Agent-Profil: Inbound/Support first",
      "female,middle-aged,professional,customer-service,inbound,calm,agent-profile,trustworthy,natural".split(","),
      "middle-aged", "agent-inbound",
      VI("Support first, then soft upsell; Ana", "measured", "calm support agent", "hard sell"),
      "agent", source="agent-profile"),
    v("91526c9cbb5841858a34cb87ae739e89", "Agent · Marko B2B (m)", "m", "bs",
      "Agent-Profil: Marko B2B Enterprise",
      "male,middle-aged,professional,telesales,outbound,corporate,agent-profile,confident,natural,enterprise".split(","),
      "middle-aged", "agent-b2b",
      VI("Speak as Marko; refer to Ana as she/ona; B2B", "measured", "professional B2B Marko", "casual slang"),
      "agent", source="agent-profile"),
    v("5d664201f86b4182bf758f6040c409fa", "Agent · Marko Clear (m)", "m", "bs",
      "Agent-Profil: Marko klar/neutral Callcenter",
      "male,middle-aged,professional,call-center,clear,agent-profile,corporate,natural".split(","),
      "middle-aged", "agent-neutral",
      VI("Neutral Marko agent", "measured", "clear neutral Marko", "emotionless robot"),
      "agent", source="agent-profile"),
    v("c5f56a6cc2ec4fa8920cb4c5889a3fb7", "Agent · Alex EN Pro (m)", "m", "en",
      "Agent-Profil: English pro agent, neutral accent",
      "male,middle-aged,professional,telesales,call-center,english,agent-profile,clear,corporate,natural,neutral-accent".split(","),
      "middle-aged", "agent-en",
      VI("English pro agent; neutral accent; names Ana/Marko correctly", "measured", "clear EN agent", "regional slang heavy"),
      "agent", source="agent-profile"),
]

# Unique rating IDs for agent profiles (share library audio via library_voice_id)
for i, x in enumerate(voices):
    if x.get("source") == "agent-profile":
        base = x["id"]
        slug = x["title"].split("·")[-1].strip().lower().replace(" ", "-").replace("(", "").replace(")", "")
        x["id"] = f"agent-{base[:12]}-{slug[:24]}"
        x["library_voice_id"] = base
        x["base_lang"] = "en" if "EN" in x["title"] else "bs"
        voices[i] = x

# Counts
c = Counter()
for x in voices:
    g = x["group"]
    if g == "agent":
        c["agent"] += 1
    else:
        c[f"{x['lang']}-{x['sex']}"] += 1
print("counts", dict(c), "total", len(voices))

# De-dupe non-agent library ids
seen = set()
for x in voices:
    if x["group"] != "agent":
        if x["id"] in seen:
            print("DUP", x["id"], x["title"])
        seen.add(x["id"])

cfg = {
    "version": 3,
    "project": {
        "title": "Voice Compare · Tele-Sales Portfolio v3",
        "subtitle": "56 kuratierte Stimmen · BS/HR/SR/EN/ML + Agent-Profile · erweitertes Stress-Skript",
        "brand": "Fish Audio s2.x · Activi",
        "liveUrl": "https://voice-compare.activi.io/",
        "repo": "https://github.com/dsactivi-2/bosnian-sales-voice-compare",
        "sampleBatch": "2026-07-31-portfolio-v3",
    },
    "script": FULL_SCRIPT_BS,
    "script_en": FULL_SCRIPT_EN,
    "script_tts_bs": TTS_BS,
    "script_tts_en": TTS_EN,
    "scriptNote": (
        "Vollskript (Display/Bewertung): lange Sätze, Ana+Marko mit Pronomen, "
        "Datum/Uhrzeit, Ref-Nr., Prozent, KM/EUR, E-Mails, URL, Einwand, Terminwahl, Emotionen. "
        "Audio-Samples: gekürztes Stress-Skript (Free-Plan TTS ≤500 Bytes)."
    ),
    "reviewers": ["Arman", "Denis", "Osoba 3"],
    "categories": [
        {"k": "pron", "l": "Aussprache / Akzent-Fit", "s": "Aussprache"},
        {"k": "prof", "l": "Professionalität", "s": "Professionell"},
        {"k": "warm", "l": "Wärme / Sales-Fit", "s": "Wärme"},
        {"k": "clar", "l": "Verständlichkeit (Telefon)", "s": "Klarheit"},
        {"k": "emo", "l": "Emotion / Ausdruck", "s": "Emotion"},
    ],
    "voices": voices,
    "sampleBatch": "2026-07-31-portfolio-v3",
    "sampleNote": (
        "Portfolio v3: neu kuratiert für Telesales/Callcenter/Voice-Agent. "
        "Politiker/Gags/Charakterstimmen ausgeschlossen. "
        "6 Agent-Profile = Library-Basis + optimierte Voice Instructions (separate Rating-IDs). "
        "Keine echten Clones ohne Speaker-Consent."
    ),
    "portfolioMeta": {
        "targets": {
            "bs_m": 10, "bs_f": 10, "hr_m": 5, "hr_f": 5,
            "sr_m": 5, "sr_f": 5, "en": 5, "ml": 5, "agent": 6,
        },
        "exclusions": [
            "politicians", "pikachu", "character-gags", "vulgar titles",
            "asmr-intimate", "gaming announcers", "historical war figures",
        ],
        "synthetic_note": (
            "Echte Voice-Clones brauchen Consent + 10–60s Audio. "
            "Stattdessen 6 Agent-Instruction-Profile mit separaten Rating-IDs."
        ),
        "new_vs_v2": [
            "Längeres Vollskript (Einwand, Termin, Ref-Nr., EUR/KM)",
            "BS: Narativni + Alex Marco statt Autoritet/Mladi",
            "BS: Sk Warm Pro statt Laya Bright",
            "HR: Stariji Clear + Duboki Authority",
            "SR: Names Calm + Smiren Calm",
            "EN: Friendly Service Pro",
            "ML: Ritta + Rita multi females",
        ],
    },
}

out = Path("/workspace/voice-compare/config.json")
out.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", out, "voices", len(voices))
print("tts_bs bytes", len(TTS_BS.encode()), "tts_en", len(TTS_EN.encode()))
print("full_bs bytes", len(FULL_SCRIPT_BS.encode()))

# Export unique library IDs for TTS batch
lib_ids = []
for x in voices:
    if x.get("source") == "agent-profile":
        continue
    lib_ids.append({"id": x["id"], "lang": x["lang"], "title": x["title"]})
Path("/tmp/vc-portfolio-v3/tts_jobs.json").write_text(
    json.dumps(lib_ids, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("unique library voices for TTS:", len(lib_ids))
