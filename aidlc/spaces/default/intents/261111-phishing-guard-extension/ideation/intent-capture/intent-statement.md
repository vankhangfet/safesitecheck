# Intent Statement

## Problem Statement

- Protect people from phishing and scam sites while they browse, using a web extension for Edge and Chrome. [Q1] [desc]
- The extension is meant to judge whether a website is harmful, phishing, or carries a security risk, by integrating with Jev / OpenJev. [desc]
- The kinds of risk to judge are phishing pages, scam or fraud sites, malware or unwanted download sites, and other general security risk. [Q6]

## Target Customer

- Employees of an organisation that wants safer browsing. [Q2]

## Success Metrics

- Most known phishing pages are flagged, with few false alarms on real sites, measured on a sample of pages the product owner provides. [Q3]
- Exact thresholds for "most" and "few" are set later with the sample.

## Initiative Trigger

- Rising phishing incidents affecting the product owner, their users or their company. [Q4]

## Initial Scope Signal

- Workflow-selected plan: `mvp`. [scope]
- Product boundary: the first version does not automatically block pages; it warns only. [Q7]

## Assumptions & Open Questions

- Numeric targets for detection rate and false-alarm rate are not yet defined; they are to be set with the labeled sample later. [assumption]
