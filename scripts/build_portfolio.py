#!/usr/bin/env python3
"""Build curated voice portfolio config (metadata only; audio filled later)."""
import json
from pathlib import Path

FULL_SCRIPT_BS = """[friendly][confident] Dobar dan! Zovem se Ana Hadžić iz Activi Soft d.o.o. u Sarajevu.
[pause] Zovem vas u vezi vašeg zahtjeva od petnaestog marta dvije hiljade dvadeset šeste, u četrnaest sati i trideset minuta.
[pause] Moj kolega Marko Petrović će vas kontaktirati ako odaberete demo. On je dostupan svakog radnog dana.
[soft] Ona — dakle Ana — vodi onboarding, a on — Marko — vodi tehničku podršku.
[confident] Uz naš paket Enterprise Pro možete uštedjeti trideset dva zarez pet posto na mjesečnim troškovima, što je oko stotinu osamdeset KM.
[pause] Pišite nam na ana.hadzic@activi-soft.ba ili posjetite https://activi.io/demo-bosna.
[soft] Ako sada niste slobodni, recite mi kada da zovem — bez pritiska.
[confident] Hvala na vremenu. Lijep pozdrav iz Activi Soft-a!"""

FULL_SCRIPT_EN = """[friendly][confident] Hello! My name is Ana Hadzic from Activi Soft LLC in Sarajevo.
[pause] I'm calling about your request from March fifteenth, twenty twenty-six, at two thirty p.m.
[pause] My colleague Marko Petrovic will follow up if you choose a demo. He is available every business day.
[soft] She — Ana — leads onboarding, and he — Marko — leads technical support.
[confident] With our Enterprise Pro package you can save thirty-two point five percent on monthly costs, about one hundred eighty convertible marks.
[pause] Email us at ana.hadzic@activi-soft.ba or visit https://activi.io/demo-bosnia.
[soft] If now is not a good time, tell me when to call back — no pressure.
[confident] Thank you for your time. Best regards from Activi Soft!"""

# Short TTS (free plan ≤500 bytes) — stress: names, numbers, email fragment
TTS_BS = "[friendly][confident] Dobar dan! Ana iz Activi Soft. Marko i ja, 15.3. u 14:30. Ušteda 32%. ana@activi.io — imate li minut?"
TTS_EN = "[friendly][confident] Hello! Ana from Activi Soft. Marko and I, March 15 at 2:30. Save 32%. ana@activi.io — one minute?"

def VI(opening, pace, tone, avoid):
    return {
        "opening": opening,
        "pace": pace,
        "tone": tone,
        "avoid": avoid,
        "bracket_defaults": "[friendly][confident]",
        "agent_system": f"Speak as a professional tele-sales agent. {tone} Pace: {pace}. Opening style: {opening}. Never: {avoid}.",
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
        "audio": "",  # filled after TTS
    }

voices = []

