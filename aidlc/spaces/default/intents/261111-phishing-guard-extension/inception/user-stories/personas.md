# Personas

Built from `requirements.md` and the confirmed story plan (three personas, plan Q1).

## P1. Mia, everyday employee

- Role: employee of an organisation that wants safer browsing; opens many web pages a day in Edge or Chrome. [intent-statement]
- Goals: know quickly whether a page looks safe; avoid phishing and scam sites; keep working without interruptions on normal sites.
- Pain points: cannot easily tell a fake site from a real one; does not want warnings on legitimate sites.
- Tech comfort: low to medium. Needs plain words, not security jargon.
- Frequency: constantly, in the background while browsing.

## P2. Sam, person who sets up the extension

- Role: the person who installs the extension and gives it access to Jev or OpenJev (an employee or a helper). [requirements FR5]
- Goals: connect the extension to hosted Jev or hosted OpenJev once, and find out quickly if the connection fails.
- Pain points: unclear errors; fear of exposing a key.
- Tech comfort: medium.
- Frequency: at first use and when something stops working.

## P3. Alex, product owner who measures detection quality

- Role: the product owner and decision-maker for this project. [stakeholder-map]
- Goals: show that most known phishing pages are flagged with few false alarms. [NFR1]
- Pain points: no clear way to measure quality against public lists today.
- Tech comfort: high.
- Frequency: at each release.

## Priority Ranking

1. Mia (primary): most stories serve her.
2. Sam: needed before Mia can get any verdicts.
3. Alex: supports the success target.

## Relationships

- Sam enables Mia: until Sam has saved a working connection, Mia sees "Could not check".
- Alex checks the work for Mia: the measurement shows whether Mia's verdicts are trustworthy.

## Assumptions & Open Questions

- Mia and Sam may be the same person in practice, since each employee enters their own key. [assumption]
- Alex and the builder are the same person (a solo builder). [assumption]
