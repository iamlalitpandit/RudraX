#!/usr/bin/env python3
"""RudraX optional runtime tools. Standard-library core; provider SDKs are optional."""
from __future__ import annotations
import argparse, json, os, sqlite3, subprocess, sys, urllib.request
from pathlib import Path

HOME = Path(os.environ.get("RUDRAX_HOME", Path.home() / ".rudrax"))

def fetch(url: str, method="GET", body=None, headers=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method, headers={"User-Agent": "RudraX/4.6", "Content-Type": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read()
        return json.loads(raw) if "json" in response.headers.get("content-type", "") else raw.decode(errors="replace")

def memory(args):
    path = Path(os.environ.get("RUDRAX_MEMORY_PATH", HOME / "memory.sqlite3")); path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path); db.execute("create table if not exists memory (id integer primary key, key text, value text, created_at text default current_timestamp)")
    if args.action == "set": db.execute("insert into memory(key,value) values(?,?)", (args.key, args.value)); db.commit(); return {"saved": args.key}
    rows = db.execute("select key,value,created_at from memory where key like ? order by id desc limit ?", (f"%{args.key or ''}%", args.limit)).fetchall(); return [{"key": k, "value": v, "createdAt": t} for k,v,t in rows]

def browser(args):
    if args.action == "fetch": return fetch(args.url)
    if args.action == "cdp": return fetch(os.environ.get("RUDRAX_CDP_URL", "http://127.0.0.1:9222") + "/json")
    raise RuntimeError("Use a configured RudraX browser provider for interactive automation")

def web(args):
    if args.action == "fetch": return fetch(args.url)
    key = os.environ.get("TAVILY_API_KEY")
    if not key: raise RuntimeError("TAVILY_API_KEY is not configured")
    return fetch("https://api.tavily.com/search", "POST", {"api_key": key, "query": args.query, "max_results": args.limit})

def media(args):
    if args.action == "vision":
        key = os.environ.get("OPENAI_API_KEY");
        if not key: raise RuntimeError("OPENAI_API_KEY is not configured")
        payload={"model": os.environ.get("RUDRAX_VISION_MODEL","gpt-4.1-mini"),"messages":[{"role":"user","content":[{"type":"text","text":args.prompt},{"type":"image_url","image_url":{"url":args.url}}]}]}
        return fetch("https://api.openai.com/v1/chat/completions","POST",payload,{"Authorization":f"Bearer {key}"})
    raise RuntimeError(f"Configure a RudraX {args.action} provider before use")

def debug(args):
    if args.action == "run": return {"exitCode": subprocess.call(args.command)}
    return {"debug": os.environ.get("RUDRAX_DEBUG", "0"), "daemonWorkers": os.environ.get("RUDRAX_DAEMON_WORKERS", "4")}

def main():
    p=argparse.ArgumentParser(prog="rudrax-tool"); p.add_argument("kind",choices=["browser","web","media","memory","debug"]); p.add_argument("action"); p.add_argument("--url"); p.add_argument("--query"); p.add_argument("--prompt",default="Describe this image"); p.add_argument("--key"); p.add_argument("--value"); p.add_argument("--limit",type=int,default=10); p.add_argument("command",nargs="*")
    args=p.parse_args(); result={"browser":browser,"web":web,"media":media,"memory":memory,"debug":debug}[args.kind](args); print(json.dumps(result,indent=2,ensure_ascii=False) if not isinstance(result,str) else result)
if __name__ == "__main__":
    try: main()
    except Exception as error: print(json.dumps({"error":str(error)}),file=sys.stderr); sys.exit(1)
