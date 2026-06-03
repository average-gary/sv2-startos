---
title: "StartOS network model — Tor is opt-in, clearnet is friction-heavy, LAN is free"
type: docs
source: "https://docs.start9.com/start-os/{interfaces,tor,clearnet,lan,remote-access}.html"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "official-docs"
tags: [startos, tor, clearnet, lan, mdns, cgnat, port-forwarding, start-tunnel, networking]
summary: "Falsifies the strong-form 'StartOS auto-issues an onion for every TCP port' assumption. Onions are opt-in (install Tor service, click Add Onion Service per interface). Clearnet needs domain + DNS + port-forward + cert. LAN mDNS is the only zero-config path."
---

# StartOS network model: actual user friction per address class

Source: docs.start9.com/start-os/ — pages `interfaces.html`, `tor.html`, `clearnet.html`, `lan.html`, `remote-access.html` (StartOS 0.4.x branch, accessed 2026-06-03).

This note exists specifically to falsify or confirm the assumption: *"Iroh's no-port-forwarding win is redundant because StartOS auto-issues an onion."* The docs say **partially false**.

## Address types and their actual friction

| Address class | Auto for new bindPort? | User work required |
|---|---|---|
| LAN IPv4/IPv6 | yes | none |
| LAN mDNS (`<server>.local`) | yes | none |
| LAN HTTPS (Root CA) | yes for HTTP/HTTPS protocols | trust Root CA on client |
| Tor `.onion` | **NO** | install Tor service from marketplace, then click "Add Onion Service" per interface |
| Clearnet (custom domain) | **NO** | own domain, configure DNS, configure gateway (router or StartTunnel), pick CA (LE recommended), port-forward |
| StartTunnel VPS | **NO** | rent VPS (~$5-10/mo), configure subnet, register devices |

The interfaces page literally says "**The Tor table is empty by default**" — the OS does not issue an onion at install time.

## What this means for our SV2 packages today

Right now (`pool/startos/interfaces.ts:6-12`) we ship the canonical `bindPort(34254, { protocol: null, ... })`. After install the user gets:

- `<server-name>.local:34254` — works on LAN, zero config
- `<lan-ipv4>:34254` — works on LAN, zero config
- That's it.

For a remote miner reaching the pool over the public internet, the user must do **one** of:
1. Install Tor → enable onion for the pool's `downstream-multi` host → paste `<xyz>.onion:34254` to the miner. (Adds 30 sec of clicks per service. Latency penalty for mining.)
2. Configure clearnet: domain + DNS A-record + port-forward 34254 on router (or StartTunnel) + accept LE cert path or no-cert.
3. Configure VPN: WireGuard / StartTunnel.

## Implication for thesis

**Mixed.** Two key findings cut against assumptions in the research plan:

### Cuts against the strong "onion is the counterfactual" framing (i.e. *supports* the Iroh thesis a bit)
- Onions are NOT auto-issued in StartOS 0.4.x. The user has to install a separate package and create the onion. That's 2-3 extra screens of friction the Iroh thesis correctly identifies as a real cost.
- Tor latency and intermittent reliability are independently bad for stratum (sub-second share submission matters for hashrate variance, even if final settlement is on-chain).

### Cuts against the Iroh thesis (the strongest counterfactual)
- LAN mDNS is fully automatic. Many StartOS users *already* run their miners on the same LAN as their server (it's a self-hosting box on a home network). For them `<server>.local:34254` already works and Iroh adds nothing.
- The CGNAT/dynamic-IP scenario where Iroh would actually shine (no port-forwarding possible at all) is not the modal Start9 user — Start9's explicit "remote-access.html" guidance for that user is "use Tor, it's one-click after Tor install."
- Whatever Iroh does for transport, the *URL the user pastes into the miner* is still the bottleneck. Replacing `<onion>:34254` with `<irohNodeId>` is sideways, not 10x better, on copy-paste-UX axis.

## Where Iroh would still meaningfully help

1. **Pool ↔ JDC ↔ Translator service-to-service** — but on a single StartOS box these already share a Docker network, no transport magic needed.
2. **Pool ↔ Bitcoin Core IPC** — already handled by `mountDependency` at `main.ts:130-137`, no transport needed.
3. **Pool operator → remote miners across CGNAT, no Tor installed, no router access** — the genuine niche. But this user demographic intersects "running their own pool" thinly.

## Open questions

- Does StartOS 0.4.x auto-trust certs for LAN mDNS hostnames on the device that installed StartOS? (lan.html implies "trust your Root CA" — meaning it's a per-client one-time trust step, not zero-touch).
- Does StartTunnel support arbitrary TCP (port 34254) or HTTP-only? Need to dig into start-tunnel/port-forwarding docs.
