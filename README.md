# Postman to Bruno Converter

A standalone, enterprise-grade converter for migrating Postman collections to [Bruno](https://www.usebruno.com/) format.

## Features

- **Fully Standalone** - No npm installation required, works in air-gapped environments
- **Enterprise Scale** - Batch processing for 10,000+ collections
- **Complete Conversion** - Handles requests, folders, auth, scripts, variables, and more
- **Script Translation** - Automatically converts Postman's `pm.*` API to Bruno's `bru.*` equivalents

## Quick Start

```bash
# Clone the repository
git clone https://github.com/rreyn-bruno/postman-to-bruno.git
cd postman-to-bruno

# Install dependencies
npm install

# Convert a single collection
node bin/postman-to-bruno.js my-collection.postman_collection.json

# Convert with verbose output
node bin/postman-to-bruno.js my-collection.postman_collection.json ./output --verbose
```

## Batch Processing

For large-scale migrations with multiple collections:

```bash
node bin/postman-to-bruno-batch.js ./postman-exports ./bruno-collections --verbose

# Continue on errors (skip failed collections)
node bin/postman-to-bruno-batch.js ./postman-exports ./bruno-collections --continue
```

## What Gets Converted

### Request Properties
| Postman | Bruno |
|---------|-------|
| URL & Method | ✅ Fully supported |
| Query Parameters | ✅ Fully supported |
| Path Variables | ✅ Fully supported |
| Headers | ✅ Including disabled headers |
| Request Body | ✅ JSON, Text, XML, Form, Multipart, GraphQL |

### Authentication
| Type | Status |
|------|--------|
| Basic Auth | ✅ |
| Bearer Token | ✅ |
| API Key | ✅ |
| OAuth 2.0 | ✅ |
| AWS Signature v4 | ✅ |
| Digest Auth | ✅ |

### Scripts
Pre-request and test scripts are automatically translated:

```javascript
// Postman
pm.environment.get("token")
pm.collectionVariables.set("orderId", value)
pm.response.json()
pm.test("Status is 200", () => { ... })

// Converted to Bruno
bru.getEnvVar("token")
bru.setVar("orderId", value)
res.getBody()
test("Status is 200", () => { ... })
```

### Folder Structure
- Collection folders → Bruno directories
- Folder-level auth and scripts → `folder.bru` files
- Collection-level settings → `collection.bru` file

## Output Structure

```
My-Collection/
├── bruno.json           # Bruno collection config
├── collection.bru       # Collection-level settings & scripts
├── Auth/
│   ├── folder.bru       # Folder settings
│   ├── Login.bru        # Request file
│   └── Logout.bru
└── Orders/
    ├── folder.bru
    ├── Create Order.bru
    └── Get Order.bru
```

## Supported Postman Versions

- Postman Collection v2.0
- Postman Collection v2.1

## Requirements

- Node.js 16+
- lodash (only dependency)

## License

MIT

