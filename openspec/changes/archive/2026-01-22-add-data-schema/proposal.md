# Change: Add Data Schema Specification

## Why

The project lacks a formal definition of the event data format. Users need clear documentation on how to structure JSON files for import, especially when transforming data from Wikidata, RDF sources, or other knowledge graphs. Without a schema spec, data import is trial-and-error.

## What Changes

- **NEW** `data-schema` spec defining:
  - Event JSON structure (required/optional fields)
  - Time string formats (ISO 8601, human-readable dates, geological notation)
  - Support for Wikidata/RDF property mapping
  - Validation rules and error handling
  - Example files for different timescales

## Impact

- Affected specs: None (new capability)
- Affected code: `src/data/` (future data loader implementation)
- Related specs: `data-loading` (how to load), `time-coordinates` (how time is stored internally)

## Design Principles

1. **Easy to understand** - A historian or scientist should be able to create valid JSON without deep technical knowledge
2. **Wikidata-friendly** - Direct mapping from common Wikidata properties (P580 start time, P582 end time, etc.)
3. **Flexible time formats** - Accept human-readable dates ("March 15, 44 BC") alongside ISO 8601
4. **Graceful degradation** - Missing optional fields don't break import; validation errors are clear
