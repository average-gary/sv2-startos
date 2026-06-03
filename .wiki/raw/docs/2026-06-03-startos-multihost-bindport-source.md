---
title: "start-sdk MultiHost.bindPort source — what one bind actually publishes"
type: docs
source: "local /Users/garykrause/repos/sv2-startos/pool/node_modules/@start9labs/start-sdk/base/lib/interfaces/Host.{js,d.ts} (mirrors github.com/Start9Labs/start-os/sdk/base/lib/interfaces/Host.ts)"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: nuances
evidence_strength: "code-inspection"
tags: [startos, sdk, multihost, bindport, internals, networking]
summary: "Reads the MultiHost.bindPort/Origin.export source: one call registers a port-binding intent with the host effects API, then returns an Origin that auto-attaches to whatever address surfaces (mDNS/Tor/clearnet) the OS has provisioned. Tor onion attaches only if a Tor service is installed."
---

# What `bindPort` actually does (from start-sdk source)

Local files:
- `pool/node_modules/@start9labs/start-sdk/base/lib/interfaces/Host.d.ts:91`
- `pool/node_modules/@start9labs/start-sdk/base/lib/interfaces/Host.js:59-107`
- `pool/node_modules/@start9labs/start-sdk/base/lib/osBindings/BindOptions.d.ts:1-8`
- `pool/node_modules/@start9labs/start-sdk/base/lib/osBindings/AddressInfo.d.ts:1-10`

## Known protocols (Host.js:6-35)

```js
exports.knownProtocols = {
  http:  { secure: null,        defaultPort: 80,  withSsl: 'https', alpn: ['http/1.1'] },
  https: { secure: { ssl: true }, defaultPort: 443 },
  ws:    { secure: null,        defaultPort: 80,  withSsl: 'wss',   alpn: ['http/1.1'] },
  wss:   { secure: { ssl: true }, defaultPort: 443 },
  ssh:   { secure: { ssl: false }, defaultPort: 22 },
  dns:   { secure: { ssl: false }, defaultPort: 53 },
}
```

Six protocols are first-class. Anything else (including raw stratum/SV2/p2p) goes through `bindPortForUnknown` with `protocol: null`.

## The unknown-protocol path (Host.js:67-75)

```js
async bindPortForUnknown(internalPort, options) {
  const binderOptions = {
    id: this.options.id,
    internalPort,
    ...options, // preferredExternalPort, addSsl, secure
  };
  await this.options.effects.bind(binderOptions);
  return new Origin_1.Origin(this, internalPort, null, null);
}
```

`effects.bind(...)` is the host-side syscall. The SDK's job ends there — the OS-side `embassyd` daemon takes that registration and does the **address provisioning** (mDNS broadcast, IP advertisement, optional onion attach if Tor installed).

## What the Origin does (Origin.d.ts:11-21)

```ts
build({ username, path, query, schemeOverride }): AddressInfo
export(serviceInterfaces: ServiceInterfaceBuilder[]): Promise<AddressInfo[] & AddressReceipt>
```

`AddressInfo` (osBindings/AddressInfo.d.ts) is just `{ username, hostId, internalPort, scheme, sslScheme, suffix }`. The actual `<onion>.onion` and `<server>.local` strings are concatenated by StartOS at *display time* — they live in the OS-side host registry, not in the package.

## Implication for thesis

**Nuances.** Confirms two things:

1. **The SDK is transport-agnostic enough that a future "Iroh interface" could be added without breaking the API contract.** It would need a new entry in `knownProtocols` (e.g. `iroh` with a `withSsl: null, scheme: 'iroh'`) plus a new `Origin` subtype that fans out an `iroh-nodeId://...` address. Today this does not exist upstream — we'd be patching `start-os` itself or shipping a custom side-channel.

2. **There is no plug-in point for a package to inject "give me an iroh nodeId as one of my addresses."** The `MultiHost`/`Origin` pair is a closed set: TCP port → list of OS-managed transport addresses. A package adding Iroh today would have to mint nodeId strings *outside* the StartOS interface system (e.g. printed to logs or via a custom action), which would break the "Copy" UX users expect from every other Start9 service.

That last point is the load-bearing one for this research path: StartOS's user-setup-ergonomics ceiling for our SV2 packages is set by what surfaces in the **service-page address table**. Whatever Iroh does at the wire level, if its nodeId doesn't appear in that table the way `<onion>:34254` does, the UX win evaporates. Reaching parity requires upstream SDK work, not just adopting a fork.
