import express from "express";
import pg from "pg";
import env from "dotenv";
import session from "express-session";

env.config();
const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/api/friends", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM friends ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to fetch friends from database" });
  }
});

app.post("/api/friends", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query(
      "INSERT INTO friends (name, balance) VALUES ($1, $2) RETURNING *",
      [name, 0],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not add friend" });
  }
});

app.patch("/api/friends/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment } = req.body;

    const result = await db.query(
      "UPDATE friends SET balance = balance + $1 WHERE id = $2 RETURNING *",
      [adjustment, id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/api/friends/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM friends WHERE id = $1", [id]);
    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not remove friend" });
  }
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
