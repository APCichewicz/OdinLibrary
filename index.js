//a dataclass for books to hold all the data for a book including the read status
class Book {
  constructor(title, author, isbn, pages, imageLinks, read = false) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
    this.pages = pages;
    this.imageLinks = imageLinks;
    this.read = read;
  }
}
//a class for the library to hold all the books and methods to add, remove, get, and get all books
class Library {
  constructor() {
    this.books = [];
  }
  addBook(book) {
    this.books.push(book);
  }
  removeBook(isbn) {
    this.books = this.books.filter((book) => book.isbn !== isbn);
  }
  getBook(isbn) {
    return this.books.find((book) => book.isbn === isbn);
  }
  getBooks() {
    return this.books;
  }
}

//a class to instantiate an object which will handle all the form validation and submission logic
class Validator {
  //constructor takes in the form element
  constructor(form) {
    this.form = form;
    this.customValidations = [];
    this.init();
  }
  //method to initiate the event listeners for the form including the submit event and the blur event for each input
  init() {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (this.validate()) {
        const title = form.title.value;
        const author = form.author.value;
        const pages = form.pages.value;
        const read = form.read.checked;
        fetchBookDataFromGoogleBooksApiByTitle(title, author, read, pages).then(
          (book) => {
            library.addBook(book);
            renderBooks();
            this.form.reset();
          }
        );
      }
    });
    this.form.querySelectorAll("input").forEach((field) => {
      field.addEventListener("blur", (event) => {
        this.validateField(event.target);
      });
    });
  }
  //method to register a custom validation function for a field, and store it within the validator 2D array of custom validations
  //the custom validation function takes in the field and returns an object with a status and a message
  //the status is a boolean which determines if the field is valid or not
  //the message is a string which is the error message to display if the field is invalid
  //the index of the custom validation function is stored in the field's customValidator property so that we can easily access it later
  registerCustomValidation(field, callback) {
    //check the field for a customValidator property
    //if it does, then we can push the callback function into the customValidations array at the index of the customValidator property
    //if it doesn't, then we can push the callback function into the customValidations array and set the customValidator property to the index of the callback function
    if (field.customValidator) {
      this.customValidations[field.customValidator].push(callback);
    } else {
      field.customValidator = this.customValidations.length;
      this.customValidations.push([callback]);
    }
  }
  //method to validate all the fields in the form
  //if any field returns an invalid status, then the form is invalid
  validate() {
    let isValid = true;
    this.form.querySelectorAll("input").forEach((field) => {
      isValid = this.validateField(field);
      if (!isValid) {
        return isValid;
      }
    });
    return isValid;
  }
  validateField(field) {
    let baseValidity = field.checkValidity();
    let customValidationMessage = "";
    // if baseValidity is true then we can check custom validations
    if (baseValidity) {
      let customValidatorIndex = field.customValidator;
      if (customValidatorIndex !== undefined) {
        let customValidationList = this.customValidations[customValidatorIndex];
        customValidationList.forEach((customValidation) => {
          customValidationMessage = customValidation(field);
        });
      }
    }
    //if after custom validity checks isvalid is still true, then we can set the field to valid and remove error message if it exists
    if (baseValidity && !customValidationMessage) {
      field.classList.remove("invalid");
      field.classList.add("valid");
      let error = field.parentElement.querySelector(".error");
      error.innerText = customValidationMessage;
    } else {
      //if after custom validity checks isvalid is still false, then we can set the field to invalid and add error message if it doesn't exist
      field.classList.remove("valid");
      field.classList.add("invalid");
      let error = field.parentElement.querySelector(".error");
      error.innerText = customValidationMessage || field.validationMessage;
    }
    return baseValidity && !customValidationMessage;
  }
}

const library = new Library();
//a function to fetch book data from the google books api by title and author
async function fetchBookDataFromGoogleBooksApiByTitle(
  title,
  author,
  read = false,
  pages = 0
) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=${title}+inauthor:${author}&key=AIzaSyBdA0gZJkUQxqXnfIcQvmrvR6PuL2q1KYs`;
  let response = await fetch(url);
  let data = await response.json();
  data = data.items[0].volumeInfo;
  if (pages === 0 || pages === undefined) {
    pages = data.pageCount;
  }
  return new Book(
    data.title,
    data.authors,
    data.industryIdentifiers[0].identifier,
    pages,
    data.imageLinks.thumbnail,
    read
  );
}
function renderBooks() {
  const books = library.getBooks();
  const booksContainer = document.querySelector("#books");
  while (booksContainer.firstChild) {
    booksContainer.removeChild(booksContainer.firstChild);
  }
  books.forEach((book) => {
    const bookCard = document.createElement("div");
    bookCard.innerHTML = `
            <div class="card">
                <img src="${book.imageLinks}" alt="${book.title}">
                <div class="card-body">
                    <h5 class="card-title">Title: ${book.title}</h5>
                    <p class="card-text">Author: ${book.author}</p>
                    <p class="card-text">Pages: ${book.pages}</p>
                    <p class="card-text" id="isbn">ISBN: ${book.isbn}</p>
                    <button class="btn" id="remove">Remove</button>
                <div>
            </div>
        `;
    booksContainer.appendChild(bookCard);
    if (book.read) {
      bookCard.querySelector(".card").classList.add("read");
    }
  });
  document.querySelectorAll("#remove").forEach((button) => {
    button.addEventListener("click", (e) => {
      const isbn = e.target.parentElement
        .querySelector("#isbn")
        .textContent.split(" ")[1];
      library.removeBook(isbn);
      renderBooks();
    });
  });
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("read");
      let book = library.getBooks().find((book) => {
        return (
          book.isbn === card.querySelector("#isbn").textContent.split(" ")[1]
        );
      });
      book.read = !book.read;
      renderBooks();
    });
  });
}

document.querySelector("#new-book").addEventListener("click", () => {
  const modal = document.querySelector(".modal");
  modal.style.display = "flex";
});

document.querySelector(".modal").addEventListener("click", (e) => {
  if (e.target.className === "modal") {
    e.target.style.display = "none";
  }
});

document.querySelector(".modal-content").addEventListener("click", (e) => {
  e.stopPropagation();
});
Promise.all([
  fetchBookDataFromGoogleBooksApiByTitle("the way of kings", "sanderson", true),
  fetchBookDataFromGoogleBooksApiByTitle("mistborn", "brandon sanderson"),
  fetchBookDataFromGoogleBooksApiByTitle("elantris", "brandon", true, 500),
])
  .then((books) => {
    books.forEach((book) => {
      library.addBook(book);
    });
  })
  .then(() => {
    renderBooks();
  })
  .catch((error) => {
    console.error(error);
  });

const form = document.querySelector("form");
const formValidator = new Validator(form);

//a custom validation to check if the title only contains letters, numbers, and spaces
//i.e no special characters are allowed in a book title.
//i know there are books that have special characters in their titles, but i'm just using this as an example
//particularly because i wanted to practice regex and custom validations in javascript
formValidator.registerCustomValidation(form.title, (field) => {
  let message = "Title must only contain letters, numbers, and spaces";
  let regex = new RegExp(/^[a-zA-Z0-9\s]*$/);
  if (regex.test(field.value)) {
    message = "";
  }
  return message;
});
