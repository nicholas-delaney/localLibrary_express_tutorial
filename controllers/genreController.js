var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require("express-validator");
const bookinstance = require('../models/bookinstance');

// Display list of all Genre.
exports.genre_list = function (req, res) {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.params.id)
        .exec(callback);
    },

    genre_books: function (callback) {
      Book.find({ 'genre': req.params.id })
        .exec(callback);
    },

  }, function (err, results) {
    if (err) { return next(err); }
    if (results.genre == null) { // No results.
      var err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
  });
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render('genre_form', { title: 'Create Genre', action: 'Create' });
};

// Handle Genre create on POST.
exports.genre_create_post = [

  // Validate and santise the name field.
  // trim - removes whitespace
  // isLength - checks the field is not empty
  // escape - removes dangerous HTML characters to prevent XSS
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre(
      { name: req.body.name }
    );


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
      return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec(function (err, found_genre) {
          if (err) { return next(err); }

          if (found_genre) {
            // Genre exists, redirect to its detail page.
            res.redirect(found_genre.url);
          }
          else {

            genre.save(function (err) {
              if (err) { return next(err); }
              // Genre saved. Redirect to genre detail page.
              res.redirect(genre.url);
            });

          }

        });
    }
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res) {
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.params.id).exec(callback);
    },
    genre_books: function (callback) {
      Book.find({ 'genre': req.params.id }).exec(callback);
    },
  }, function (err, results) {
    // check for errors
    if (err) { return next(err); }
    // check for no genres found
    if (results.genre == null) { res.redirect('/catalog/genres'); }
    // successfull so render
    res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
  });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res) {
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.body.genreid).exec(callback);
    },
    genre_books: function (callback) {
      Book.find({ 'genre': req.body.genreid }).exec(callback);
    },
  }, function (err, results) {
    if (err) { return next(err) };
    // success
    if (results.genre_books.length > 0) {
      // books associated with genre, render in same way as GET route
      res.render('genre_delete', { title: "Delete Genre", genre: results.genre, genre_books: results.genre_books });
      return;
    }
    else {
      // genre has no books, delete genre / redirect to list of genres
      Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
        if (err) { return next(err); }
        // success, go to genre list
        res.redirect('/catalog/genres');
      })
    }
  });
}


// Display Genre update form on GET.
exports.genre_update_get = function (req, res) {
  Genre.findById(req.params.id).exec(function(err, results) {
    if (err) { return next(err); }
    if (results == null) {
      var err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    // successful
    res.render('genre_form', { title: "Update genre", action: 'Update' });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // sanitize data
  body('name', 'name must not be empty.').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    // create new genre object with sanitized data
    var genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // there are errors, render form again and display error messages
      res.render('genre_form', { Title: 'Update Genre', action: 'Update', errors: errors.array() });
      return;
    }
    else {
      // data form is valid, update database
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, results) {
        if (err) { return next(err); }
        res.redirect(results.url);
      });
    }

  }

];