# ========== BS male 10 ==========
voices += [
 v("91526c9cbb5841858a34cb87ae739e89","BS · Profesionalni Muški","m","bs","Seriöser B2B-Outbound, klar und gemessen","male,middle-aged,professional,telesales,outbound,call-center,conversational,confident,trustworthy,corporate,natural,clear,calm".split(","),"middle-aged","outbound",
  VI("Ruhiger Firmenname + Nutzen","measured","professional confident","rush, shout, comedy"),"bs"),
 v("7f141a660d4e4ee3aeaa2b562d9384bc","BS · Bosanski Autoritet","m","bs","Tiefe Autorität für anspruchsvolle B2B","male,mature,professional,telesales,outbound,authoritative,trustworthy,deep,corporate,confident".split(","),"mature","enterprise",
  VI("Autorität ohne Härte","slow-measured","deep authoritative warm","aggression, theatrics"),"bs"),
 v("020fa2f81d65408383cd6e21d6be2f2d","BS · Samouvjeren Sales","m","bs","Allround confident Sales","male,middle-aged,professional,telesales,outbound,conversational,confident,energetic,persuasive,natural".split(","),"middle-aged","outbound",
  VI("Selbstsicher + Lächeln in der Stimme","natural","confident friendly","monotone, pressure-hard-close"),"bs"),
 v("99a4e1cc695b49128a195f526152d699","BS · Mekani Muški","m","bs","Weicher Einstieg, warm","male,middle-aged,professional,telesales,inbound,customer-service,warm,soft,friendly,trustworthy,calm,conversational".split(","),"middle-aged","inbound",
  VI("Weich, einladend","relaxed","warm soft professional","loud, announcer"),"bs"),
 v("5d664201f86b4182bf758f6040c409fa","BS · NAGLIC Clear Pro","m","bs","Ruhig, klar, neutral-professionell","male,middle-aged,professional,telesales,call-center,clear,calm,measured,corporate,trustworthy,natural".split(","),"middle-aged","call-center",
  VI("Neutral-klar wie guter Agent","measured","calm clear professional","drama, character"),"bs"),
 v("512d154db0ff458aac007c8ff2f1ebfd","BS · Ramo Podcast Pro","m","bs","Podcast-seriös, vertrauenswürdig","male,mature,professional,telesales,conversational,trustworthy,corporate,serious,natural,premium".split(","),"mature","consultative",
  VI("Berater-Ton","conversational-measured","serious warm","hype, gaming"),"bs"),
 v("fe492e6fc04148cf84716186c2be52c6","BS · Narator Warm","m","bs","Ruhiger Narrator, warm erklärend","male,middle-aged,professional,customer-service,warm,calm,clear,trustworthy,expressive,natural".split(","),"middle-aged","explain",
  VI("Erklärend warm","measured","warm professional","flat, cold"),"bs"),
 v("f7058cf45a604ec59b43801ae26cb8a6","BS · Jasni Measured","m","bs","Klar und gemessen","male,middle-aged,professional,telesales,clear,measured,confident,corporate,natural".split(","),"middle-aged","outbound",
  VI("Jedes Wort klar am Telefon","measured","clear confident","mumble, rush"),"bs"),
 v("b123c928002c4d9191e49c103664d150","BS · Mladi Crisp","m","bs","Jünger, crisp, friendly","male,young,professional,telesales,outbound,energetic,friendly,clear,young,natural".split(","),"young","outbound-young",
  VI("Jung aber seriös","slightly-brisk","friendly crisp professional","teen slang, hype"),"bs"),
 v("c8c0d4318eec4e5d8f997bf098e8adeb","BS · Sale Deep Calm","m","bs","Deep calm professional (BS-SR)","male,middle-aged,professional,telesales,deep,calm,smooth,trustworthy,conversational,premium".split(","),"middle-aged","premium",
  VI("Tief, ruhig, premium","slow-calm","deep calm premium","raspy chaos, character"),"bs"),
]

