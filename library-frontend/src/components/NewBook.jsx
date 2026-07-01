import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import useField from "../hooks/useField";
import { ALL_BOOKS, ALL_AUTHORS, CREATE_BOOK } from "../queries";
import { addBookToCache } from "../utils/apolloCache";
import { useNotificationActions } from "../hooks/useNotification";

const NewBook = (props) => {
  const { reset: resetTitle, ...title } = useField("text");
  const { reset: resetAuthor, ...author } = useField("text");
  const { reset: resetPublished, ...published } = useField("number");
  const { reset: resetGenre, ...genre } = useField("text");
  const [genres, setGenres] = useState([]);
  const { showNotification } = useNotificationActions();

  const [createBook] = useMutation(CREATE_BOOK, {
    // Apollo Client cannot automatically update the cache of an application
    // so we can set an option so that the query fetching all books is done again
    // whenever a new book is created OR update cache ourselves manually
    refetchQueries: [{ query: ALL_AUTHORS }],
    update: (cache, response) => {
      const addedBook = response.data.addBook;
      addBookToCache(cache, addedBook);
    },
    onError: (e) =>
      showNotification(`Could not create book. ${e.message}`, true),
  });

  if (!props.show) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();

    console.log("add book...");
    await createBook({
      variables: {
        title: title.value,
        author: author.value,
        published: parseInt(published.value) || 0,
        genres,
      },
    });

    resetTitle();
    resetPublished();
    resetAuthor();
    setGenres([]);
    resetGenre();
  };

  const addGenre = () => {
    if (!genre.value) return;
    setGenres(genres.concat(genre.value));
    resetGenre();
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          <label>
            title
            <input {...title} />
          </label>
        </div>
        <div>
          <label>
            author
            <input {...author} />
          </label>
        </div>
        <div>
          <label>
            published
            <input {...published} />
          </label>
        </div>
        <div>
          <label>
            genre
            <input {...genre} />
          </label>
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(" ")}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  );
};

export default NewBook;
