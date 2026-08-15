"""Authored page bodies. Each module exposes ``body(ctx)`` returning ``<main>`` inner HTML."""

from __future__ import annotations

from . import about, home, science, technology

__all__ = ["home", "technology", "science", "about"]
