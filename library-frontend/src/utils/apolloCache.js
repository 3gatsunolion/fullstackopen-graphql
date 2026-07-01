import { ALL_BOOKS, ALL_AUTHORS } from "../queries";

export const addBookToCache = (cache, bookToAdd) => {
  cache.updateQuery({ query: ALL_BOOKS }, (data) => {
    if (!data) return null;

    const { allBooks } = data;
    const bookExists = allBooks.some((book) => book.id === bookToAdd.id);

    if (bookExists) {
      return { allBooks };
    }

    return {
      allBooks: allBooks.concat(bookToAdd),
    };
  });
};
