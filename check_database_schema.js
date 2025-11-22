const { Client } = require('pg');

const DATABASE_URL = "postgresql://root:xWWrkR138pfK5pzhSDUbrOse@vinson.liara.cloud:30081/postgres";

async function checkDatabaseSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully!\n');

    // Check if ANY tables exist
    console.log('='.repeat(60));
    console.log('CHECKING FOR TABLES IN DATABASE');
    console.log('='.repeat(60));

    const tablesQuery = `
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `;

    const tablesResult = await client.query(tablesQuery);

    if (tablesResult.rows.length === 0) {
      console.log('\n❌ NO TABLES FOUND IN DATABASE');
      console.log('The database exists but contains no user tables.\n');
    } else {
      console.log(`\n✓ Found ${tablesResult.rows.length} table(s)\n`);

      // List all tables
      console.log('Tables in database:');
      console.log('-'.repeat(60));
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_schema}.${row.table_name} (${row.table_type})`);
      });
      console.log('');

      // For each table, get detailed column information
      for (const tableRow of tablesResult.rows) {
        const schema = tableRow.table_schema;
        const table = tableRow.table_name;

        console.log('='.repeat(60));
        console.log(`TABLE: ${schema}.${table}`);
        console.log('='.repeat(60));

        const columnsQuery = `
          SELECT
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;

        const columnsResult = await client.query(columnsQuery, [schema, table]);

        console.log(`\nColumns (${columnsResult.rows.length} total):`);
        console.log('-'.repeat(60));

        columnsResult.rows.forEach((col) => {
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';

          console.log(`  - ${col.column_name}`);
          console.log(`    Type: ${col.data_type}${length}`);
          console.log(`    Nullable: ${nullable}`);
          if (defaultVal) console.log(`    Default: ${defaultVal}`);
        });

        // Get constraints (primary keys, foreign keys, unique)
        const constraintsQuery = `
          SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          LEFT JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.table_schema = $1 AND tc.table_name = $2
          ORDER BY tc.constraint_type, tc.constraint_name;
        `;

        const constraintsResult = await client.query(constraintsQuery, [schema, table]);

        if (constraintsResult.rows.length > 0) {
          console.log('\nConstraints:');
          console.log('-'.repeat(60));

          const grouped = {};
          constraintsResult.rows.forEach((row) => {
            if (!grouped[row.constraint_name]) {
              grouped[row.constraint_name] = {
                type: row.constraint_type,
                columns: [],
                foreign_ref: row.foreign_table_name ? `${row.foreign_table_name}(${row.foreign_column_name})` : null
              };
            }
            if (row.column_name) {
              grouped[row.constraint_name].columns.push(row.column_name);
            }
          });

          Object.entries(grouped).forEach(([name, info]) => {
            console.log(`  - ${name} (${info.type})`);
            console.log(`    Columns: ${info.columns.join(', ')}`);
            if (info.foreign_ref) {
              console.log(`    References: ${info.foreign_ref}`);
            }
          });
        }

        // Get indexes
        const indexesQuery = `
          SELECT
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = $1 AND tablename = $2
          ORDER BY indexname;
        `;

        const indexesResult = await client.query(indexesQuery, [schema, table]);

        if (indexesResult.rows.length > 0) {
          console.log('\nIndexes:');
          console.log('-'.repeat(60));
          indexesResult.rows.forEach((idx) => {
            console.log(`  - ${idx.indexname}`);
            console.log(`    Definition: ${idx.indexdef}`);
          });
        }

        console.log('\n');
      }
    }

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tables found: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('Tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    } else {
      console.log('Status: Database is EMPTY (no schema exists)');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error details:', error);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

checkDatabaseSchema();
