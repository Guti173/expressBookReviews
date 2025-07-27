const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { // returns boolean
    return !users.some(u => u.username === username);
}

const authenticatedUser = (username, password) => { // returns boolean
    return users.some(u => u.username === username && u.password === password);
}

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // a) Both username and password should be provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // b) Validate user credentials
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    // c) Generate JWT access token
    const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });

    // d) Save the token in the session for protected routes
    req.session.authorization = { accessToken };

    return res.status(200).json({
        message: "User successfully logged in",
        accessToken
    });
});

// Add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.user.username; // comes from JWT middleware

    // 1) Check if the book exists
    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // 2) Ensure review parameter is provided
    if (!review) {
        return res.status(400).json({ message: "Review query parameter is required" });
    }

    // 3) Add or update the user's review
    book.reviews[username] = review;

    // 4) Return the updated reviews
    return res.status(200).json({
        message: "Review added/updated successfully",
        reviews: book.reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.user.username; // comes from JWT middleware

    // 1) Check if the book exists
    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // 2) Check if the user has a review for this book
    if (!book.reviews[username]) {
        return res.status(404).json({ message: "Review by user not found" });
    }

    // 3) Delete the user's review
    delete book.reviews[username];

    // 4) Return the updated reviews
    return res.status(200).json({
        message: "Review deleted successfully",
        reviews: book.reviews
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
