# Storporate — How it works (user view)

This is a single, printable diagram that walks through what a **Student**,
a **Club**, and a **Company** actually experience on Storporate.

Three parallel swimlanes, one shared backbone in the middle.

```mermaid
flowchart TB
    %% ============== ENTRY ==============
    Home(["<b>storporate.bd</b><br/>Landing page<br/>What is this? Who is it for?")]
    Home --> SignUp

    %% ============== AUTH ==============
    SignUp["Create an account<br/>(email + password or Google)"]
    Home --> SignIn["Sign in"]
    SignUp --> CheckEmail["Check your inbox<br/>click the link"]
    CheckEmail --> PickRole
    SignIn --> PickRole

    %% ============== ONBOARDING ==============
    PickRole{"<b>Step 1 — Who are you?</b><br/>Choose your account type"}
    PickRole -->|"I'm a student"| SOnboard["<b>Student onboarding</b><br/>Name, university, study program,<br/>graduation year, location, bio,<br/>skills, career interests"]
    PickRole -->|"I run a club"| COnboard["<b>Club onboarding</b><br/>Club name, university, mission,<br/>categories, event focus,<br/>sponsorship needs, contact email"]
    PickRole -->|"I hire / sponsor"| CorpOnboard["<b>Company onboarding</b><br/>Company name, industry, location,<br/>description, talent needs,<br/>sponsorship interests, CSR focus,<br/>budget range, contact email"]

    SOnboard --> Sdash["/dashboard — Student"]
    COnboard --> Cdash["/dashboard — Club"]
    CorpOnboard --> CorpDash["/dashboard — Company"]

    %% ============== STUDENT LANE ==============
    subgraph Student["🎓 STUDENT"]
        direction TB
        Sdash --> SProfile["Edit your profile<br/>Add skills, achievements,<br/>work experiences, activities"]
        Sdash --> SFeed["<b>/newsfeed</b><br/>See ranked events,<br/>journal posts, and<br/>company news that match<br/>your skills and interests"]
        SFeed --> SViewEvent["Open an event<br/>Read details, see who's<br/>hosting it"]
        SViewEvent --> SRegister["Click <b>Register</b><br/>(optional: write<br/>a short motivation note)"]
        SRegister --> SConfirm["✓ You're registered<br/>Confirmation email sent"]

        Sdash --> SBrowse["Browse companies<br/>& clubs from the<br/>matches dashboard"]
        SBrowse --> SVisitCorp["Open a company profile<br/>(contact email hidden<br/>until you reach out)"]
        SVisitCorp --> SInvite1["Click <b>Send invitation</b><br/>Subject + message"]
        SInvite1 --> SOutbox["Invitation sent by email<br/>Company can now see<br/>your contact email"]
    end

    %% ============== CLUB LANE ==============
    subgraph Club["🏛️ CLUB"]
        direction TB
        Cdash --> CPost["<b>Post things</b><br/>• New event (fest, workshop)<br/>• Journal entry<br/>• News update"]
        CPost --> CRanked["Storporate ranks your post<br/>against student skills &<br/>interests — it shows up<br/>in the right newsfeeds"]
        CRanked --> CManage["Manage your event<br/>• Edit details<br/>• Close registration<br/>• See registrant list"]
        CManage --> CSponsor["<b>Find sponsors</b><br/>See companies ranked by<br/>fit with your event focus"]
        CSponsor --> CVisitCorp["Open a company profile"]
        CVisitCorp --> CPitch["Click <b>Request sponsorship</b><br/>Subject + pitch message"]
        CPitch --> CPitchOut["Pitch email sent<br/>Company can reply directly"]
    end

    %% ============== COMPANY LANE ==============
    subgraph Company["🏢 COMPANY"]
        direction TB
        CorpDash --> CorpPost["<b>Post things</b><br/>• New job opening<br/>• News update<br/>• Event (campus visit, AMA)"]
        CorpPost --> CorpEmbed["AI reads the post and<br/>matches it to relevant<br/>students and clubs"]
        CorpEmbed --> CorpRank["<b>Ranked candidate list</b><br/>Students appear in order<br/>of fit with your job"]
        CorpRank --> CorpUni["Click a university<br/>See ALL students from<br/>that school, ranked"]
        CorpUni --> CorpPick["Pick a student<br/>Open their profile"]
        CorpPick --> CorpInvite["Click <b>Send invitation</b><br/>Subject + message"]
        CorpInvite --> CorpOutbox["Email sent<br/>Student can now see<br/>your contact email"]
    end

    %% ============== SHARED ==============
    subgraph Shared["📬 EVERYONE"]
        direction TB
        AnyUser["Any signed-in user"]
        AnyUser --> Search["Search / browse / visit<br/>any profile on the platform<br/>(students, clubs, companies)"]
        Search --> ProfileView["Public profile page<br/>• About<br/>• Recent activity<br/>• Contact email<br/>(revealed only after a<br/>message is exchanged)"]

        AnyUser --> Inbox["<b>/inbox</b><br/>Your sent invitations<br/>and pitches, with status"]
    end

    %% ============== PRIVACY GUARD ==============
    SVisitCorp -. "<i>contact email<br/>is hidden</i>" .-> ProfileView
    SInvite1 -. "<i>after this,<br/>email is shared</i>" .-> SOutbox

    %% ============== RANKING ENGINE ==============
    subgraph Brain["🧠 THE MATCHING BRAIN (invisible to users)"]
        direction LR
        When["Whenever anyone<br/>posts or updates<br/>a profile"]
        Read["Reads the text<br/>(title, body, tags,<br/>skills, interests)"]
        Vector["Converts it to a<br/>768-number fingerprint<br/>using Google's<br/>gemini-embedding-001"]
        Compare["Compares fingerprints<br/>across all profiles"]
        Rank["Ranks every reader<br/>by relevance"]
    end

    SPost["Student skills, interests,<br/>achievements, activities"] -. fills .-> Brain
    CPost -. fills .-> Brain
    CorpPost -. fills .-> Brain

    When --> Read --> Vector --> Compare --> Rank
    Rank -. "<i>powers</i>" .-> SFeed
    Rank -. "<i>powers</i>" .-> CRanked
    Rank -. "<i>powers</i>" .-> CorpRank
    Rank -. "<i>powers</i>" .-> CSponsor

    %% ============== SIGN OUT ==============
    Sdash --> SignOut["<b>Sign out</b><br/>(button in the top-right<br/>of every dashboard page)"]
    Cdash --> SignOut
    CorpDash --> SignOut
    SignOut --> Home

    %% ============== STYLES ==============
    classDef entry fill:#fef3c7,stroke:#b45309,color:#111
    classDef auth fill:#dbeafe,stroke:#1d4ed8,color:#111
    classDef student fill:#dcfce7,stroke:#15803d,color:#111
    classDef club fill:#fce7f3,stroke:#be185d,color:#111
    classDef company fill:#e0e7ff,stroke:#4338ca,color:#111
    classDef shared fill:#f3f4f6,stroke:#374151,color:#111
    classDef brain fill:#fff7ed,stroke:#c2410c,color:#111
    classDef decision fill:#fef9c3,stroke:#a16207,color:#111

    class Home,SignOut entry
    class SignUp,SignIn,CheckEmail auth
    class Sdash,SProfile,SFeed,SViewEvent,SRegister,SConfirm,SBrowse,SVisitCorp,SInvite1,SOutbox,SOnboard student
    class Cdash,CPost,CManage,CSponsor,CVisitCorp,CPitch,CPitchOut,COnboard club
    class CorpDash,CorpPost,CorpEmbed,CorpRank,CorpUni,CorpPick,CorpInvite,CorpOutbox,CorpOnboard company
    class AnyUser,Search,ProfileView,Inbox shared
    class When,Read,Vector,Compare,Rank,SPost brain
    class PickRole decision
```