# ========== BS female 10 ==========
voices += [
 v("a45966a2eaad4fb8a64bc844869aabcc","BS · Motivacioni Closing","f","bs","Warm + Closing-Fit (Team-Favorit-Kandidat)","female,middle-aged,professional,telesales,outbound,warm,confident,persuasive,friendly,premium,natural,expressive".split(","),"middle-aged","closing",
  VI("Warm zum Close führen","natural","warm confident persuasive","cold, flat"),"bs"),
 v("ff407d8678d940a584b614153c5f1a0f","BS · Savremeni Outbound","f","bs","Klassische professionelle Outbound-Stimme","female,middle-aged,professional,telesales,outbound,call-center,clear,calm,friendly,corporate,natural".split(","),"middle-aged","outbound",
  VI("Klassisch professionell","measured","clear friendly pro","breathy intimate, hype"),"bs"),
 v("e87d1b2fc7ed40d2940e69068b0ca726","BS · Jasna Erklärend","f","bs","Ruhig erklärend, vertrauensvoll","female,middle-aged,professional,customer-service,inbound,calm,measured,trustworthy,clear,conversational,natural".split(","),"middle-aged","inbound",
  VI("Ruhig erklären","measured","calm trustworthy","fast sales pitch"),"bs"),
 v("03cfb7745c4a4200b55dd7baa09e3c59","BS · Dinamična Young","f","bs","Energie, jüngere Zielgruppe","female,young,professional,telesales,outbound,energetic,friendly,clear,young,persuasive,natural".split(","),"young","outbound-young",
  VI("Lebendig aber kontrolliert","brisk","energetic friendly pro","screamy, playful chaos"),"bs"),
 v("e68e5082d6ec4124a65d2df25dbe1297","BS · Melodični Warm","f","bs","Melodisch warm expressiv","female,middle-aged,professional,telesales,warm,expressive,friendly,persuasive,natural,soft".split(","),"middle-aged","relationship",
  VI("Melodisch warm","natural","warm expressive","monotone"),"bs"),
 v("5a3bdb4c73c843c8912612aef643bcf5","BS · Laya Bright","f","bs","Hell, freundlich, conversational","female,young,professional,telesales,conversational,friendly,bright,energetic,clear,natural".split(","),"young","conversational",
  VI("Hell und einladend","natural","bright friendly","childlike, character"),"bs"),
 v("5305f70004634f8da3836d5befaba3e0","BA · Hrvatska Govornica Pro","f","bs","Ruhige Pro-Sprecherin (BCMS, BA-tauglich)","female,middle-aged,professional,telesales,call-center,calm,clear,smooth,corporate,trustworthy,natural".split(","),"middle-aged","call-center",
  VI("Ruhig professionell","measured","calm clear pro","announcer boom"),"bs"),
 v("c937a3fe42fd431f84228ce8d04fc69a","BA · Ugodan Warm Pro","f","bs","Angenehm friendly pro (BCMS)","female,middle-aged,professional,telesales,customer-service,warm,friendly,professional,natural,trustworthy".split(","),"middle-aged","service-sales",
  VI("Angenehm und sicher","natural","warm friendly pro","cold script"),"bs"),
 v("408dadcbecaa42bca59946b2f77f9704","BA · Vedra Clear Weather-Pro","f","bs","Klar, warm, professional narrative (BCMS)","female,middle-aged,professional,telesales,clear,crisp,warm,friendly,expressive,natural,premium".split(","),"middle-aged","premium-female",
  VI("Klar wie Nachrichten, warm wie Service","measured","clear warm professional","cartoon energy"),"bs"),
 v("7945a25f1df040f5897aedd0998402bc","BA · Jasna Hrvatska Pro","f","bs","Clear warm professional female","female,middle-aged,professional,telesales,clear,warm,professional,trustworthy,natural,outbound".split(","),"middle-aged","outbound",
  VI("Warm-professionell","measured","clear warm pro","flat robot"),"bs"),
]

# ========== HR male 5 ==========
voices += [
 v("af29d14bf4114c258e335370877ef67b","HR · Mirni Muški","m","hr","Calm conversational professional","male,middle-aged,professional,telesales,call-center,calm,clear,conversational,trustworthy,natural".split(","),"middle-aged","call-center",
  VI("Ruhig und klar","measured","calm professional","angry edge"),"hr"),
 v("aabfa168f35645af9aaa3cdaa442a66c","HR · Deep Conversational","m","hr","Conversational deep male","male,middle-aged,professional,telesales,conversational,confident,warm,deep,natural,premium".split(","),"middle-aged","consultative",
  VI("Conversational deep","natural","confident warm","shout"),"hr"),
 v("dd130c5d167648e2b583d64e30cfa63e","HR · Mirni Authority","m","hr","Deep calm authority","male,middle-aged,professional,telesales,deep,authoritative,calm,corporate,trustworthy".split(","),"middle-aged","enterprise",
  VI("Ruhige Autorität","slow-measured","deep calm authority","drama"),"hr"),
 v("82036e17ed4e4538b454c09d694c7286","HR · Direktni Sales","m","hr","Direct confident sales","male,middle-aged,professional,telesales,outbound,confident,energetic,persuasive,clear,natural".split(","),"middle-aged","outbound",
  VI("Direkt aber höflich","brisk","direct confident","aggressive close"),"hr"),
 v("f8b790089b4d44e9981321bb8864e999","HR · Narator Neutral","m","hr","Neutral professional narrator","male,middle-aged,professional,customer-service,calm,clear,professional,corporate,natural".split(","),"middle-aged","narration-service",
  VI("Neutral professionell","measured","neutral pro","character voice"),"hr"),
]

