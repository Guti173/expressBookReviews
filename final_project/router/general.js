const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    // 1) username and password must be provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // 2) check that the user does not already exist in the users array
    const exists = users.some(u => u.username === username);
    if (exists) {
        return res.status(409).json({ message: "Username already exists" });
    }

    // 3) register the user
    users.push({ username, password });
    return res.status(201).json({ message: "User successfully registered" });
});

// Get the list of all books available in the shop
public_users.get('/', function (req, res) {
    res.send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    res.send(books[isbn]);
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
    const authorQuery = req.params.author.toLowerCase();
    // 1) get all the ISBNs
    const matching = Object.keys(books)
        // 2) filter by matching author (case-insensitive)
        .filter(isbn => books[isbn].author.toLowerCase() === authorQuery)
        // 3) map to include isbn in the resulting object
        .map(isbn => ({ isbn, ...books[isbn] }));

    if (matching.length > 0) {
        return res.json(matching);
    } else {
        return res.status(404).json({ message: "No books found for the given author" });
    }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    const titleQuery = req.params.title.toLowerCase();
    const matching = Object.keys(books)
        // filter by matching title (case-insensitive)
        .filter(isbn => books[isbn].title.toLowerCase() === titleQuery)
        .map(isbn => ({ isbn, ...books[isbn] }));

    if (matching.length > 0) {
        return res.json(matching);
    } else {
        return res.status(404).json({ message: "No books found with the given title" });
    }
});

// Get book reviews
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book) {
        return res.json(book.reviews);
    } else {
        return res.status(404).json({ message: "Book with the given ISBN not found" });
    }
});

module.exports.general = public_users;
