const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); 

app.post('/execute-sql', async (req, res) => {
  const { host, user, password, database, port, query } = req.body;

  const pool = new Pool({
    host,
    user,
    password,
    database,
    port,
    max: 1, 
    idleTimeoutMillis: 10000, 
    connectionTimeoutMillis: 10000, // return an error after 10 seconds if connection could not be established
  });

  try {
    const client = await pool.connect();
    const result = await client.query(query);
    client.release();

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Error in /execute-sql:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