# ========== HR female 5 ==========
voices += [
 v("5c78ae5c74a24f87a9f232073641ab08","HR · Topli Gentle","f","hr","Warm gentle female","female,middle-aged,professional,customer-service,inbound,warm,calm,friendly,soft,trustworthy,natural".split(","),"middle-aged","inbound",
  VI("Sanft und warm","relaxed","warm gentle","loud pitch"),"hr"),
 v("d30566a322d04a838ca3426219b46c13","HR · Topli Soft Pro","f","hr","Warm soft professional","female,middle-aged,professional,customer-service,warm,soft,friendly,clear,natural,premium".split(","),"middle-aged","relationship",
  VI("Weich professionell","natural","warm soft pro","sexy intimate"),"hr"),
 v("f9ce273371064cff93081d046afebb86","HR · Mirna Empathic","f","hr","Calm empathetic storyteller pro","female,mature,professional,customer-service,inbound,calm,warm,empathetic,trustworthy,gentle,natural".split(","),"mature","empathy",
  VI("Empathisch ruhig","slow-measured","empathetic calm","rushed"),"hr"),
 v("da1f9cb818c0459aacfd36ad137053ef","HR · Snažan Confident","f","hr","Strong confident female","female,middle-aged,professional,telesales,outbound,confident,professional,dynamic,persuasive,natural".split(","),"middle-aged","outbound",
  VI("Stark und sicher","natural-brisk","confident strong pro","harsh"),"hr"),
 v("d418491e5ad14320aaf35ddf4168a4f0","HR · Srdačan Friendly","f","hr","Cordial friendly female","female,middle-aged,professional,telesales,customer-service,friendly,warm,relaxed,natural,outbound".split(","),"middle-aged","friendly-sales",
  VI("Herzlich freundlich","natural","cordial friendly","cold"),"hr"),
]

# ========== SR male 5 ==========
voices += [
 v("19468ccce84c4969b21ba097e849f228","SR · Muški Calm Pro","m","sr","Calm professional SR male","male,middle-aged,professional,telesales,call-center,calm,clear,confident,trustworthy,natural".split(","),"middle-aged","call-center",
  VI("Ruhig professionell SR","measured","calm confident pro","announcer boom"),"sr"),
 v("a5afb69eab3b43c89ae01a98ab56d704","SR · Duboki Authority","m","sr","Deep authoritative SR","male,middle-aged,professional,telesales,deep,authoritative,calm,corporate,premium".split(","),"middle-aged","enterprise",
  VI("Tief autoritär warm","slow-measured","deep authority","aggressive"),"sr"),
 v("2493553fbdbf4906b5154511a5db66de","SR · Snažan Ad Energy","m","sr","Strong ad/announcer energy (kontrolliert nutzen)","male,middle-aged,professional,telesales,outbound,energetic,confident,clear,persuasive,natural".split(","),"middle-aged","outbound-energy",
  VI("Energie dosieren","brisk","energetic confident","shouting ad"),"sr"),
 v("29372270cf0a45a6886ca7dd7accce6a","SR · Marat Clear Pro","m","sr","Clear crisp professional narrator (sr-capable)","male,middle-aged,professional,telesales,clear,crisp,calm,measured,corporate,announcer,natural".split(","),"middle-aged","corporate",
  VI("Klar und gemessen","measured","clear corporate","character"),"sr"),
 v("02184c53a9d84d938196aeeb60eef74c","SR · Opytnyi Warm Deep","m","sr","Experienced deep warm male","male,mature,professional,telesales,deep,warm,calm,trustworthy,premium,natural".split(","),"mature","premium",
  VI("Erfahren und warm","slow-calm","deep warm premium","gaming character"),"sr"),
]

