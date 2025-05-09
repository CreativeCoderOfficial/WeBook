import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import env from "dotenv";

const app = express();
const port = 3000;
const coverAPI_url = "https://covers.openlibrary.org/b/isbn/";
const __dirname = dirname(fileURLToPath(import.meta.url));
env.config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.get("/", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn;"
  );
  const books = result.rows;

  res.render("index.ejs", { books: books });
});

app.get("/add", (req, res) => {
  res.render("add.ejs");
});

app.post("/add", async (req, res) => {
  const { title, author, isbn, rating, date_read, summary, notes } = req.body;
  try {
    await db.query(
      "INSERT INTO books_read (title, author, isbn) VALUES ($1, $2, $3);",
      [title, author, isbn]
    );
    await db.query(
      "INSERT INTO books_info(date_read, rating, summary, notes, book_isbn) VALUES ($1, $2, $3, $4, $5);",
      [date_read, rating, summary, notes, isbn]
    );

    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.get("/view/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const result = await db.query(
    "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn WHERE isbn = $1;",
    [isbn]
  );
  const book = result.rows[0];
  console.log(book);

  res.render("view.ejs", { book: book });
}),
  app.get("/edit/:isbn", async (req, res) => {
    const { isbn } = req.params;
    const result = await db.query(
      "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn WHERE isbn = $1;",
      [isbn]
    );
    const book = result.rows[0];
    console.log(book);

    res.render("edit.ejs", { book: book });
  });

app.get("/search", async (req, res) => {
  const { search, searchBy } = req.query;
  console.log(search, searchBy);
  let books = [];

  try {
    if (searchBy == "title") {
      const result = await db.query(
        "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn WHERE lower(title) LIKE '%' || $1 || '%' ",
        [search.toLowerCase()]
      );
      books = result.rows;
      console.log(books);
      res.render("index.ejs", { books: books });
    } 
    else if (searchBy == "rating") {
      console.log(
        `You searched by rating, the min rating was ${search} which is a ${typeof search}`
      );
      const result = await db.query(
        "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn WHERE rating >= TO_NUMBER($1, '9') ORDER BY rating DESC;",
        [search]
      );
      books = result.rows;
      console.log(books);
      res.render("index.ejs", { books: books });
    } 
    else if (searchBy == "date_read") {
      console.log(
        `You searched by date read, the starting date was ${search} which is a ${typeof search}`
      );
      const result = await db.query(
        "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn WHERE date_read >= $1 ORDER BY date_read;",
        [search]
      );
      books = result.rows;
      console.log(books);
      res.render("index.ejs", { books: books });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/edit/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const result = await db.query(
    "SELECT * FROM books_read as br JOIN books_info AS bi ON br.isbn = bi.book_isbn WHERE isbn = $1;",
    [isbn]
  );
  const book = result.rows[0];
  console.log(book);

  res.render("edit.ejs", { book: book });
});

app.post("/edit/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const { rating, summary, notes } = req.body;
  try {
    await db.query(
      "UPDATE books_info SET rating = $1, summary = $2, notes = $3 WHERE book_isbn = $4;",
      [rating, summary, notes, isbn]
    );
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.get("/delete/:isbn", async (req, res) => {
  console.log(req.body);
  console.log(req.params);
  const { isbn } = req.params;
  try {
    // First delete books_info because it has a foreign key constraint
    // with books_read
    await db.query("DELETE FROM books_info WHERE book_isbn = $1;", [isbn]);
    await db.query("DELETE FROM books_read WHERE isbn = $1;", [isbn]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
