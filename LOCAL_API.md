# LightRAG Local API

## Server Info
- **Base URL**: `http://127.0.0.1:9621`
- **API Docs**: http://127.0.0.1:9621/docs
- **Health**: http://127.0.0.1:9621/health

## Start Server
```bash
./run_server.sh
# or
lightrag-server --host 127.0.0.1 --port 9621
```

## Agent Endpoints

### Insert Document
```bash
curl -X POST http://127.0.0.1:9621/documents \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your document text here",
    "metadata": {"source": "agent"}
  }'
```

### Query (with modes: local, global, hybrid, naive, mix)
```bash
curl -X POST http://127.0.0.1:9621/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "your question",
    "mode": "hybrid"
  }'
```

### Search Documents
```bash
curl http://127.0.0.1:9621/documents
```

### Get Graph Status
```bash
curl http://127.0.0.1:9621/graph
```

## Storage
- **Working Dir**: `/Users/safeSpacesBro/gitLightRAG/rag_storage/`
- **Input Dir**: `/Users/safeSpacesBro/gitLightRAG/inputs/`
