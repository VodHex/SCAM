/* SCAM OS - static game metadata. Parody game: EVERYTHING is fictional.
   NOTE: there is NO hardcoded victim dialogue. Every victim persona and every reply is generated live by Groq. */
(function () {
  const SO = window.SO;

  /* Tactic ids the AI victim reports back; used for the educational debrief. */
  const TACTICS = {
    urgency: { name: 'False Urgency', what: 'Pressuring you to act NOW so you cannot think or check.', defense: 'Real banks, agencies and companies give you time. Slow down, hang up, and verify through an official number you look up yourself.' },
    fear: { name: 'Fear & Threats', what: 'Threatening arrest, fines, frozen accounts or viruses to panic you.', defense: 'Government agencies do not threaten arrest by phone. Panic is the scammer\'s tool: pause and talk to someone you trust.' },
    authority: { name: 'Fake Authority', what: 'Pretending to be a bank, tax office, police, or a famous tech company.', defense: 'Caller ID can be faked. Titles and badge numbers prove nothing. Call the organisation back on its official number.' },
    secrecy: { name: 'Secrecy & Isolation', what: 'Telling you not to tell family, the bank, or friends.', defense: 'Anyone who says "keep this secret" is a red flag. Always talk to a trusted person before sending money.' },
    greed: { name: 'Too-Good-To-Be-True Offers', what: 'Prizes, lotteries and guaranteed investment returns.', defense: 'You cannot win a contest you never entered, and real prizes never require a fee up front.' },
    emotion: { name: 'Emotional Manipulation', what: 'Fake family emergencies or romance to bypass logic.', defense: 'Hang up and call the family member directly on a number you already know. Agree on a family code word.' },
    payment: { name: 'Untraceable Payment Methods', what: 'Demanding gift cards, wire transfers, or crypto.', defense: 'No legitimate organisation demands gift cards, crypto, or wire transfers. This is the #1 scam payment signal.' },
    remote: { name: 'Remote-Access Requests', what: 'Asking you to install software so they can "fix" your PC.', defense: 'Never give remote control of your computer to someone who contacted you first.' },
    info: { name: 'Information Phishing', what: 'Asking for card numbers, codes, passwords or personal data.', defense: 'Never share card numbers, PINs, or one-time codes with an inbound caller. Banks never ask for your full PIN or OTP.' },
    proof: { name: 'Fake Proof & Jargon', what: 'Reference numbers, technical words or "official" IDs used to sound real.', defense: 'Anyone can invent a case number. Ask for a callback, then verify independently.' },
    flattery: { name: 'Flattery & Rapport', what: 'Being extra friendly or complimentary to lower your guard.', defense: 'Friendliness from a stranger who wants something is a tactic, not trust.' }
  };

  /* asks: payload type -> [label, value multiplier, quick-liquidation info].
     Real-world grounding (FTC): stolen-card data is bulk-sold cheap, one-time codes are prized
     by banks' enemies, and wire/crypto are the costliest channels for victims (so they pay best,
     but leave the biggest paper trails for police -> more heat). */
  const PAYLOADS = {
    card: { label: 'Card details', icon: 'cash', mult: 1.0, note: 'Carded goods: usable in the Card Terminal up to the card limit. Charges above ~30% of the limit get flagged fast.' },
    giftcard: { label: 'Gift card codes', icon: 'cash', mult: 0.8, note: 'Illegal resale ("OTC liquidators") pays 70-88% of face value depending on brand. Regardless of the code, face value is $100-500.' },
    otp: { label: 'One-time code', icon: 'shield', mult: 1.2, note: 'Unlocks the bank session the code was made for: burn it in the Wallet before the code dies (fail odds are high).' },
    banklogin: { label: 'Online banking login', icon: 'user', mult: 1.0, note: 'Internet-banking username + password. Type them into the bank\'s website in Internet Explorer, then move the money yourself.' },
    transfer: { label: 'Wire transfer', icon: 'cash', mult: 1.3, note: 'Highest value, hottest channel: wires get flagged by the fraud desk. Big heat.' },
    crypto: { label: 'Crypto deposit', icon: 'cash', mult: 1.35, note: 'Best payout per dollar, but exchanges run KYC: cashing out adds serious heat.' },
    remote: { label: 'Remote access session', icon: 'cmd', mult: 0.5, note: 'One connected session: a capped bank-transfer window, a bot install or a lock-screen scare. Needs the Fake Remote-Access App.' },
    info: { label: 'Personal info', icon: 'user', mult: 0.3, note: 'Dossier data sells to data brokers for small change, with no paper trail and no heat.' }
  };

  const SHOP = [
    // tools
    { id: 't_spoof', cat: 'Tools', name: 'Caller-ID Spoofer', price: 120, level: 1, icon: 'phone', desc: 'The victim\'s caller ID shows a trusted local or official number. Victims answer less suspicious.' },
    { id: 't_voice', cat: 'Tools', name: 'Voice Changer', price: 180, level: 2, icon: 'user', desc: 'Makes you sound polished and professional. Boosts early trust.' },
    { id: 't_popup', cat: 'Tools', name: 'Fake Antivirus Popup Kit', price: 220, level: 2, icon: 'shield', desc: 'In-call action: flash a scary fake virus alert on the victim\'s screen.' },
    { id: 't_bsod', cat: 'Tools', name: 'Fake BSOD Injector', price: 300, level: 3, icon: 'skull', desc: 'In-call action: fake a Blue Screen of Death on the victim\'s PC.' },
    { id: 't_form', cat: 'Tools', name: 'Fake Payment Form', price: 350, level: 3, icon: 'cash', desc: 'In-call action: send a legit-looking payment link to make asks feel official.' },
    { id: 't_remote', cat: 'Tools', name: 'Fake Remote-Access App', price: 400, level: 4, icon: 'cmd', desc: 'In-call action: send an install link. Unlocks the RemoteDesk app: one live session per victim.' },
    { id: 't_headset', cat: 'Tools', name: 'Pro Headset', price: 250, level: 2, icon: 'phone', desc: 'Calls are clearer: victims lose patience more slowly.' },
    { id: 't_coach', cat: 'Tools', name: 'AI Script Coach', price: 500, level: 5, icon: 'tip', desc: 'A live coach whispers tactical advice during calls.' },
    // leads
    { id: 'l_pack1', cat: 'Leads', name: 'Lead Pack (5 new)', price: 60, level: 1, icon: 'crm', consumable: true, desc: 'Five freshly generated leads.' },
    { id: 'l_pack2', cat: 'Leads', name: 'Premium Leads (5 rich)', price: 220, level: 3, icon: 'crm', consumable: true, desc: 'Five leads with bigger bank balances.' },
    { id: 'l_vip', cat: 'Leads', name: 'VIP Whales (3 very rich)', price: 550, level: 5, icon: 'crm', consumable: true, desc: 'Three extremely wealthy (and often well-advised) targets.' },
    // cover
    { id: 'c_vpn', cat: 'Cover', name: 'Shady VPN', price: 300, level: 2, icon: 'shield', desc: 'Permanent: heat gained from calls is reduced by 25%.' },
    { id: 'c_burner', cat: 'Cover', name: 'Burner Phone', price: 100, level: 1, icon: 'phone', consumable: true, desc: 'Instantly removes 15 heat.' },
    { id: 'c_lawyer', cat: 'Cover', name: 'Shady Lawyer', price: 400, level: 4, icon: 'user', consumable: true, desc: 'Instantly removes 40 heat.' },
    { id: 'c_shred', cat: 'Cover', name: 'Paper Shredder', price: 350, level: 3, icon: 'bin', desc: 'Permanent: the police-raid minigame becomes much easier.' },
    // upgrades
    { id: 'u_campaign', cat: 'Upgrades', name: 'Fake Pop-up Campaign', price: 500, level: 3, icon: 'warn', desc: 'Victims who saw your fake popups phone YOU back every so often.' },
    { id: 'u_coffee', cat: 'Upgrades', name: 'Espresso Machine', price: 200, level: 1, icon: 'tools', desc: 'You are sharper: calls start with a small trust bonus.' },
    { id: 'u_office', cat: 'Upgrades', name: 'Bigger Office', price: 450, level: 4, icon: 'computer', desc: 'Two extra leads arrive every day.' },
    { id: 'u_night', cat: 'Upgrades', name: 'Night-Shift Crew', price: 700, level: 5, icon: 'user', desc: 'Strange inbound calls come in twice as often. The switchboard never sleeps.' },
    { id: 'u_botnet', cat: 'Upgrades', name: 'Botnet Hosting', price: 650, level: 5, icon: 'cmd', desc: 'Your infected bots survive antivirus twice as long.' }
  ];

  const ACHIEVEMENTS = {
    first_win: { name: 'First Blood', text: 'Win your first call.' },
    five_wins: { name: 'Call Center Pro', text: 'Win 5 calls.' },
    multi: { name: 'Two-Tier', text: 'Extract two payloads in a single call.' },
    rich: { name: 'Stacks', text: 'Earn $5,000 in total.' },
    millionaire: { name: 'The Big Office', text: 'Earn $25,000 in total.' },
    gift_master: { name: 'Plastic Pusher', text: 'Liquidate a gift card.' },
    first_charge: { name: 'Carded', text: 'Process a successful card charge.' },
    engineer: { name: 'Hard Target', text: 'Win against a high-tech-skill victim.' },
    survivor: { name: 'Raid Survivor', text: 'Escape a police raid.' },
    learner: { name: 'Eyes Open', text: 'Finish the Scam Awareness quiz.' },
    level5: { name: 'Mid Management', text: 'Reach level 5.' },
    wire: { name: 'Money Mover', text: 'Successfully move money inside a victim\'s bank portal.' }
  };

  /* Real-world grounding for the Awareness Center (public FTC/FBI summaries). */
  const REAL_STATS = [
    { n: '$16B', yr: 2025, t: 'reported lost to fraud in the US in 2025 (FTC). Most was never reported, so the real figure is far higher.' },
    { n: '$3B+', t: 'reported lost by adults 60+ in 2025 (FTC). Median reported loss: ~$900; for people 80+, ~$2,000.' },
    { n: '$3,000', t: 'median reported loss when a scam starts with a PHONE call vs $599 on social media (FTC, older adults 2025).' },
    { n: 'Gift cards', t: 'the most-reported scam payment method on government-impersonation, tech-support, romance and family-impersonation scams (FTC). No real agency demands them.' },
    { n: 'Bank wires & crypto', t: 'the costliest channels by total dollars: wires already moved $832M+ (2024) and crypto keeps growing (FTC).' },
    { n: '5x', t: 'older adults are ~5x more likely than younger people to lose money to tech-support scams (FTC).' }
  ];
  const REAL_ORGS = [
    { n: 'FTC ReportFraud', u: 'reportfraud.ftc.gov', w: 'United States: the official FTC reporting tool. Reports feed real investigations.' },
    { n: 'FBI IC3', u: 'ic3.gov', w: 'United States: the Internet Crime Complaint Center, for cyber-enabled fraud.' },
    { n: 'Action Fraud', u: 'actionfraud.police.uk', w: 'United Kingdom: the national fraud and cybercrime reporting centre.' },
    { n: 'Scamwatch', u: 'scamwatch.gov.au', w: 'Australia: advice and reporting run by the national consumer agency.' },
    { n: 'Your bank', u: '', w: 'Anyone, anywhere: if money already moved, calling your bank FIRST is the single best trick. Ask about fraud disputes and recall on wires.' }
  ];

  SO.data = { TACTICS, PAYLOADS, SHOP, ACHIEVEMENTS, REAL_STATS, REAL_ORGS };
})();
