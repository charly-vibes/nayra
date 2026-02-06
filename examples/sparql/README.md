# SPARQL Queries for Wikidata

Example queries for fetching timeline data from [Wikidata](https://www.wikidata.org/).

## Usage

1. Open [query.wikidata.org](https://query.wikidata.org/)
2. Paste the query content
3. Click "Run" (or press Ctrl+Enter)
4. Download results as JSON
5. Transform with Nayra's Wikidata transformer:

```javascript
import { transformWikidataResults } from '../../src/data/wikidata-transformer.js';

const response = await fetch('results.json');
const data = await response.json();
const events = transformWikidataResults(data.results.bindings);
```

## Queries

| File | Description |
|------|-------------|
| `wars.sparql` | Major wars with start/end dates |
| `space-missions.sparql` | Space missions with launch/landing dates |
| `ancient-events.sparql` | Ancient battles (BCE dates) |
| `scientists.sparql` | Scientists with birth/death dates |

## Property Reference

| Wikidata Property | Nayra Field |
|-------------------|-------------|
| `?item` (URI) | `id` |
| `?itemLabel` | `label` |
| `?itemDescription` | `description` |
| `?startTime` | `start` |
| `?endTime` | `end` |
