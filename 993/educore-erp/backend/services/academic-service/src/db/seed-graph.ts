import neo4j from 'neo4j-driver';
import 'dotenv/config';

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'educore_neo4j_password'
  )
);

const seedQueries = [
  // Clear existing static policies to prevent duplicates during seeding
  `MATCH (p:Policy) DETACH DELETE p`,
  `MATCH (s:Stage) DETACH DELETE s`,

  // 1. NEP 2020 Policy (5+3+3+4)
  `CREATE (p:Policy {id: 'NEP_2020', name: 'National Education Policy 2020', type: 'NATIONAL'})`,
  `CREATE (s1:Stage {id: 'NEP_FOUNDATIONAL', name: 'Foundational Stage', duration_years: 5, index: 1})`,
  `CREATE (s2:Stage {id: 'NEP_PREPARATORY', name: 'Preparatory Stage', duration_years: 3, index: 2})`,
  `CREATE (s3:Stage {id: 'NEP_MIDDLE', name: 'Middle Stage', duration_years: 3, index: 3})`,
  `CREATE (s4:Stage {id: 'NEP_SECONDARY', name: 'Secondary Stage', duration_years: 4, index: 4})`,
  
  `MATCH (p:Policy {id: 'NEP_2020'}), (s1:Stage {id: 'NEP_FOUNDATIONAL'}), (s2:Stage {id: 'NEP_PREPARATORY'}), (s3:Stage {id: 'NEP_MIDDLE'}), (s4:Stage {id: 'NEP_SECONDARY'})
   CREATE (p)-[:HAS_STAGE]->(s1)
   CREATE (p)-[:HAS_STAGE]->(s2)
   CREATE (p)-[:HAS_STAGE]->(s3)
   CREATE (p)-[:HAS_STAGE]->(s4)
   CREATE (s1)-[:NEXT_STAGE]->(s2)
   CREATE (s2)-[:NEXT_STAGE]->(s3)
   CREATE (s3)-[:NEXT_STAGE]->(s4)`,

  // 2. Karnataka SEP 2025 Policy (2+8+4)
  `CREATE (p:Policy {id: 'KA_SEP_2025', name: 'Karnataka State Education Policy 2025', type: 'STATE'})`,
  `CREATE (s1:Stage {id: 'KA_LOWER', name: 'Lower Stage', duration_years: 2, index: 1})`,
  `CREATE (s2:Stage {id: 'KA_MIDDLE', name: 'Middle Stage', duration_years: 8, index: 2})`,
  `CREATE (s3:Stage {id: 'KA_HIGH', name: 'High Stage', duration_years: 4, index: 3})`,

  `MATCH (p:Policy {id: 'KA_SEP_2025'}), (s1:Stage {id: 'KA_LOWER'}), (s2:Stage {id: 'KA_MIDDLE'}), (s3:Stage {id: 'KA_HIGH'})
   CREATE (p)-[:HAS_STAGE]->(s1)
   CREATE (p)-[:HAS_STAGE]->(s2)
   CREATE (p)-[:HAS_STAGE]->(s3)
   CREATE (s1)-[:NEXT_STAGE]->(s2)
   CREATE (s2)-[:NEXT_STAGE]->(s3)`
];

async function seedGraph() {
  console.log('🌱 Starting Neo4j Graph Seeding...');
  const session = driver.session();
  try {
    for (const query of seedQueries) {
      await session.run(query);
    }
    console.log('✅ Graph seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error seeding graph:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedGraph();