## How to read this (for a non-technical audience)

The diagram has **five parts**:

1. **Top center (yellow)** — *Entry*. Anyone arrives at the landing page
   and creates an account.
2. **Three colored swimlanes** — what each type of user does:
   - 🟢 **Green = Student**
   - 🩷 **Pink = Club**
   - 🟦 **Indigo = Company**
3. **Gray box on the right** — *Shared*. Anything any signed-in user can
   do (visit profiles, check their inbox).
4. **Orange box at the bottom** — *The matching brain*. The AI that
   ranks posts against the right readers. Users never see this — they
   just see better-ranked results.
5. **Dashed lines** — the privacy guard. Contact emails stay hidden
   until two parties have exchanged a message.

## The one-sentence story

> *"Students, clubs, and companies each create an account, complete a
> short profile, and then post things — events, jobs, news, journals.
> Storporate's matching brain ranks every post against every reader's
> skills and interests, so the right people see the right things. When
> someone wants to reach out, they send an invitation or sponsorship
> pitch by email; after that, contact details are unlocked."*

## Printing tips

- Render this on a printer-friendly Markdown viewer (VS Code with the
  *Markdown Preview Mermaid Support* extension, GitHub, Obsidian, or
  any mermaid.live export) and print to A3 landscape for the cleanest
  result.
- The diagram is ~30 nodes wide; A3 landscape (or US Tabloid landscape)
  gives the boxes enough room to breathe.
- For a poster, drop the markdown into [mermaid.live](https://mermaid.live)
  → *Actions → Export as PNG/SVG* at 2× or 3× scale.