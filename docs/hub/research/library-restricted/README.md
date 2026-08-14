# Restricted Library (private submodule — not yet mounted)

The **copyrighted** papers in the [Source Registry](../sources.md) (marked 🔒) cannot be
committed to this public repo — redistributing paywalled journal PDFs would infringe. They live
in a **separate private GitHub repository**, mounted here as a git submodule so the team has the
full library while nothing infringing ever enters this repo's public history.

## Status: waiting on a private repo

This directory is a placeholder. To activate it:

1. **Create a private repo** on GitHub (e.g. `S.C.O.U.T.-library`). `gh` is not installed here,
   so create it in the browser (30 seconds).
2. Mount it as a submodule at this path:
   ```bash
   git submodule add git@github.com:<owner>/S.C.O.U.T.-library.git docs/hub/research/library-restricted
   git commit -m "chore(docs): mount private research library submodule"
   ```
3. Inside the submodule, store PDFs named `<key>.pdf` (matching the registry keys), then fill
   the **Local** column for each 🔒 row in [sources.md](../sources.md).

Once mounted, this README is replaced by the submodule's own contents. Cloning the main repo
without access to the private repo simply leaves this directory empty — the public repo stays
fully functional.

## What goes here

Every 🔒 work in [sources.md](../sources.md): *Science*, *Biological Conservation*, most *Methods
in Ecology and Evolution* papers, and the advisor's EACP paper (obtain directly from Navid
Shaghaghi). Confirm each ❓ access status before deciding public vs restricted.
