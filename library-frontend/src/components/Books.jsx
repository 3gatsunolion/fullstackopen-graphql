import { useQuery } from "@apollo/client/react";
import { ALL_BOOKS } from "../queries";
import { useState } from "react";

const Books = (props) => {
  let genres = ["all genres"];
  const [selectedGenre, setSelectedGenre] = useState(genres[0]);
  const result = useQuery(ALL_BOOKS, { skip: !props.show });
  const filteredResult = useQuery(ALL_BOOKS, {
    skip: !props.show,
    variables: {
      genre: selectedGenre === genres[0] ? undefined : selectedGenre,
    },
  });

  if (!props.show) {
    return null;
  }

  if (result.loading || filteredResult.loading) {
    return <div>loading...</div>;
  }

  if (result.error) {
    return <div>something happened :(</div>;
  }

  const allBooks = result.data.allBooks;
  genres = [...new Set(allBooks.flatMap((book) => book.genres))].concat(genres);
  const books = filteredResult.data.allBooks;

  return (
    <div>
      <h2>books</h2>

      <div>
        in genre: <b>{selectedGenre}</b>
      </div>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {genres.map((g) => (
          <button key={g} onClick={() => setSelectedGenre(g)}>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Books;
