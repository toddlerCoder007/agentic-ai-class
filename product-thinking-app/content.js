/* Problem Quest: all lesson text, quests and map layout.
   Content is drawn from Lessons 1 to 3 of the Product Thinking course (IDG framing). */
(function (root) {
  "use strict";

  /* url: the claude.ai artifact (checked against build/published.json by build.py).
     page: the same lesson as a sibling page, used when the game runs from the course site
     (GitHub Pages or a local server), where this file is loaded with <script src>. The
     single-file artifact build inlines this script, so it keeps the artifact links. */
  var LESSONS = [
    { n: 1, title: "Solutions in disguise", url: "https://claude.ai/artifact/SLMDRewweQV5ttsDJBdD9Z", page: "../lessons/0001-solutions-in-disguise.html" },
    { n: 2, title: "Start with the whys", url: "https://claude.ai/artifact/Bfv9dpHAEv9vc1Z45yzMaY", page: "../lessons/0002-start-with-the-whys.html" },
    { n: 3, title: "The 4Cs problem statement", url: "https://claude.ai/artifact/K1rJFoduprPSPUKh5Erakc", page: "../lessons/0003-four-cs-problem-statement.html" }
  ];
  var CHEATSHEET = "https://claude.ai/artifact/Ge3LvtWpUUEvc4tXtdiXhR";
  var CHEATSHEET_PAGE = "../reference/product-thinking-cheatsheet.html";
  var onSite = typeof document !== "undefined" && !!(document.currentScript && document.currentScript.src);
  if (onSite) {
    LESSONS.forEach(function (L) { L.url = L.page; });
    CHEATSHEET = CHEATSHEET_PAGE;
  }

  var PS = ["Problem stated", "Solution named"];
  var FIX = ["Fix this level", "Look elsewhere"];
  var CS = ["Clarity", "Consequence", "Cause", "Confirmation"];

  var QUESTS = {
    /* ---------------- Lesson 1 ---------------- */
    q1a: {
      title: "The three questions", speaker: "Elder Oak", recall: "standalone",
      intro: [
        "Most requests reach this village dressed up as a solution: “we need a chatbot”, “we need a superapp”.",
        "A real problem statement answers three questions. Who are our users? What are they trying to do? What’s getting in their way?",
        "A solution in disguise skips all three and names a thing instead. Let me test you."
      ],
      items: [
        { prompt: "Which of these is not one of the three questions?",
          options: ["Who are our users?", "What are they trying to do?", "What should we build?", "What’s getting in their way?"], answer: 2,
          why: "“What should we build?” comes later. The three questions are about people, their goal, and the obstacle." },
        { prompt: "What problem could sit underneath this request?", text: "We need a superapp.",
          options: ["Other agencies already have one.", "Citizens can’t get to services efficiently across many platforms.", "Our app store rating is low."], answer: 1,
          why: "This names who (citizens), what they want (to reach services) and what blocks them (too many platforms). A superapp is only one possible fix." },
        { prompt: "What problem could sit underneath this request?", text: "We don’t have a CRM.",
          options: ["Clunky processes cause long waits for citizens.", "The vendor demo looked good.", "Our budget must be spent this year."], answer: 0,
          why: "A CRM is a thing to buy. The problem is what people suffer: long waits caused by clunky processes." },
        { prompt: "What gives away a solution in disguise?",
          options: ["It is a long sentence.", "It includes numbers.", "It names a thing to build or buy before saying who is struggling and why."], answer: 2,
          why: "A handy check: delete the people from the sentence. If it still reads fine, it is a solution in disguise." }
      ],
      outro: ["Good. Keep those three questions in your pocket. The other villagers have requests for you to sort."]
    },
    q1b: {
      title: "Problem or solution? (part 1)", speaker: "Messenger Pip", labels: PS, recall: "standalone",
      prompt: "A colleague says this. Problem stated, or solution named?",
      intro: ["I carry messages all day and I can’t tell which ones are real problems. Help me sort this bag."],
      items: [
        { text: "We need a chatbot for the hotline.", answer: 1,
          why: "It names a thing to build. Who is calling, what are they trying to do, and what goes wrong? None of that is here." },
        { text: "Residents renewing a permit wait three weeks, because every application is checked by hand twice.", answer: 0,
          why: "It names who (residents renewing a permit), the goal (a renewal), and what gets in the way (three weeks of double manual checks)." },
        { text: "Front-desk officers re-type the same applicant details into four systems, so each walk-in takes 25 minutes.", answer: 0,
          why: "It mentions systems, but only to describe the obstacle. It doesn’t prescribe a fix. Users, goal and blocker are all there." },
        { text: "Let’s move the case management system to the cloud.", answer: 1,
          why: "This is a migration. It might be the right call, but it doesn’t say whose problem it solves." }
      ],
      outro: ["Sorted! I’ll deliver the real problems first."]
    },
    q1c: {
      title: "Problem or solution? (part 2)", speaker: "Clerk Bea", labels: PS, recall: "standalone",
      prompt: "A colleague says this. Problem stated, or solution named?",
      intro: ["My in-tray is trickier than Pip’s bag. Some of these mention users and still hide a solution."],
      items: [
        { text: "We should build a mobile app so citizens can pay their fines.", answer: 1,
          why: "A tricky one. It mentions users, but the app is already decided. What stops citizens paying fines today?" },
        { text: "Small business owners give up on the grant application at the eligibility step, because they can’t tell whether they qualify.", answer: 0,
          why: "A specific group, a clear goal, and a precise point where they get stuck. You could fix this many different ways." },
        { text: "Our dashboard needs AI-generated insights.", answer: 1,
          why: "This is the “we need more AI” trap. Insights for whom, to make what decision?" },
        { text: "Duty officers miss urgent cases because new and follow-up emails look identical in the shared inbox.", answer: 0,
          why: "It names who (duty officers), what they need (to spot urgent cases), and what gets in the way (emails that look the same)." }
      ],
      outro: ["My tray is clear. The Bot Request at the edge of the village won’t be so easy."]
    },
    boss1: {
      boss: "bot", title: "Boss: The Bot Request", speaker: "The Bot Request",
      recall: "The request: “We need a WhatsApp bot so residents can book clinic appointments.” The phone line is staffed 9 to 5, and most callers are working adults.",
      intro: [
        "BZZT. Your director says: “We need a WhatsApp bot so residents can book clinic appointments.”",
        "You asked around. The clinic phone line is only staffed 9 to 5. Most callers are working adults, and they can’t get through during office hours.",
        "Turn the request back into a problem. Answer the three questions, and don’t name anything to build."
      ],
      items: [
        { prompt: "1 · Who are the users?",
          options: ["WhatsApp users", "Working-age residents who need a clinic appointment", "Everyone in the country", "The clinic’s IT team"], answer: 1,
          why: "A specific group, described by their situation and not by the tool they might use.",
          whyWrong: ["That defines people by the solution. They are residents first; WhatsApp is just one channel.", null,
            "Too broad. A good problem is narrow: one defined group.", "They might build the fix, but they aren’t the ones struggling to book."] },
        { prompt: "2 · What are they trying to do?",
          options: ["Chat with a bot", "Download a booking app", "Phone the clinic", "Book a slot that fits around their working hours"], answer: 3,
          why: "That is the goal in the residents’ own terms. It doesn’t mention any tool.",
          whyWrong: ["Nobody’s goal is to chat with a bot. That is using a solution.", "An app is a thing to build, not what residents want.",
            "Phoning is how they try today. The goal is the appointment.", null] },
        { prompt: "3 · What’s getting in their way?",
          options: ["Booking is by phone only, and the line is staffed 9 to 5, when they are at work", "There is no WhatsApp bot", "The clinic lacks AI", "Residents don’t try hard enough"], answer: 0,
          why: "A concrete obstacle you could observe, with no fix baked in.",
          whyWrong: [null, "A missing solution is not an obstacle. What actually stops them today?",
            "“We need more AI” is the classic trap, not an obstacle.", "The facts say otherwise: they call, and can’t get through during office hours."] },
        { prompt: "Which fixes does your problem statement leave open?",
          options: ["Only a WhatsApp bot", "None. It is just words.", "A bot, longer phone hours, online booking, or evening walk-in slots"], answer: 2,
          why: "A WhatsApp bot is one fix among several. The problem statement keeps the options open; the original request ruled them out." }
      ],
      outro: ["BZZT… request… reframed. Who: working-age residents. Trying to: book around work. In the way: a phone line open only while they work."]
    },

    /* ---------------- Lesson 2 ---------------- */
    q2a: {
      title: "Peel the layers", speaker: "Ranger Wy", recall: "standalone",
      intro: [
        "The first problem you hear is usually a symptom. Ask “why?”, then ask “why?” about the answer. Each answer peels back a layer.",
        "IDG’s example. Applicants can’t get the grants they applied for. Why? Processing takes too long. Why? Officers go back and forth with applicants. Why? Many applications arrive incomplete.",
        "Why? The form is full of internal jargon. Why? It was designed around how the agency works, not how applicants think."
      ],
      items: [
        { recall: false, prompt: "Suppose you stopped at the second line: “processing is slow”. Which fix would you reach for?",
          options: ["Redesign the form", "A new processing system", "Translate the jargon"], answer: 1,
          why: "Stopping early invites a new processing system: expensive, slow to build, and incomplete forms would still arrive." },
        { recall: false, prompt: "Follow the chain to the bottom. What is the fix?",
          options: ["Hire more officers", "Buy a faster processing system", "Redesign the form around how applicants think"], answer: 2,
          why: "The fifth why points to something much cheaper that fixes the real problem: the form, not the processing system." },
        { prompt: "IDG warns that problems rarely have one root cause. So what are you looking for?",
          options: ["A cause you can control that is closely connected to the outcome you want", "The single deepest cause, whoever owns it", "The cause that is quickest to explain"], answer: 0,
          why: "Aim for a cause close to the root that you can act on within your timeline and resources." },
        { prompt: "Which two kinds of cause does IDG say to avoid fixing?",
          options: ["Old causes and new causes", "Symptoms, and causes outside your sphere of influence", "Causes found by junior staff"], answer: 1,
          why: "Fix a symptom and the root cause is still there. Chase a cause you can’t influence and nothing changes." }
      ],
      outro: ["You dig well. Healer Sana up on the ledge has a case about choosing the right level."]
    },
    q2b: {
      title: "Fix this level?", speaker: "Healer Sana", labels: FIX,
      recall: "Your team can change your own agency’s forms, letters, rules and processes. The symptom: seniors often miss their subsidised health screening appointments.",
      prompt: "Should your team fix at this level?",
      intro: [
        "You’re on an agency’s digital services team. In six months you can change your agency’s forms, letters, rules and processes. You can’t change laws, or how other agencies run.",
        "The symptom: seniors often miss their subsidised health screening appointments. Here are causes we found. Should your team fix at each level?"
      ],
      items: [
        { text: "Reminder letters go to old addresses, because the mailing list is updated only once a year.", answer: 0,
          why: "This is close to the root, and your team owns the mailing process. A good level to fix." },
        { text: "35% of screening appointments end in a no-show.", answer: 1,
          why: "This is the symptom itself. Fixing it directly (for example by overbooking slots) leaves the causes in place." },
        { text: "Seniors in general are less comfortable with digital services than younger people.", answer: 1,
          why: "It may be true, but it’s broad and outside your influence. Ask why again to find something specific that your team can change." },
        { text: "The appointment confirmation is only in English, but many seniors read Chinese, Malay or Tamil first.", answer: 0,
          why: "Your team controls the letters, and this links directly to seniors missing the date. A good level to fix." },
        { text: "The appointment time is assigned without asking, so it often clashes with seniors’ other commitments.", answer: 0,
          why: "This is a process your agency runs, and it’s directly linked to no-shows. A good level to fix." },
        { text: "Bus routes to some screening centres are slow and need a transfer.", answer: 1,
          why: "A real cause, but transport is another agency’s responsibility. Pass the finding on, and focus your own fix on something you control." }
      ],
      outro: ["Right level, right team. The level you fix at depends on who you are."]
    },
    boss2: {
      boss: "chain", mode: "order", title: "Boss: The Tangled Chain", speaker: "The Tangled Chain",
      intro: [
        "CLANK. Residents complain that refunds of overpaid fees reach them late. Your team gathered five findings, and I have tangled them.",
        "Rebuild the chain from the symptom at the top to the root cause at the bottom. Each time, pick the finding that answers “why?” for the line above."
      ],
      prompt: "Why? Pick the finding that directly explains the line above.",
      top: "Symptom: residents say refunds are late",
      chain: [
        "Refunds take six weeks to reach residents.",
        "Each refund waits in a queue for manual approval by the finance team.",
        "The fraud filter sends four in ten refunds to manual review.",
        "The filter treats any recent change of address as a fraud signal.",
        "The rule was copied from an older tax system in 2019 and never reviewed for refunds."
      ],
      start: [2, 4, 0, 3, 1],
      wrongNote: "Not the next link. That finding sits deeper or shallower. Ask: what directly causes the line above?",
      explain: "Stopping at line two would suggest hiring more finance staff to clear the queue. The bottom line points to a cheaper fix: review one fraud rule.",
      outro: ["CLANK… untangled. One old rule, five links up, was the whole story."]
    },

    /* ---------------- Lesson 3 ---------------- */
    q3a: {
      title: "The four Cs", speaker: "Scribe Clara", recall: "standalone",
      intro: [
        "Once you have a root cause, write the problem down so the whole team agrees on it. IDG’s 4Cs: four dimensions, one statement, no solutions yet.",
        "Clarity: who is affected, what are they trying to do, what is broken, and how badly? Consequence: what happens if nobody solves this?",
        "Cause: why does the problem exist? Confirmation: what evidence shows it is real, significant and worth prioritising?"
      ],
      items: [
        { prompt: "Which C comes straight from your Five Whys?", options: CS, answer: 2,
          why: "Cause is where your Five Whys chain ends up: the deepest cause close to the root and within your influence." },
        { prompt: "Which C can tell you a problem isn’t worth solving?", options: CS, answer: 1,
          why: "Consequence. If the honest answer to “what happens if nobody solves this?” is “not much”, it may not deserve the team’s time." },
        { prompt: "Clarity is the three questions from Disguise Village plus one more. Which one?",
          options: ["How will we fix it?", "Who will pay?", "How badly is it broken?"], answer: 2,
          why: "Who, trying to do what, what is broken, and how badly. No fixes yet." },
        { prompt: "Which C is this line from IDG’s worked example?", text: "68% of transactions are abandoned because of form-filling frustration: 204,000 out of 300,000 a year.", options: CS, answer: 3,
          why: "Hard figures are evidence. They confirm the problem is real and significant." }
      ],
      outro: ["Well read. The stallholders upstairs have notes from a real project for you to sort."]
    },
    q3b: {
      title: "Which C is this? (part 1)", speaker: "Stallholder Mina", labels: CS, recall: "standalone",
      prompt: "Which C does this sentence belong to?",
      intro: ["A team is studying food licence renewals for hawkers and café owners like me. Their notes are all mixed up. Label each one."],
      items: [
        { text: "Café and hawker owners renewing their food licence must visit an office in person, and the visit takes half a day.", answer: 0,
          why: "It names who is affected, what they’re trying to do, and how bad it is (half a day lost)." },
        { text: "Renewal still requires a wet-ink signature, because the process was written before e-signatures were legally accepted.", answer: 2,
          why: "The word “because” is the clue. This explains why the problem exists." },
        { text: "Lapsed licences lead to more enforcement visits, which pull inspectors away from food-safety checks.", answer: 1,
          why: "This is the knock-on cost of leaving the problem unsolved." },
        { text: "Last year, 2,300 of 9,000 renewals were late, and the counter logged an average wait of 70 minutes.", answer: 3,
          why: "Hard figures that show the problem is real and significant." }
      ],
      outro: ["That’s my morning back. Thank you!"]
    },
    q3c: {
      title: "Which C is this? (part 2)", speaker: "Inspector Rao", labels: CS, recall: "standalone",
      prompt: "Which C does this sentence belong to?",
      intro: ["I have the rest of the renewal notes. Watch for clue words."],
      items: [
        { text: "Owners want to keep trading legally while spending as little time away from their stall as possible.", answer: 0,
          why: "This is what the users are trying to do, which is part of Clarity." },
        { text: "Counter officers re-check documents already submitted online, because the two record systems don’t share data.", answer: 2,
          why: "A root reason. It mentions systems, but it describes why the problem happens and doesn’t prescribe a fix." },
        { text: "In 40 interviews, 31 owners said losing a morning of business is the main reason they renew late.", answer: 3,
          why: "User research counts as evidence. It confirms the problem with real people." },
        { text: "If nothing changes, owners keep losing a morning’s takings each year, and some let licences lapse and risk fines.", answer: 1,
          why: "“If nothing changes” is the clue. This describes what is at stake." }
      ],
      outro: ["All filed. The Blank Statement waits at the top of the citadel. Bring the clinic facts."]
    },
    boss3: {
      boss: "scroll", title: "Boss: The Blank Statement", speaker: "The Blank Statement",
      recall: "A team is writing a 4Cs statement about clinic appointments that can only be booked by phone.",
      labels: ["Clarity", "Consequence", "Cause", "Confirmation", "Leave it out"],
      prompt: "Where does this line go in the 4Cs statement?",
      intro: [
        "RUSTLE. Back to the clinic. Your director wanted a WhatsApp booking bot, and you reframed it as a problem. Now your team has facts.",
        "Fill me in. Place each line under the right C. Careful: not every line belongs in a problem statement."
      ],
      items: [
        { text: "Working-age residents who need a clinic appointment can only book by phone, between 9am and 5pm on weekdays, which are their working hours.", answer: 0,
          why: "Who is affected, what they are trying to do, and what is broken. That is Clarity." },
        { text: "People put off care, and some end up in emergency departments with conditions a clinic could treat.", answer: 1,
          why: "This is what happens if the problem isn’t solved." },
        { text: "Booking was set up when the phone was the only channel, and the line’s hours follow clinic opening hours, not the times when callers are free.", answer: 2,
          why: "This is where the Five Whys ended: the reason the problem exists." },
        { text: "Call logs show 4,100 of 11,000 monthly calls are abandoned after a wait of more than 10 minutes.", answer: 3,
          why: "“Call logs show” is the clue. This is evidence the problem is real and significant." },
        { text: "They want a slot that fits around their working day.", answer: 0,
          why: "What the users are trying to do is part of Clarity." },
        { text: "A WhatsApp bot would let residents book at any time of day.", answer: 4,
          why: "IDG’s final check: does the statement describe the problem, or sneak in a solution? This line is a solution, so it stays out." },
        { text: "In a follow-up survey, 30% of callers who gave up didn’t book anywhere within two weeks.", answer: 3,
          why: "Survey results are evidence. They confirm the consequence with real people." }
      ],
      outro: ["RUSTLE… I am blank no longer. Clarity, Consequence, Cause, Confirmation, and not one solution in sight."]
    },

    /* ---------------- Bonus: Skywatch Outpost (all three lessons, drone scenarios) ----------------
       Invented public-sector scenarios with invented figures, in the style of the lands above.
       Real drone news lives on the outpost's news board, never in quiz answers. */
    q4a: {
      title: "Drone requests", speaker: "Signaller Kit", labels: PS, recall: "standalone",
      prompt: "A request about drones lands on your desk. Problem stated, or solution named?",
      intro: [
        "Drones are in the news every day, so the requests pile up here: “we need a counter-drone laser”, “we need a drone fleet”.",
        "Same rule as Disguise Village. Who is struggling, what are they trying to do, and what is in their way? Sort my inbox."
      ],
      items: [
        { text: "We need a counter-drone laser at the airport.", answer: 1,
          why: "It names a device. Who is struggling at the airport, trying to do what, and what actually goes wrong?" },
        { text: "Air traffic controllers stop all departures for about 40 minutes after each drone report, because they have no way to check whether the sighting is real.", answer: 0,
          why: "It names who (controllers), what they need (to keep flights moving safely) and what blocks them (no way to check a report)." },
        { text: "Let’s buy a fleet of drones for park patrols.", answer: 1,
          why: "A purchase decided before anyone said what goes wrong in the parks today, or for whom." },
        { text: "Farmers who want to spray crops by drone wait eight weeks for a permit, because a two-person team reviews every application by hand.", answer: 0,
          why: "A specific group, a clear goal and a precise blocker. Many fixes could follow." },
        { text: "Residents near the hospital helipad report drones overhead, but the online form asks for a registration number they can’t see from the ground.", answer: 0,
          why: "It mentions a form, but only to describe the obstacle. Users, goal and blocker are all there." },
        { text: "We need an AI system that spots drones on our CCTV.", answer: 1,
          why: "The “we need more AI” trap again. Spots drones for whom, so they can decide what?" }
      ],
      outro: ["Inbox sorted. Controller Ines on the tower has the airport case, and it goes deeper."]
    },
    q4b: {
      title: "Grounded by a sighting", speaker: "Controller Ines", labels: FIX,
      recall: "Your team runs the airport’s own operations: its procedures, staff training, reporting forms and how it works with the police. The symptom: departures are halted several times a month after drone reports.",
      prompt: "Should your team fix at this level?",
      intro: [
        "You’re on the operations team of a regional airport. You can change the airport’s procedures, staff training, reporting forms, and how the airport shares information with the police.",
        "You can’t change national drone law, police powers, or how drones are made. The symptom: departures are halted several times a month after someone reports a drone. Should your team fix at each level?"
      ],
      items: [
        { text: "Every report triggers a full halt, because the procedure has a single response level, from “might have been a bird” to “confirmed drone”.", answer: 0,
          why: "Close to the root, and the airport owns its procedure. A good level to fix." },
        { text: "Departures are halted about five times a month.", answer: 1,
          why: "That is the symptom itself. Ask why it happens before choosing a fix." },
        { text: "National rules allow hobby drones to fly five kilometres from the runway.", answer: 1,
          why: "A real factor, but law is outside your influence. Pass the evidence to the regulator, and fix what you own." },
        { text: "Staff who take sighting calls have no checklist of what to ask, so vague reports can’t be ruled out.", answer: 0,
          why: "Training and checklists are yours to change, and this links straight to halts for reports that turn out to be nothing." },
        { text: "Some drone makers don’t build in no-fly-zone limits.", answer: 1,
          why: "Outside your sphere of influence. Changing products is for regulators and manufacturers, not an airport team." },
        { text: "The airport and the police log sightings separately, so sharing one takes about 20 minutes.", answer: 0,
          why: "How the airport shares information with the police is in your remit, and those 20 minutes add to every halt." }
      ],
      outro: ["Right level, right team. Now the Hovering Request wants a statement, and it still wants its laser."]
    },
    boss4: {
      boss: "drone", title: "Boss: The Hovering Request", speaker: "The Hovering Request",
      recall: "A team is writing a 4Cs statement about drone reports that halt departures at a regional airport.",
      labels: ["Clarity", "Consequence", "Cause", "Confirmation", "Leave it out"],
      prompt: "Where does this line go in the 4Cs statement?",
      intro: [
        "WHIRR. Your director says: “We need a counter-drone laser.” You turned that into a problem and dug for the cause. Now the team has facts.",
        "Place each line under the right C. Careful: I will try to sneak my laser in."
      ],
      items: [
        { text: "Passengers and airlines at the regional airport lose about 40 minutes per halt, and halts happen several times a month after drone reports.", answer: 0,
          why: "Who is affected, what is broken and how badly. That is Clarity." },
        { text: "Controllers want to keep traffic moving safely while ruling real threats in or out quickly.", answer: 0,
          why: "What the users are trying to do is part of Clarity." },
        { text: "If nothing changes, delays spill onto connecting flights and late arrivals, and airlines may move routes to other airports.", answer: 1,
          why: "“If nothing changes” is the clue. This is what is at stake." },
        { text: "The procedure has one response level for every report, and call takers have no checklist to tell a confirmed drone from a vague one.", answer: 2,
          why: "This is where your Five Whys ended: the reason the problem exists, and one your team can act on." },
        { text: "Operations logs show 61 halts last year, and 48 of them were never confirmed as a drone.", answer: 3,
          why: "“Logs show” is the clue. Hard figures confirm the problem is real and significant." },
        { text: "A counter-drone laser would let the airport bring drones down.", answer: 4,
          why: "A solution sneaking in. The statement describes the problem and leaves the fixes open." },
        { text: "In 12 interviews, controllers said they halt every time because they can’t judge how reliable a report is.", answer: 3,
          why: "User research is evidence. It confirms the problem with the people who live it." }
      ],
      outro: ["WHIRR… landing. Clarity, Consequence, Cause, Confirmation, and no laser in sight."]
    }
  };

  var MAPS = {
    hub: {
      name: "Crossroads Camp", theme: "meadow", width: 680, quests: [],
      platforms: [{ x: 165, y: 96, w: 50 }],
      ents: [
        { type: "npc", id: "guide", name: "Guide Juno", x: 110, look: "guide" },
        { type: "portal", x: 260, to: "m1", label: "Disguise Village" },
        { type: "portal", x: 380, to: "m2", label: "Whywood Forest", needs: "boss1" },
        { type: "portal", x: 500, to: "m3", label: "Four-C Citadel", needs: "boss2" },
        { type: "portal", x: 620, to: "m4", label: "Skywatch Outpost", needs: "boss3" }
      ]
    },
    m1: {
      name: "Disguise Village", theme: "village", width: 820, lesson: 0, quests: ["q1a", "q1b", "q1c"], bossQuest: "boss1",
      platforms: [{ x: 300, y: 94, w: 64 }, { x: 470, y: 94, w: 64 }],
      ents: [
        { type: "portal", x: 40, to: "hub", label: "Crossroads Camp" },
        { type: "sign", x: 100, lesson: 0 },
        { type: "npc", name: "Elder Oak", x: 190, quest: "q1a", look: "elder" },
        { type: "npc", name: "Messenger Pip", x: 332, y: 94, quest: "q1b", look: "pip" },
        { type: "npc", name: "Clerk Bea", x: 580, quest: "q1c", look: "bea" },
        { type: "boss", x: 710, quest: "boss1" },
        { type: "portal", x: 785, to: "hub", label: "Crossroads Camp", needs: "boss1", hideLocked: true }
      ]
    },
    m2: {
      name: "Whywood Forest", theme: "forest", width: 820, lesson: 1, quests: ["q2a", "q2b"], bossQuest: "boss2",
      platforms: [{ x: 250, y: 96, w: 60 }, { x: 340, y: 66, w: 70 }, { x: 500, y: 96, w: 56 }],
      ents: [
        { type: "portal", x: 40, to: "hub", label: "Crossroads Camp" },
        { type: "sign", x: 100, lesson: 1 },
        { type: "npc", name: "Ranger Wy", x: 180, quest: "q2a", look: "ranger" },
        { type: "npc", name: "Healer Sana", x: 376, y: 66, quest: "q2b", look: "healer" },
        { type: "boss", x: 700, quest: "boss2" },
        { type: "portal", x: 785, to: "hub", label: "Crossroads Camp", needs: "boss2", hideLocked: true }
      ]
    },
    m3: {
      name: "Four-C Citadel", theme: "citadel", width: 860, lesson: 2, quests: ["q3a", "q3b", "q3c"], bossQuest: "boss3",
      platforms: [{ x: 260, y: 94, w: 70 }, { x: 520, y: 94, w: 70 }],
      ents: [
        { type: "portal", x: 40, to: "hub", label: "Crossroads Camp" },
        { type: "sign", x: 100, lesson: 2 },
        { type: "npc", name: "Scribe Clara", x: 180, quest: "q3a", look: "scribe" },
        { type: "npc", name: "Stallholder Mina", x: 296, y: 94, quest: "q3b", look: "mina" },
        { type: "npc", name: "Inspector Rao", x: 556, y: 94, quest: "q3c", look: "rao" },
        { type: "boss", x: 750, quest: "boss3" },
        { type: "portal", x: 825, to: "hub", label: "Crossroads Camp", needs: "boss3", hideLocked: true }
      ]
    },
    /* Bonus land: practises all three lessons, so it has no lesson signpost. */
    m4: {
      name: "Skywatch Outpost", theme: "sky", width: 860, bonus: true, quests: ["q4a", "q4b"], bossQuest: "boss4",
      platforms: [{ x: 300, y: 94, w: 64 }, { x: 430, y: 66, w: 70 }],
      ents: [
        { type: "portal", x: 40, to: "hub", label: "Crossroads Camp" },
        { type: "board", x: 110 },
        { type: "npc", name: "Signaller Kit", x: 210, quest: "q4a", look: "kit" },
        { type: "npc", name: "Controller Ines", x: 466, y: 66, quest: "q4b", look: "ines" },
        { type: "boss", x: 740, quest: "boss4" },
        { type: "portal", x: 825, to: "hub", label: "Crossroads Camp", needs: "boss4", hideLocked: true }
      ]
    }
  };

  /* The outpost's news board: live drone headlines, fetched by game.js from sources that
     allow browser requests (checked 2026-11-19). It degrades to a message where the page
     can't reach them, such as inside the published artifact. */
  var NEWS = {
    sources: [
      { name: "NYT World", kind: "rss", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
      { name: "UK Ministry of Defence", kind: "rss", url: "https://www.gov.uk/government/organisations/ministry-of-defence.atom" },
      { name: "Wikipedia Current Events", kind: "wikipedia", url: "https://en.wikipedia.org/w/api.php?action=parse&page=Portal:Current_events&prop=text&format=json&formatversion=2&origin=*" }
    ],
    pattern: "\\b(drones?|uavs?|uas|unmanned (aerial|aircraft|surface|underwater)|quadcopters?|fpv|loitering munitions?|shaheds?|counter-drone|anti-drone)\\b",
    max: 6,
    practice: "Pick one headline and ask: if your agency had to respond, what request would arrive dressed as a solution, and what problem might sit underneath it?"
  };

  var LEVELS = [
    { at: 0, title: "Request Taker" },
    { at: 60, title: "Question Asker" },
    { at: 140, title: "Disguise Spotter" },
    { at: 230, title: "Why Digger" },
    { at: 340, title: "Root Finder" },
    { at: 460, title: "Statement Smith" },
    { at: 600, title: "Team Aligner" },
    { at: 740, title: "Problem Thinker" }
  ];

  /* The companion. Stages unlock from quests, never from the clock. */
  var PET = {
    name: "Whyling",
    stages: [
      { name: "Egg" },
      { name: "Hatchling", needs: "any" },
      { name: "Sprout", needs: "boss1" },
      { name: "Fledgling", needs: "boss2" },
      { name: "Wise Whyling", needs: "boss3" }
    ],
    lines: {
      egg: "A warm, speckled egg. Something inside keeps tapping a rhythm that sounds like “why? why? why?”. Finish your first quest and it may hatch.",
      happy: "Your Whyling is full and bouncing. It will cheer you on with an extra heart in your next quest.",
      ok: "Your Whyling is content, but it could use a berry or a round of quick recall.",
      sulky: "Your Whyling is hungry and sulking. It still follows you, just slowly. A berry would fix that."
    }
  };

  var CONTENT = { lessons: LESSONS, cheatsheet: CHEATSHEET, quests: QUESTS, maps: MAPS, levels: LEVELS, pet: PET, news: NEWS };
  Object.keys(QUESTS).forEach(function (id) { QUESTS[id].id = id; });

  if (typeof module !== "undefined" && module.exports) module.exports = CONTENT;
  else root.PQ_CONTENT = CONTENT;
})(typeof window !== "undefined" ? window : this);