# ========== SR female 5 ==========
voices += [
 v("eacb654f61d340edbc5716c7569375d7","SR · Mladi Calm","f","sr","Young calm SR female","female,young,professional,customer-service,calm,friendly,clear,natural,inbound".split(","),"young","inbound",
  VI("Jung ruhig freundlich","natural","calm friendly young","childish"),"sr"),
 v("2625ff9fcb274801b86e2cbb0bf0bd69","SR · Rimma Clear Pro","f","sr","High-use clear professional female","female,young,professional,telesales,call-center,clear,crisp,calm,friendly,corporate,natural,premium".split(","),"young","call-center",
  VI("Klar und freundlich pro","measured","clear friendly pro","robot"),"sr"),
 v("f9bf1b947e384d3ea7e3975b38955b9e","SR · Kutina Confident","f","sr","Confident measured professional","female,middle-aged,professional,telesales,clear,calm,measured,confident,corporate,natural".split(","),"middle-aged","outbound",
  VI("Sicher gemessen","measured","confident measured","breathy asmr"),"sr"),
 v("426236a8085c477fbbc8c3b5bd906443","SR · Molodoy Clear","f","sr","Young clear conversational pro","female,young,professional,telesales,conversational,clear,calm,friendly,confident,natural".split(","),"young","conversational",
  VI("Conversational klar","natural","clear conversational pro","anime"),"sr"),
 v("7f54d1a573154e0ea470c621ab5845c5","SR · Rimma M1 Soft Pro","f","sr","Soft professional narrative","female,young,professional,customer-service,clear,calm,friendly,smooth,natural,premium".split(","),"young","service",
  VI("Weich professionell","measured","soft professional","dramatic"),"sr"),
]

# ========== EN 5 (accent-neutral professional / call center) ==========
voices += [
 v("c5f56a6cc2ec4fa8920cb4c5889a3fb7","EN · Slax Neutral Pro","m","en","Clear calm professional (high usage)","male,middle-aged,professional,telesales,call-center,clear,calm,measured,corporate,natural,premium,english".split(","),"middle-aged","call-center",
  VI("Neutral American/International pro","measured","clear calm professional","gaming, accent caricature"),"en"),
 v("a1cacb329332495ea3a9f4511587f946","EN · CS Assistant Pro","f","en","Customer service assistant professional","female,middle-aged,professional,customer-service,call-center,inbound,clear,calm,friendly,corporate,natural,english".split(","),"middle-aged","inbound",
  VI("Service-pro friendly","measured","friendly calm CS","sales hard close"),"en"),
 v("54cc428cee614c0c8c208659b0cbd66a","EN · CS Assistant Clear","f","en","Clear CS conversational","female,middle-aged,professional,customer-service,clear,professional,calm,friendly,natural,english,inbound".split(","),"middle-aged","inbound",
  VI("Clear service","measured","clear friendly CS","breathy"),"en"),
 v("4b1df6a7bdea433e805924fefdda2f8b","EN · Outbound Call Male","m","en","Outbound call professional male","male,young,professional,telesales,outbound,clear,calm,measured,corporate,natural,english".split(","),"young","outbound",
  VI("Outbound calm","measured","clear outbound pro","hype"),"en"),
 v("ca1aed3abe3a4a2493d89072355a7fcf","EN · Contact Center Female","f","en","Professional contact center","female,middle-aged,professional,call-center,customer-service,clear,calm,friendly,corporate,natural,english".split(","),"middle-aged","call-center",
  VI("Contact-center standard","measured","clear calm contact-center","command center robotic"),"en"),
]

# ========== Multilingual 5 ==========
voices += [
 v("1dc098568e624b92819ef8181aae959b","ML · Atomic BS+EN","m","ml","Multilingual bs+en energetic pro (kontrolliert)","male,mature,multilingual,professional,telesales,clear,confident,energetic,english,bs,natural".split(","),"mature","multilingual-outbound",
  VI("EN or BS clean; dial energy down for phone","measured-to-brisk","multilingual confident","game announcer max"),"ml"),
 v("802e868478214360a0495ff1ea9e3334","ML · Shishkov EN+SR Pro","m","ml","Multilingual en/sr clear announcer pro","male,middle-aged,multilingual,professional,clear,calm,measured,corporate,english,sr,natural,premium".split(","),"middle-aged","multilingual-corp",
  VI("Clear multilingual corporate","measured","clear multilingual pro","raspy character"),"ml"),
 v("426236a8085c477fbbc8c3b5bd906443","ML · Young Female Multi","f","ml","Young female multi incl. en/sr","female,young,multilingual,professional,clear,calm,friendly,english,sr,natural,conversational".split(","),"young","multilingual-service",
  VI("Friendly multilingual service","natural","clear friendly multi","duplicate-if-same-as-sr-slot ok-profile"),"ml"),
 v("e87d1b2fc7ed40d2940e69068b0ca726","ML · Jasna BS+ES Pro","f","ml","BS+ES calm professional female","female,middle-aged,multilingual,professional,calm,clear,friendly,bs,natural,premium,customer-service".split(","),"middle-aged","multilingual-inbound",
  VI("Calm multilingual","measured","calm multi pro","overlap ok-profile dual-use"),"ml"),
 v("f281f234a1d04a929ade9f676ed7c441","ML · Calm Deep EN Premium","m","ml","Deep calm premium EN (multi-agent base)","male,middle-aged,multilingual,professional,deep,warm,calm,premium,english,natural,trustworthy".split(","),"middle-aged","multilingual-premium",
  VI("Premium calm deep","slow-calm","deep warm premium multi","cinematic overacting"),"ml"),
]

