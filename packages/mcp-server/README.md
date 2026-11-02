# mcp-server (planned: phase 4)

This folder is a placeholder. In phase 4 it will become the engine's
[Model Context Protocol](https://modelcontextprotocol.io) server, letting AI assistants:

- read the token schema and the brand contract,
- validate a `brand.json` and explain contract or contrast errors,
- inspect the tokens and specimens of a resolved brand.

It will expose structure only. Like the rest of web-studio, it must never contain or
return client assets, content or credentials. There is no package here yet, so pnpm
ignores this folder.
