# Institutional Graph Ontology & DB Design (Neo4j)

## Node Hierarchy
```
Institution
 └── Academic Year
      └── Campus
           └── Department
                └── Class → Section → Subject
Human actors: Student, Parent, Teacher, Staff (linked via relationship edges, not FKs)
Operational domains: Transport, Hostel, Library, Examination, Finance, HR, Assets, Compliance
   → all feed into: Analytics, AI Knowledge
```

## Why Neo4j Alongside PostgreSQL
PostgreSQL handles transactional consistency; Neo4j handles relationship depth and causal
analysis — e.g., "which teachers taught students who later defaulted on fees" is a graph
traversal query, not a multi-join SQL query.

## Cypher Indexing
NER-extracted entities (from `extracted_entities` in Postgres) are linked into the graph as
nodes with edges back to their `source_id` (student note, curriculum doc) — enabling
retrieval-augmented generation and cross-module reasoning by AI agents.

## Sync Strategy
Graph nodes are eventually-consistent projections from Postgres/event streams — never the
system of record for financial or identity data. The graph is additive intelligence, not a
replacement transactional store.