# Fix ML Young Female - don't duplicate same id as SR. Use different multi voice
for i,x in enumerate(voices):
    if x["title"]=="ML · Young Female Multi":
        voices[i]=v("3cca488e215e4756a0f935f91590cf49","ML · Energetic Multi Female","f","ml","Multi-lang energetic female (use controlled)","female,young,multilingual,professional,energetic,clear,warm,english,sr,natural,expressive".split(","),"young","multilingual-energy",
          VI("Multi energy dialed for phone","natural","warm multi energy","playful chaos"),"ml")
        break
# Fix ML Jasna duplicate id with BS Jasna - use different for multi
for i,x in enumerate(voices):
    if x["title"]=="ML · Jasna BS+ES Pro":
        voices[i]=v("d728748620d44fc9bab75346732a589f","ML · Cypher Deep EN+HR","m","ml","Deep measured multi en+hr","male,middle-aged,multilingual,professional,deep,clear,measured,english,hr,premium,authoritative".split(","),"middle-aged","multilingual-authority",
          VI("Deep measured multi","measured","deep multi pro","dark character drama"),"ml")
        break

# ========== Agent profiles (6) - library-backed optimized instructions, not new clones ==========
voices += [
 v("a45966a2eaad4fb8a64bc844869aabcc","Agent · Ana Closing (f)","f","bs","Agent-Profil: Closing-Optimierung auf Motivacioni","female,middle-aged,professional,telesales,outbound,warm,confident,persuasive,agent-profile,premium,natural".split(","),"middle-aged","agent-closing",
  VI("Always closing-warm; name Ana; refer to Marko as he","natural","warm confident closer","duplicate library base intentionally"),"agent",source="agent-profile"),
 v("ff407d8678d940a584b614153c5f1a0f","Agent · Ana Outbound (f)","f","bs","Agent-Profil: Standard Outbound","female,middle-aged,professional,telesales,outbound,call-center,clear,agent-profile,corporate,natural".split(","),"middle-aged","agent-outbound",
  VI("Scripted outbound with warmth; Ana","measured","clear outbound agent","robot cadence"),"agent",source="agent-profile"),
 v("e87d1b2fc7ed40d2940e69068b0ca726","Agent · Ana Support (f)","f","bs","Agent-Profil: Inbound/Support","female,middle-aged,professional,customer-service,inbound,calm,agent-profile,trustworthy,natural".split(","),"middle-aged","agent-inbound",
  VI("Support first, then soft upsell; Ana","measured","calm support agent","hard sell"),"agent",source="agent-profile"),
 v("91526c9cbb5841858a34cb87ae739e89","Agent · Marko B2B (m)","m","bs","Agent-Profil: Marko B2B","male,middle-aged,professional,telesales,outbound,corporate,agent-profile,confident,natural".split(","),"middle-aged","agent-b2b",
  VI("Speak as Marko; refer to Ana as she; B2B","measured","professional B2B Marko","casual slang"),"agent",source="agent-profile"),
 v("5d664201f86b4182bf758f6040c409fa","Agent · Marko Clear (m)","m","bs","Agent-Profil: Marko klar/neutral","male,middle-aged,professional,call-center,clear,agent-profile,corporate,natural".split(","),"middle-aged","agent-neutral",
  VI("Neutral Marko agent","measured","clear neutral Marko","emotionless"),"agent",source="agent-profile"),
 v("c5f56a6cc2ec4fa8920cb4c5889a3fb7","Agent · Alex EN Pro (m)","m","en","Agent-Profil: English pro agent","male,middle-aged,professional,telesales,call-center,english,agent-profile,clear,corporate,natural".split(","),"middle-aged","agent-en",
  VI("English pro agent; neutral accent; names Ana/Marko correctly","measured","clear EN agent","regional slang heavy"),"agent",source="agent-profile"),
]

