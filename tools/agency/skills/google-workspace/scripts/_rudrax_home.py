"""Resolve RUDRAX_CODING_AGENT_DIR for standalone skill scripts.

Skill scripts may run outside the RudraX process (e.g. system Python,
nix env, CI) where ``rudrax_constants`` is not importable.  This module
provides the same ``get_rudrax_home()`` and ``display_rudrax_home()``
contracts as ``rudrax_constants`` without requiring it on ``sys.path``.

When ``rudrax_constants`` IS available it is used directly so that any
future enhancements (profile resolution, Docker detection, etc.) are
picked up automatically.  The fallback path replicates the core logic
from ``rudrax_constants.py`` using only the stdlib.

All scripts under ``google-workspace/scripts/`` should import from here
instead of duplicating the ``RUDRAX_CODING_AGENT_DIR = Path(os.getenv(...))`` pattern.
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    from rudrax_constants import display_rudrax_home as display_rudrax_home
    from rudrax_constants import get_rudrax_home as get_rudrax_home
except (ModuleNotFoundError, ImportError):

    def get_rudrax_home() -> Path:
        """Return the RudraX home directory (default: ~/.rudrax/agent).

        Mirrors ``rudrax_constants.get_rudrax_home()``."""
        val = os.environ.get("RUDRAX_CODING_AGENT_DIR", "").strip()
        return Path(val) if val else Path.home() / ".rudrax"

    def display_rudrax_home() -> str:
        """Return a user-friendly ``~/``-shortened display string.

        Mirrors ``rudrax_constants.display_rudrax_home()``."""
        home = get_rudrax_home()
        try:
            return "~/" + str(home.relative_to(Path.home()))
        except ValueError:
            return str(home)
