# ReportEdge Voice Concierge

A free voice assistant for myreportedge.com. It uses the browser's built-in speech features, so there are no API keys, no server and no monthly cost.

## What it does

1. The user taps the 🎙️ button and the agent says: "Hi! Welcome to ReportEdge. What is your name?"
2. The user says their name, and the agent replies "Hi Vishnu, how are you today?"
3. The agent asks whether the user is an individual taxpayer or a company.
4. The relevant tool cards appear on screen while the agent speaks a short overview.
5. The user says a tool name (for example "advance tax calculator") or taps a card.
6. The site opens that tool's page. The agent explains the tool and gives a relatable example.
7. The user can say another tool name, "show all tools" or "start over".

## Files

| File | Purpose |
|---|---|
| `tools-config.js` | The tools, their summaries, spoken examples and page URLs. Edit this to change what the agent says. |
| `voice-agent.js` | The widget (UI, speech, conversation logic). |

## Install (3 steps)

1. Copy both files into your GitHub repo, for example into `/assets/voice/`.
2. Add these two lines before `</body>` on every page where the agent should appear. Keep `tools-config.js` first:

```html
<script src="/assets/voice/tools-config.js"></script>
<script src="/assets/voice/voice-agent.js"></script>
```

3. Commit and push, then deploy as you normally do.

The widget remembers the user's name and choices with `sessionStorage`. That is how it can explain a tool right after moving to that tool's page, so **include the scripts on every tool page**, not only the homepage.

## Browser support

| Browser | Voice speaking | Voice listening |
|---|---|---|
| Chrome / Edge (desktop and Android) | Yes | Yes |
| Safari | Yes | Partial |
| Firefox | Yes | No (typing fallback) |

- Voice listening needs **HTTPS**. Your site already has it.
- The microphone may send audio to the browser vendor's speech service. Say so in your privacy policy.
- Browsers can block speech after a page change. If that happens, a green "Hear the explanation" button appears.
- Every voice step also works by typing or tapping, so nobody is locked out.

## Customising

- **Change wording or add a tool:** edit `tools-config.js`. Each tool needs an `id`, `name`, `match` words, `summary`, `example` and `url`.
- **Check the URLs:** they come from the live site's links. Make sure each one still matches your real page paths.
- **Voice language:** change `LANG` at the top of `voice-agent.js` (for example `"en-US"` or `"hi-IN"`).
- **Colours:** edit the CSS string near the top of `voice-agent.js`.

## Keeping it free

Everything above is scripted, so it costs nothing to run. If you later want answers to open-ended questions such as "what is Section 54?", add a small backend that calls an LLM (many have free tiers) and send only unrecognised questions to it. Keep the tax numbers in your existing tools, because the agent should explain and not calculate.

## Safety note

The agent only explains the tools. It never asks for or reads out financial documents, and it does not give tax advice.
