CREATE TABLE books_read (
	isbn VARCHAR(13) PRIMARY KEY,
	title TEXT
);

CREATE TABLE books_info (
	id SERIAL PRIMARY KEY,
	date_read DATE,
	rating FLOAT,
	summary TEXT,
	notes TEXT,
	book_isbn VARCHAR(13) REFERENCES books_read(isbn)
);

ALTER TABLE books_read ADD COLUMN author VARCHAR(100);

INSERT INTO books_read(isbn, title) 
VALUES ('1847941834', 'Atomic Habits')

UPDATE books_read
SET author = 'James Clear'
WHERE isbn = '1847941834';

INSERT INTO books_info(date_read, rating, summary, notes, book_isbn)
VALUES ('2020-01-01', 9, 'Great book', '1% improvement everyday equates to 365% improvement every year.', '1847941834');

SELECT *  FROM books_read as br JOIN books_info as bi ON br.isbn = bi.book_isbn;

