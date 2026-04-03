#!/bin/bash
# LightRAG Local Server Launcher
cd /Users/safeSpacesBro/gitLightRAG
source .venv/bin/activate
export HOST=127.0.0.1
export PORT=9621
lightrag-server --host 127.0.0.1 --port 9621
