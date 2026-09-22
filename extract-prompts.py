#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract the human prompts of a Claude Code session into Markdown.

This script ships inside the repository on purpose: it is what makes PROMPTS.md
verifiable instead of asserted. The transcript is not reconstructed from memory
at the end of the day — it is generated from the session log, with timestamps,
and anyone can run it again.

  python3 extract-prompts.py                      # latest session for this repo
  python3 extract-prompts.py path/session.jsonl   # a specific one
  python3 extract-prompts.py --output PROMPTS.raw.md

It extracts ONLY the turns a person typed. Model replies and tool output are
left out, and that is where absolute paths, file contents and environment
variables travel.
"""
import argparse, getpass, glob, io, json, os, re, sys

def project_dir(cwd):
    """Claude Code stores sessions in ~/.claude/projects/<cwd, / replaced by ->"""
    slug = re.sub(r'[^A-Za-z0-9]', '-', os.path.abspath(cwd))
    return os.path.expanduser(os.path.join("~/.claude/projects", slug))

def latest_session(folder):
    files = glob.glob(os.path.join(folder, "*.jsonl"))
    if not files:
        sys.exit(f"No sessions found in {folder}")
    return max(files, key=os.path.getmtime)

def turn_text(msg):
    """The text a person typed, or '' when the turn is not one."""
    content = (msg or {}).get("content")
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts = []
    for block in content:
        if not isinstance(block, dict):
            continue
        # tool_result is tool output, not something the person wrote
        if block.get("type") != "text":
            continue
        parts.append(block.get("text", ""))
    return "\n".join(parts)

def is_noise(txt):
    """Drop what the environment injects into a user turn."""
    t = txt.strip()
    if not t:
        return True
    if t.startswith("<"):                      # system-reminder, command-name, ...
        return True
    if t.startswith("[Request interrupted"):
        return True
    return False

def scrub(txt, extra):
    """A safety net. It does not replace reading the output before committing."""
    user = getpass.getuser()
    txt = txt.replace(f"/Users/{user}", "~").replace(f"/home/{user}", "~")
    txt = re.sub(r'\b[\w.+-]+@[\w-]+\.[\w.]+\b', "<email>", txt)
    for s in extra:
        if s:
            txt = txt.replace(s, "<redacted>")
    return txt

def main():
    p = argparse.ArgumentParser()
    p.add_argument("session", nargs="?", help="path to a .jsonl; defaults to this repo's latest")
    p.add_argument("--output", default="PROMPTS.raw.md")
    p.add_argument("--redact", default="", help="extra comma-separated strings to hide")
    args = p.parse_args()

    source = args.session or latest_session(project_dir(os.getcwd()))
    extra = [s.strip() for s in args.redact.split(",") if s.strip()]

    prompts = []
    for line in io.open(source, encoding="utf-8"):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get("type") != "user" or d.get("isMeta"):
            continue
        txt = turn_text(d.get("message"))
        if is_noise(txt):
            continue
        prompts.append((d.get("timestamp", "")[:19].replace("T", " "), scrub(txt.strip(), extra)))

    with io.open(args.output, "w", encoding="utf-8") as fh:
        fh.write("# Prompts — raw transcript\n\n")
        fh.write(f"Generated with `extract-prompts.py` from `{os.path.basename(source)}`.\n")
        fh.write("These are the turns a person typed, unedited. The narrative of what was\n")
        fh.write("accepted and what was rejected lives in `PROMPTS.md`.\n\n")
        fh.write(f"**{len(prompts)} prompts.**\n\n---\n\n")
        for i, (when, txt) in enumerate(prompts, 1):
            fh.write(f"### {i}. `{when}`\n\n")
            fh.write("\n".join("> " + l if l.strip() else ">" for l in txt.splitlines()))
            fh.write("\n\n")

    print(f"{len(prompts)} prompts -> {args.output}  (source: {source})")
    print("Read it in full before committing. The scrubbing is a net, not a guarantee.")

if __name__ == "__main__":
    main()
