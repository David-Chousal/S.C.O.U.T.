# Thesis LaTeX Source (Overleaf)

> **Summary** — A snapshot of the S.C.O.U.T. thesis as it stands in Overleaf, in the SCU CSEN
> senior design template. It sits next to the Markdown working draft in [`docs/thesis/`](../README.md).
> The Overleaf project (`580_INTER`, owned by Michael Schimpf) is where the thesis is edited and
> compiled; this folder is a versioned copy. Snapshot taken 2026-10-26.

---

## What is in it

Chapter 1 (Introduction, 1.1 Problem Statement, 1.3 Objectives, 1.4 Our approach) is written,
with seven cited sources. The signature page and title page are filled in. Every other chapter,
and 1.2 Background or Related Work, is still the template's red placeholder text.

| File | Contents |
|---|---|
| `0010-master.tex` | Main file: packages, authors, title, degrees, signatures, chapter list |
| `0050-abstract.tex` … `1200-appendices.tex` | One file per chapter, in thesis order |
| `1150-references.bib` | Bibliography, compiled with biblatex (IEEE style, `sorting=none`, Biber) |
| `scu-thesis.cls` | SCU thesis class (unchanged from the template) |
| `tikz-uml.sty` | UML drawing package used by the design chapter (unchanged, v1.0) |
| `pictures/` | The template's two example diagrams |

## Names differ from Overleaf

Repo convention requires kebab-case file names, so the files were renamed on the way in and the
references inside them updated to match. The content is otherwise identical to Overleaf.

| Overleaf | Repo |
|---|---|
| `0010_master.tex` (and every `NNNN_name.tex`) | `0010-master.tex` (`NNNN-name.tex`) |
| `1150_references.bib` | `1150-references.bib` |
| `0000_pictures/ExampleUseCaseDiagram.png` | `pictures/example-use-case-diagram.png` |
| `0000_pictures/ExampleSequenceDiagram.jpg` | `pictures/example-sequence-diagram.jpg` |

To refresh the snapshot, download the Overleaf source zip, apply the same renames, and update the
`\include`, `\addbibresource` and `\includegraphics` paths in `0010-master.tex` and
`0300-design.tex`.

## Building it

Upload the folder to Overleaf, or build locally with `latexmk -pdf 0010-master.tex` (needs Biber).
On Overleaf's free plan a cold compile can time out because Biber adds passes; compiling a few
chapters at a time with `\includeonly{...}` warms the cache first.

## Two structures to reconcile

The Markdown draft follows the [Thesis Outline](../../planning/thesis-outline.md), whose Chapter 1
has five sections (Problem and Motivation, Technical and Societal Significance, Project Objectives,
Scope, Thesis Organization). The SCU CSEN template has four (Problem Statement, Background or
Related Work, Objectives, Our approach). The template is the one submitted to the library, so the
outline may need to follow it. This is an open question for the team, not decided here.