# uniqueness for non-agent: allow agent to share ids with different title keys - UI uses id as key for ratings!
# PROBLEM: ratings PK is voice_id - agent profiles sharing library id would collide ratings.
# Fix: use synthetic ids for agent profiles: agent-{baseId}-{slug}
for i,x in enumerate(voices):
    if x.get("source")=="agent-profile":
        base=x["id"]
        slug=x["title"].split("·")[-1].strip().lower().replace(" ","-").replace("(","").replace(")","")
        x["id"]=f"agent-{base[:12]}-{slug[:24]}"
        x["library_voice_id"]=base
        voices[i]=x

# verify counts
from collections import Counter
c=Counter()
for x in voices:
    g=x["group"]
    if g=="agent": c["agent"]+=1
    else: c[f"{x['lang']}-{x['sex']}"]+=1
print("counts", dict(c), "total", len(voices))

# de-dupe non-agent ids
ids=[]
for x in voices:
    if x["group"]!="agent":
        if x["id"] in ids:
            print("DUP", x["id"], x["title"])
        ids.append(x["id"])

cfg={
  "version": 2,
  "project": {
    "title": "Voice Compare · Tele-Sales Portfolio",
    "subtitle": "56 kuratierte Stimmen · BS/HR/SR/EN/ML + Agent-Profile · Stress-Test-Skript",
    "brand": "Fish Audio s2.x · Activi",
    "liveUrl": "https://voice-compare.activi.io/",
    "repo": "https://github.com/dsactivi-2/bosnian-sales-voice-compare",
    "sampleBatch": "2026-07-31-portfolio-v2",
  },
  "script": FULL_SCRIPT_BS,
  "script_en": FULL_SCRIPT_EN,
  "script_tts_bs": TTS_BS,
  "script_tts_en": TTS_EN,
  "scriptNote": "Vollskript für Bewertung/Display. Audio-Samples: gekürztes Stress-Skript (Free-Plan TTS-Limit). Enthält Ana/Marko, Zahlen, Datum, Uhrzeit, E-Mail, URL, Firmennamen, Emotionen, Einwand.",
  "reviewers": ["Arman", "Denis", "Osoba 3"],
  "categories": [
    {"k":"pron","l":"Aussprache / Akzent-Fit","s":"Aussprache"},
    {"k":"prof","l":"Professionalität","s":"Professionell"},
    {"k":"warm","l":"Wärme / Sales-Fit","s":"Wärme"},
    {"k":"clar","l":"Verständlichkeit (Telefon)","s":"Klarheit"},
    {"k":"emo","l":"Emotion / Ausdruck","s":"Emotion"},
  ],
  "voices": voices,
  "sampleBatch": "2026-07-31-portfolio-v2",
  "sampleNote": "Portfolio v2: library-curated telesales voices + agent instruction profiles. TTS stress sample under free-plan byte limit.",
  "portfolioMeta": {
    "targets": {"bs_m":10,"bs_f":10,"hr_m":5,"hr_f":5,"sr_m":5,"sr_f":5,"en":5,"ml":5,"agent":6},
    "exclusions": ["politicians","pikachu","character-gags","vulgar titles","asmr-intimate","gaming announcers maxed"],
    "synthetic_note": "Keine echten neuen Clones ohne Consent. 6 Agent-Profile = Library-IDs + optimierte Voice Instructions (separate Rating-IDs).",
  },
}

out=Path("/workspace/voice-compare/config.json")
out.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", out, "voices", len(voices))
print("tts_bs bytes", len(TTS_BS.encode()), "tts_en", len(TTS_EN.encode()))
